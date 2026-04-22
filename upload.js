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

    const validKeys = new Set(FIELDS.filter(f => f.key).map(f => f.key));
    data.forEach(row => {
      if(!row.類別) row.類別 = '其他';
      // migrate old key name
      if('商品名稱(副)' in row) { row['葷素別'] = row['商品名稱(副)']; delete row['商品名稱(副)']; }
      if('淨重(g)' in row) { row['容量'] = row['淨重(g)']; delete row['淨重(g)']; }
      // strip unknown fields
      Object.keys(row).forEach(k => { if(!validKeys.has(k)) delete row[k]; });
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
    const exportData = products.map(p => {
      const row = {};
      FIELDS.forEach(f => { if(f.key) row[f.key] = p[f.key] ?? null; });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
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