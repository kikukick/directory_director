const tree = document.getElementById('tree');
const importBtn = document.getElementById('import-btn');
const downloadBtn = document.getElementById('download-btn');
const fileInput = document.getElementById('file-input');
const filenameInput = document.getElementById('filename-input');
const extensionLabel = document.getElementById('extension-label');
const preEditor = document.getElementById('editor');
const saveBtn = document.getElementById('save-btn');
const addToTplBtn = document.getElementById('add-to-template-btn');
const tplSelect = document.getElementById('template-select');
const addTplBtn = document.getElementById('add-template-btn');
const delTplBtn = document.getElementById('del-template-btn');
const confirmModal = document.getElementById('confirm-modal');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');
const dragbar = document.getElementById('dragbar');
const waveformCanvas = document.getElementById('waveform');
const audioPlayer = document.getElementById('audio-player');
const videoPlayer = document.getElementById('video-player');
const imageViewer = document.getElementById('image-viewer');
const ctx = waveformCanvas.getContext('2d');

let activeFolderNode = null;
let activeFileNode = null;
let lastSaved = { name: '', content: '' };
let pendingAction = null;
let isDragging = false;
let fileBlobs = new Map();

function loadLocalTpl() {
  try { return JSON.parse(localStorage.getItem('localTemplates')) || {}; } catch { return {}; }
}
function saveLocalTpl(obj) {
  localStorage.setItem('localTemplates', JSON.stringify(obj));
}
function getAllTemplates() {
  return Object.assign({}, window.TEMPLATES || {}, loadLocalTpl());
}
function refreshTplSelect() {
  const all = getAllTemplates();
  tplSelect.innerHTML = '<option value="">テンプレート選択...</option>';
  for (const key in all) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = key + (loadLocalTpl()[key] ? ' (自作)' : '');
    tplSelect.appendChild(opt);
  }
}

const rootLi = addNode(tree, 'project', true, true);
setActiveFolder(rootLi);
refreshTplSelect();

addTplBtn.addEventListener('click', () => {
  const key = tplSelect.value;
  if (!key) return showToast('テンプレートを選択してください。');
  const all = getAllTemplates();
  if (!activeFolderNode) return showToast('フォルダを選択してください。');
  all[key].files.forEach(f => addFilesWithPath(activeFolderNode.querySelector('.children'), f.name, f.content));
});
delTplBtn.addEventListener('click', () => {
  const key = tplSelect.value;
  const local = loadLocalTpl();
  if (!local[key]) return showToast('自作テンプレートのみ削除できます。');
  delete local[key];
  saveLocalTpl(local);
  refreshTplSelect();
  showToast('テンプレートを削除しました。');
});
addToTplBtn.addEventListener('click', () => {
  if (!activeFileNode) return;
  const key = prompt('新規テンプレート名を入力');
  if (!key) return;
  const local = loadLocalTpl();
  local[key] = {
    files: [{
      name: activeFileNode.querySelector('.name').value,
      content: preEditor.textContent
    }]
  };
  saveLocalTpl(local);
  refreshTplSelect();
  showToast('テンプレートを追加しました。');
});

function addFilesWithPath(container, path, content) {
  const parts = path.split('/');
  let parent = container;
  for (let i = 0; i < parts.length; i++) {
    const name = parts[i];
    const isLast = (i === parts.length - 1);
    if (!isLast) {
      let folder = Array.from(parent.children).find(li => li.querySelector('.name').value === name && li.classList.contains('folder'));
      if (!folder) folder = addNode(parent, name, true, false);
      parent = folder.querySelector('.children');
    } else {
      const li = addNode(parent, name, false, false);
      li.dataset.content = content;
    }
  }
}

function maybeSwitchNode(action) {
  if (!activeFileNode) { action(); return; }
  const curName = filenameInput.value + extensionLabel.textContent;
  const curContent = preEditor.textContent;
  if (curName !== lastSaved.name || curContent !== lastSaved.content) {
    pendingAction = action;
    confirmModal.style.display = 'flex';
    return;
  }
  action();
}
confirmYes.addEventListener('click', () => { confirmModal.style.display = 'none'; if (pendingAction) pendingAction(); pendingAction = null; });
confirmNo.addEventListener('click', () => { confirmModal.style.display = 'none'; pendingAction = null; });

saveBtn.addEventListener('click', () => {
  if (!activeFileNode) return;
  applySave();
  lastSaved = { name: filenameInput.value + extensionLabel.textContent, content: preEditor.textContent };
});
function applySave() {
  const ext = activeFileNode.dataset.ext;
  if (isMediaExt(ext)) {
    activeFileNode.querySelector('.name').value = filenameInput.value.trim() + '.' + ext;
  } else {
    activeFileNode.querySelector('.name').value = filenameInput.value.trim();
    activeFileNode.dataset.content = preEditor.textContent;
  }
}

