// ── Upload ──
function openUploadModal() {
  pendingUploadData = null;
  document.getElementById('upload-status').textContent = '';
  document.getElementById('confirm-upload-btn').disabled = true;
  document.getElementById('upload-modal').classList.add('open');
}
function closeUploadModal() {
  document.getElementById('upload-modal').classList.remove('open');
}

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.add('dragover');
}
function handleDragLeave(e) {
  document.getElementById('upload-zone').classList.remove('dragover');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if(file) processUploadFile(file);
}
function handleFileInput(e) {
  const file = e.target.files[0];
  if(file) processUploadFile(file);
}

async function processUploadFile(file) {
  const status = document.getElementById('upload-status');
  status.textContent = '讀取中...';
  document.getElementById('confirm-upload-btn').disabled = true;

  try {
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, {type:'array'});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, {defval:null});

    // Auto-categorize if no category column
    data.forEach(row => {
      if(!row.類別) row.類別 = '其他';
      if(row.條碼內容 && !String(row.條碼內容).startsWith('00')) {
        row.條碼內容 = '00' + row.條碼內容;
      }
    });

    pendingUploadData = data;
    status.innerHTML = `<span style="color:var(--success)">✓ 讀取成功：${data.length} 筆商品</span>`;
    document.getElementById('confirm-upload-btn').disabled = false;
  } catch(err) {
    status.innerHTML = `<span style="color:#B91C1C">讀取失敗：${err.message}</span>`;
  }
}

function confirmUpload() {
  if(!pendingUploadData) return;
  products = pendingUploadData;
  saveProducts();
  renderCats();
  renderProducts();
  renderAdminTable();
  closeUploadModal();
  showToast(`已匯入 ${products.length} 筆商品`, 'success');
}

// ── Export ──
async function exportExcel() {
  try {
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs');
    const ws = XLSX.utils.json_to_sheet(products);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '商品資料');
    XLSX.writeFile(wb, '商品資料_export.xlsx');
    showToast('已下載 Excel', 'success');
  } catch(err) {
    showToast('下載失敗：' + err.message, 'error');
  }
}

// ── Toast ──
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Start ──
init();