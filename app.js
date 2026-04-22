// ── State ──
let products = [];
let selectedCat = '全部';
let selectedProduct = null;
let selectedSize = 'large';
let editIdx = null;
let pendingUploadData = null;

// ── Init ──
function init() {
  const ver = localStorage.getItem('nls_version');
  if(ver !== '5') { localStorage.removeItem(PRODUCTS_KEY); localStorage.setItem('nls_version','5'); }
  const saved = localStorage.getItem(PRODUCTS_KEY);
  products = saved ? JSON.parse(saved) : BUILTIN;
  let migrated = false;
  products.forEach(p => {
    if(p.條碼格式 !== 'EAN8' && p.條碼格式 !== 'EAN13') { p.條碼格式 = 'EAN8'; migrated = true; }
    if('商品名稱(副)' in p) { p['葷素別'] = p['商品名稱(副)']; delete p['商品名稱(副)']; migrated = true; }
    if('現行單位' in p) { delete p['現行單位']; migrated = true; }
    if('淨重(g)' in p) { p['容量'] = p['淨重(g)']; delete p['淨重(g)']; migrated = true; }
  });
  if(migrated) saveProducts();
  const now = new Date();
  document.getElementById('start-date').value =
    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  renderCats();
  renderProducts();
  renderAdminTable();
}

function saveProducts() {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function togglePork(idx, checked) {
  products[idx].豬肉原產地 = checked ? '是' : '否';
  saveProducts();
  renderAdminTable();
}

// ── Views ──
function showView(v) {
  document.getElementById('pos-view').style.display = v==='pos' ? 'flex' : 'none';
  document.getElementById('admin-view').style.display = v==='admin' ? 'flex' : 'none';
  document.getElementById('settings-view').style.display = v==='settings' ? 'flex' : 'none';
  document.querySelectorAll('.nav-btn').forEach((b,i) => {
    b.classList.toggle('active', (i===0&&v==='pos')||(i===1&&v==='admin')||(i===2&&v==='settings'));
  });
  if(v==='admin') renderAdminTable();
  if(v==='settings') { renderSettingsForm(); updateSettingsPreview(); }
}

// ── Categories ──
function renderCats() {
  const panel = document.getElementById('cat-panel');
  panel.innerHTML = CATS.map(cat => {
    const count = cat === '全部' ? products.length : products.filter(p => p.類別 === cat).length;
    return `<button class="cat-btn ${cat===selectedCat?'active':''}" data-cat="${cat}" onclick="selectCat(this.dataset.cat)">
      ${cat} <span class="cat-count">${count}</span>
    </button>`;
  }).join('');
}

function selectCat(cat) {
  selectedCat = cat;
  renderCats();
  renderProducts();
}

// ── Products ──
function getFilteredProducts() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  return products.filter(p => {
    const catOk = selectedCat === '全部' || p.類別 === selectedCat;
    if(!q) return catOk;
    const name = (p.商品名稱 || '').toLowerCase();
    const code = String(p.商品編號 || '');
    const barcode = String(p.條碼內容 || '');
    return catOk && (name.includes(q) || code.includes(q) || barcode.includes(q));
  });
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  const filtered = getFilteredProducts();
  if(!filtered.length) {
    grid.innerHTML = '<div class="empty-state">找不到符合的商品</div>';
    return;
  }
  grid.innerHTML = filtered.map(p => {
    const sel = selectedProduct && selectedProduct.商品編號 === p.商品編號;
    return `<button class="product-btn ${sel?'selected':''}" onclick="selectProduct(${p.商品編號})">
      <div class="product-name">${p.商品名稱}</div>
      ${p['葷素別'] ? `<div class="product-sub">${p['葷素別']}</div>` : ''}
      <div class="product-code">#${p.商品編號}</div>
    </button>`;
  }).join('');
}

function selectProduct(id) {
  selectedProduct = products.find(p => p.商品編號 === id) || null;
  renderProducts();
  renderPrintPanel();
}

function renderPrintPanel() {
  const info = document.getElementById('selected-info');
  const printBtn = document.getElementById('print-btn');
  const previewBtn = document.getElementById('preview-btn');

  if(!selectedProduct) {
    info.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px 0;">請先選擇商品</div>';
    printBtn.disabled = true;
    previewBtn.disabled = true;
    return;
  }
  const p = selectedProduct;
  info.innerHTML = `
    <div class="name">${p.商品名稱}</div>
    ${p['葷素別'] ? `<div class="sub">${p['葷素別']}</div>` : ''}
    <div class="barcode">${p.條碼內容 || ''} · #${p.商品編號}</div>
  `;
  printBtn.disabled = false;
  previewBtn.disabled = false;
}

// ── Size & Qty ──
function selectSize(s) {
  selectedSize = s;
  document.getElementById('btn-large').classList.toggle('active', s==='large');
  document.getElementById('btn-small').classList.toggle('active', s==='small');
  document.getElementById('small-print-hint').style.display = s==='small' ? 'block' : 'none';
}

function adjustQty(d) {
  const input = document.getElementById('qty-input');
  const v = Math.max(1, Math.min(999, (parseInt(input.value)||1) + d));
  input.value = v;
}