importBtn.addEventListener('click', () => {
  if (!activeFolderNode) return showToast('フォルダを選択してください。');
  fileInput.click();
});
fileInput.addEventListener('change', e => {
  for (const file of e.target.files) {
    const ext = file.name.split('.').pop().toLowerCase();
    let li;
    if (isTextExt(ext)) {
      li = addTextFile(activeFolderNode.querySelector('.children'));
      const reader = new FileReader();
      reader.onload = () => li.dataset.content = reader.result;
      reader.readAsText(file, 'UTF-8');
    } else {
      li = addNode(activeFolderNode.querySelector('.children'), file.name, false, false);
      const url = URL.createObjectURL(file);
      fileBlobs.set(li, { url, ext });
    }
  }
  fileInput.value = '';
});

downloadBtn.addEventListener('click', () => {
  const zip = new JSZip();
  (function walk(ul, dir) {
    ul.querySelectorAll(':scope>.node').forEach(li => {
      const nm = li.querySelector('.name').value.trim();
      if (li.classList.contains('file')) {
        if (fileBlobs.has(li)) {
          fetch(fileBlobs.get(li).url).then(r => r.blob()).then(b => dir.file(nm, b));
        } else dir.file(nm, li.dataset.content || '');
      } else {
        const sub = dir.folder(nm);
        walk(li.querySelector('.children'), sub);
      }
    });
  })(tree, zip);
  setTimeout(() => zip.generateAsync({ type: 'blob' }).then(b => saveAs(b, 'project.zip')), 500);
});

function addNode(parent, name, isFolder, isRoot) {
  const li = document.createElement('li');
  li.classList.add('node', isFolder ? 'folder' : 'file');
  if (isRoot) li.classList.add('root');
  const ctrl = `
    ${isFolder ? '<button class="add-folder">📁+</button><button class="add-file">📄+</button>' : ''}
    ${!isRoot ? '<button class="delete">🗑️</button>' : ''}
  `;
  li.innerHTML = `
    <input class="name" value="${name}" ${isFolder ? '' : 'readonly'} />
    <span class="controls">${ctrl}</span>
    <ul class="children"></ul>
  `;
  parent.appendChild(li);
  if (isFolder) {
    li.addEventListener('click', e => { e.stopPropagation(); maybeSwitchNode(() => setActiveFolder(li)); });
    li.querySelector('.add-folder').addEventListener('click', e => { e.stopPropagation(); maybeSwitchNode(() => addNode(li.querySelector('.children'), 'new_folder', true, false)); });
    li.querySelector('.add-file').addEventListener('click', e => { e.stopPropagation(); maybeSwitchNode(() => addTextFile(li.querySelector('.children'))); });
    Sortable.create(li.querySelector('.children'), { group: 'nested', animation: 150, fallbackOnBody: true, swapThreshold: 0.65 });
  }
  const d = li.querySelector('.delete');
  if (d) d.addEventListener('click', e => { e.stopPropagation(); if (confirm('削除しますか？')) { if (activeFolderNode === li) setActiveFolder(rootLi); li.remove(); } });
  if (!isFolder) li.addEventListener('click', e => { e.stopPropagation(); maybeSwitchNode(() => displayFile(li)); });
  return li;
}

function isTextExt(ext) {
  return ['txt', 'js', 'html', 'css', 'py', 'java', 'md', 'json', 'h5', 'keras', 'pyc', 'log'].includes(ext);
}
function isMediaExt(ext) {
  return ['mp3', 'wav', 'ogg', 'mp4', 'mov', 'webm', 'png', 'jpg', 'jpeg', 'gif'].includes(ext);
}

function addTextFile(container) {
  const base = 'new_file', ext = 'txt';
  let i = 1, name;
  const exists = () => [...container.querySelectorAll(':scope>.node .name')].map(n => n.value).includes(name + '.' + ext);
  do { name = `${base}_${i++}`; } while (exists());
  const li = addNode(container, name + '.' + ext, false, false);
  li.dataset.content = '';
  return li;
}

