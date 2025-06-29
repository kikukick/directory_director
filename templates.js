// templates.js

// 各テンプレートは window.TEMPLATES オブジェクトのプロパティとして定義します。
// key がセレクトボックスの表示名、および tplSelect.value になります。
// 各テンプレートは files 配列を持ち、name（ファイル名）と content（ファイル中身）を指定します。

window.TEMPLATES = {
  "HTML5 Boilerplate": {
    files: [
      {
        name: "index.html",
        content: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Hello, World!</h1>

  <script src="script.js"></script>
</body>
</html>`
      },
      {
        name: "styles.css",
        content: `/* styles.css */
body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

h1 {
  text-align: center;
  margin-top: 2rem;
}`
      },
      {
        name: "script.js",
        content: `// script.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('ページが読み込まれました');
});`
      }
    ]
  },
  
  "Python Script": {
    files: [
      {
        name: "main.py",
        content: `#!/usr/bin/env python3

def main():
    print("Hello, Python!")

if __name__ == "__main__":
    main()
`
      }
    ]
  },

  "Markdown Doc": {
    files: [
      {
        name: "README.md",
        content: `# プロジェクトタイトル

## 概要

ここにプロジェクトの概要を書きます。

## 使い方

\`\`\`bash
python main.py
\`\`\`
`
      }
    ]
  },

  "JSON Starter": {
    files: [
      {
        name: "data.json",
        content: `{
  "users": [],
  "settings": {
    "theme": "light",
    "language": "ja"
  }
}`
      }
    ]
  },

  
    "Deep Learning Project": {
    files: [
      {
        name: "model/best_model.weight.h5",
        content: ""
      },
      {
        name: "model/learn_model.weight.h5",
        content: ""
      },
      {
        name: "src/main.py",
        content: `#!/usr/bin/env python3

def main():
    print("モデルを読み込みます")

if __name__ == "__main__":
    main()
`
      },
      {
        name: "src/utils/api.py",
        content: `def get_data():
    return "データ取得"
`
      },
      {
        name: "src/audio.py",
        content: `def record_audio():
    print("音声を録音します")
`
      },
      {
        name: "src/camera.py",
        content: `def capture_image():
    print("画像をキャプチャします")
`
      },
      {
        name: "README.md",
        content: `# Deep Learning Project

## 概要

このプロジェクトは音声や画像データを使って学習を行うものです。

## 実行方法

\`\`\`bash
sh run.sh
\`\`\`
`
      },
      {
        name: "requirements.txt",
        content: `tensorflow
numpy
opencv-python
`
      },
      {
        name: "run.sh",
        content: `#!/bin/bash
python3 src/main.py
`
      }
    ]
  }
};
