// templates.js

// 各テンプレートは window.TEMPLATES オブジェクトのプロパティとして定義します。
// key がセレクトボックスの表示名、および tplSelect.value になります。
// 各テンプレートは files 配列を持ち、name（ファイル名）と content（ファイル中身）を指定します。

window.TEMPLATES = {
  "ML Project Template": {
    files: [
      { name: "model/best_model.weight.h5", content: "" },
      { name: "model/learn_model.weight.h5", content: "" },
      { name: "src/main.py", content:
`import sys

def main():
    print("Hello, ML World!")

if __name__ == "__main__":
    main()` },
      { name: "src/utils/api.py", content:
`import requests

def fetch_data(url):
    response = requests.get(url)
    return response.json()` },
      { name: "src/utils/audio.py", content:
`import soundfile as sf

def load_audio(path):
    data, rate = sf.read(path)
    return data, rate` },
      { name: "src/utils/camera.py", content:
`import cv2

def capture_frame():
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()
    return frame` },
      { name: "README.md", content:
`# ML Project

This project contains model weights, source code, and scripts to run the application.` },
      { name: "requirements.txt", content:
`numpy
requests
soundfile
opencv-python` },
      { name: "run.sh", content:
`#!/bin/bash
python3 src/main.py` }
    ]
  }
};
