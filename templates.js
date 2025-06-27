// templates.js

// 各テンプレートは window.TEMPLATES オブジェクトのプロパティとして定義します。
// key がセレクトボックスの表示名、および tplSelect.value になります。
// 各テンプレートは files 配列を持ち、name（ファイル名）と content（ファイル中身）を指定します。

window.TEMPLATES = {
  // HTML5 の基本テンプレート
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

  // JSON の初期画面テンプレート
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
  }
};