function displayFile(li) {
  activeFileNode = li;
  const full = li.querySelector('.name').value;
  const idx = full.lastIndexOf('.');
  const base = full.slice(0, idx);
  const ext = full.slice(idx + 1);
  li.dataset.ext = ext;
  filenameInput.value = '';
  extensionLabel.textContent = '';
  filenameInput.disabled = true;
  preEditor.style.display = 'none';
  preEditor.setAttribute('contenteditable', 'false');
  preEditor.className = 'language-none line-numbers';
  waveformCanvas.style.display = 'none';
  audioPlayer.style.display = 'none';
  videoPlayer.style.display = 'none';
  imageViewer.style.display = 'none';
  saveBtn.disabled = true;
  addToTplBtn.style.display = 'none';
  if (isTextExt(ext)) {
    filenameInput.value = full;
    extensionLabel.textContent = '';
    filenameInput.disabled = false;
    preEditor.setAttribute('contenteditable', 'true');
    preEditor.className = 'language-' + ext + ' line-numbers';
    preEditor.textContent = li.dataset.content || '';
    preEditor.style.display = 'block';
    Prism.highlightElement(preEditor);
    saveBtn.disabled = false;
    addToTplBtn.style.display = 'inline-block';
    preEditor.removeEventListener('input', onEditorInput);
    preEditor.addEventListener('input', onEditorInput);
    preEditor.removeEventListener('keydown', onEditorKeydown);
    preEditor.addEventListener('keydown', onEditorKeydown);
  } else if (['mp3', 'wav', 'ogg'].includes(ext) && fileBlobs.has(li)) {
    filenameInput.value = base;
    extensionLabel.textContent = '.' + ext;
    filenameInput.disabled = false;
    audioPlayer.src = fileBlobs.get(li).url;
    audioPlayer.style.display = 'block';
    drawWaveform(fileBlobs.get(li).url);
    saveBtn.disabled = false;
  } else if (['mp4', 'mov', 'webm'].includes(ext) && fileBlobs.has(li)) {
    filenameInput.value = base;
    extensionLabel.textContent = '.' + ext;
    filenameInput.disabled = false;
    videoPlayer.src = fileBlobs.get(li).url;
    videoPlayer.style.display = 'block';
    saveBtn.disabled = false;
  } else if (['png', 'jpg', 'jpeg', 'gif'].includes(ext) && fileBlobs.has(li)) {
    filenameInput.value = base;
    extensionLabel.textContent = '.' + ext;
    filenameInput.disabled = false;
    imageViewer.src = fileBlobs.get(li).url;
    imageViewer.style.display = 'block';
    saveBtn.disabled = false;
  }
  lastSaved = {
    name: filenameInput.value + extensionLabel.textContent,
    content: preEditor.textContent
  };
}

function getCaretCharacterOffsetWithin(element) {
  const sel = window.getSelection();
  let charCount = 0;
  if (sel.anchorNode) {
    const range = sel.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(element);
    preRange.setEnd(range.startContainer, range.startOffset);
    charCount = preRange.toString().length;
  }
  return charCount;
}
function setCaretPositionByOffset(element, offset) {
  let remaining = offset;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (textNode.length >= remaining) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(textNode, remaining);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    } else {
      remaining -= textNode.length;
    }
  }
}
function onEditorInput() {
  const caretOffset = getCaretCharacterOffsetWithin(preEditor);
  Prism.highlightElement(preEditor);
  setCaretPositionByOffset(preEditor, caretOffset);
  lastSaved.content = preEditor.textContent;
}
function onEditorKeydown(e) {
  const caretOffset = getCaretCharacterOffsetWithin(preEditor);
  setTimeout(() => {
    Prism.highlightElement(preEditor);
    setCaretPositionByOffset(preEditor, caretOffset);
  }, 0);
}

function drawWaveform(url) {
  waveformCanvas.style.display = 'block';
  fetch(url)
    .then(r => r.arrayBuffer())
    .then(buf => new AudioContext().decodeAudioData(buf))
    .then(audioBuf => {
      const data = audioBuf.getChannelData(0);
      const step = Math.ceil(data.length / waveformCanvas.width);
      const amp = waveformCanvas.height / 2;
      ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
      ctx.fillStyle = '#555';
      for (let i = 0; i < waveformCanvas.width; i++) {
        let min = 1, max = -1;
        for (let j = 0; j < step; j++) {
          const v = data[(i * step) + j];
          if (v < min) min = v;
          if (v > max) max = v;
        }
        ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
      }
    })
    .catch(() => {});
}

function setActiveFolder(li) {
  if (activeFolderNode) activeFolderNode.classList.remove('selected-folder');
  activeFolderNode = li;
  li.classList.add('selected-folder');
  activeFileNode = null;
  filenameInput.value = '';
  extensionLabel.textContent = '';
  filenameInput.disabled = true;
  preEditor.textContent = '';
  preEditor.style.display = 'none';
  preEditor.setAttribute('contenteditable', 'false');
  waveformCanvas.style.display = 'none';
  audioPlayer.style.display = 'none';
  videoPlayer.style.display = 'none';
  imageViewer.style.display = 'none';
  saveBtn.disabled = true;
  addToTplBtn.style.display = 'none';
  lastSaved = { name: '', content: '' };
}

dragbar.addEventListener('mousedown', () => { isDragging = true; document.body.style.cursor = 'col-resize'; });
document.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const pct = e.clientX / window.innerWidth * 100;
  if (pct > 10 && pct < 90) {
    document.getElementById('leftPanel').style.width = pct + '%';
    document.getElementById('rightPanel').style.width = (100 - pct) + '%';
  }
});
document.addEventListener('mouseup', () => {
  if (isDragging) { isDragging = false; document.body.style.cursor = ''; }
});

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed', bottom: '1rem', left: '50%',
    transform: 'translateX(-50%)',
    background: '#444', color: '#fff',
    padding: '0.5rem 1rem', borderRadius: '4px',
    fontSize: '0.9em', zIndex: 2000
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/';
