import os
import argparse
import numpy as np
import tensorflow as tf
from datetime import datetime, timedelta
import time
import random

from train_data import build_dataset

__version__ = "0.18.1"

def set_seed(seed=42):
    np.random.seed(seed)
    random.seed(seed)
    tf.random.set_seed(seed)

def build_model(seq_length):
    inputs = tf.keras.Input(shape=(seq_length, 3), name='input_notes')
    x = tf.keras.layers.LSTM(256)(inputs)
    pitch_out = tf.keras.layers.Dense(128, name='pitch')(x)
    step_out  = tf.keras.layers.Dense(1,   name='step')(x)
    dur_out   = tf.keras.layers.Dense(1,   name='duration')(x)
    return tf.keras.Model(inputs=inputs,
                          outputs={'pitch': pitch_out,
                                   'step': step_out,
                                   'duration': dur_out})

class SaveBestValLoss(tf.keras.callbacks.Callback):
    def __init__(self, filepath):
        super().__init__()
        self.filepath = filepath
        self.best_loss = np.Inf

    def on_epoch_end(self, epoch, logs=None):
        val_loss = logs.get('val_loss')
        if val_loss is not None and val_loss < self.best_loss:
            self.best_loss = val_loss
            self.model.save_weights(self.filepath)
            print(f"🍺 Epoch {epoch+1}: val_loss improved to {val_loss:.4f}, saving to {self.filepath}")

class EmojiEarlyStopping(tf.keras.callbacks.EarlyStopping):
    def on_train_end(self, logs=None):
        if self.stopped_epoch > 0:
            print(f"☠️ EarlyStopping at epoch {self.stopped_epoch}: best val_loss = {self.best}")
        super().on_train_end(logs)

def format_duration(seconds):
    return str(timedelta(seconds=int(seconds)))

def main():
    parser = argparse.ArgumentParser(description=f"Train next-note prediction model (ver {__version__})")
    parser.add_argument('--epochs',      type=int, default=50, help="Total epochs to train")
    parser.add_argument('--batch_size',  type=int, default=64, help="Batch size")
    parser.add_argument('--seq_length',  type=int, default=20, help="Sequence length")
    parser.add_argument('--patience',    type=int, default=30, help="EarlyStopping patience")
    parser.add_argument('--data_dir',    type=str, default='data', help="Directory of training data")
    parser.add_argument('--model_dir',   type=str, default='models', help="Directory to save models")
    parser.add_argument('--seed',        type=int, default=42, help="Random seed for reproducibility")
    args = parser.parse_args()

    set_seed(args.seed)

    os.makedirs(args.model_dir, exist_ok=True)
    checkpoint_path = os.path.join(args.model_dir, 'best_model.weights.h5')

    print("🔧 Loading and preparing dataset...")
    X, Y_pitch, Y_step, Y_dur = build_dataset(data_dir=args.data_dir, seq_length=args.seq_length)
    N = X.shape[0]
    split = int(N * 0.9)
    X_train, X_val = X[:split], X[split:]
    Yp_train, Yp_val = Y_pitch[:split], Y_pitch[split:]
    Ys_train, Ys_val = Y_step[:split], Y_step[split:]
    Yd_train, Yd_val = Y_dur[:split], Y_dur[split:]

    train_ds = (tf.data.Dataset.from_tensor_slices((X_train, {'pitch': Yp_train, 'step': Ys_train, 'duration': Yd_train}))
                .shuffle(len(X_train))
                .cache()
                .batch(args.batch_size, drop_remainder=True)
                .prefetch(tf.data.AUTOTUNE))

    val_ds = (tf.data.Dataset.from_tensor_slices((X_val, {'pitch': Yp_val, 'step': Ys_val, 'duration': Yd_val}))
              .batch(args.batch_size, drop_remainder=True)
              .prefetch(tf.data.AUTOTUNE))

    print("📐 Building model...")
    model = build_model(args.seq_length)

    losses = {
        'pitch': tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
        'step': tf.keras.losses.MeanSquaredError(),
        'duration': tf.keras.losses.MeanSquaredError()
    }
    metrics = {
        'pitch': [tf.keras.metrics.SparseCategoricalAccuracy(name="accuracy")]
    }

    model.compile(optimizer='adam', loss=losses, metrics=metrics)

    callbacks = [
        SaveBestValLoss(checkpoint_path),
        EmojiEarlyStopping(monitor='val_loss', patience=args.patience, restore_best_weights=True)
    ]

    start_time = time.time()
    print(f"🚀 Training started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    with tf.device("/GPU:0" if tf.config.list_physical_devices("GPU") else "/CPU:0"):
        history = model.fit(
            train_ds,
            epochs=args.epochs,
            steps_per_epoch=len(X_train) // args.batch_size,
            validation_data=val_ds,
            validation_steps=len(X_val) // args.batch_size,
            callbacks=callbacks,
            verbose=1
        )

    elapsed = time.time() - start_time
    print(f"🏁 Training finished at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"⏱️ Total training time: {format_duration(elapsed)}")

if __name__ == '__main__':
    main()
