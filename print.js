// ── Preview ──
const PX_PER_MM = 96 / 25.4;

function labelsPerPage(paper) {
  const PAD = 4 * PX_PER_MM;
  const GAP = 4 * PX_PER_MM;
  const lw = selectedSize === 'large' ? 208 : 114;
  const lh = selectedSize === 'large' ? 208 : 95;
  const cols = Math.floor((paper.w * PX_PER_MM - 2 * PAD + GAP) / (lw + GAP));
  const rows = Math.floor((paper.h * PX_PER_MM - 2 * PAD + GAP) / (lh + GAP));
  return Math.max(1, cols * rows);
}

function buildPageHTML(paper, scale, labelsHTML) {
  return `
    <div style="width:${paper.w}mm;height:${paper.h}mm;background:white;
      padding:4mm;box-sizing:border-box;display:flex;flex-wrap:wrap;
      align-content:flex-start;gap:4mm;
      transform:scale(${scale});transform-origin:top left;
      box-shadow:0 2px 12px rgba(0,0,0,0.15);">
      ${labelsHTML}
    </div>`;
}

function doPreview() {
  if(!selectedProduct) return;
  const qty    = parseInt(document.getElementById('qty-input').value) || 1;
  const paper  = PAPERS.find(p => p.id === selectedPaper) || PAPERS[0];
  const single = buildLabelHTML(selectedProduct, selectedSize);

  const paperPxW = paper.w * PX_PER_MM;
  const paperPxH = paper.h * PX_PER_MM;
  const maxW  = Math.min(window.innerWidth * 0.88, 680);
  const maxH  = window.innerHeight * 0.68;
  const scale = Math.min(maxW / paperPxW, maxH / paperPxH);
  const scaledW = Math.round(paperPxW * scale);
  const scaledH = Math.round(paperPxH * scale);

  const perPage = labelsPerPage(paper);
  const pages   = Math.ceil(qty / perPage);

  const pagesHTML = Array.from({length: pages}, (_, pi) => {
    const count = Math.min(perPage, qty - pi * perPage);
    const labels = Array(count).fill(`<div class="label-wrapper">${single}</div>`).join('');
    return `
      <div style="display:flex;flex-direction:column;align-items:flex-start;gap:6px;">
        ${pages > 1 ? `<div style="font-size:11px;color:#888;">第 ${pi+1} 頁 / 共 ${pages} 頁</div>` : ''}
        <div style="width:${scaledW}px;height:${scaledH}px;overflow:hidden;">
          ${buildPageHTML(paper, scale, labels)}
        </div>
      </div>`;
  }).join('');

  const sizeText = selectedSize === 'large' ? '大標' : '小標';
  document.getElementById('preview-label').textContent =
    `${selectedProduct.商品名稱} · ${paper.name} · ${sizeText} · ${qty} 張（每頁 ${perPage} 張）`;

  document.getElementById('preview-labels-wrap').innerHTML = pagesHTML;
  document.getElementById('preview-overlay').classList.add('open');
}

function closePreview() {
  document.getElementById('preview-overlay').classList.remove('open');
}

// ── Print ──
function setPaperStyle() {
  const paper = PAPERS.find(p => p.id === selectedPaper) || PAPERS[0];
  let s = document.getElementById('_page_style');
  if(!s) { s = document.createElement('style'); s.id = '_page_style'; document.head.appendChild(s); }
  s.textContent = `@media print { @page { size: ${paper.w}mm ${paper.h}mm; margin: 0; } }`;
}

function doPrint() {
  if(!selectedProduct) return;
  const qty  = parseInt(document.getElementById('qty-input').value) || 1;
  const area = document.getElementById('print-area');
  const single = buildLabelHTML(selectedProduct, selectedSize);
  area.innerHTML = Array(qty).fill(`<div class="label-wrapper">${single}</div>`).join('');
  setPaperStyle();
  closePreview();
  setTimeout(() => {
    window.print();
    setTimeout(() => { area.innerHTML = ''; }, 500);
  }, 300);
}

function doPrintFromPreview() {
  if(!selectedProduct) return;
  const qty  = parseInt(document.getElementById('qty-input').value) || 1;
  const area = document.getElementById('print-area');
  const single = buildLabelHTML(selectedProduct, selectedSize);
  area.innerHTML = Array(qty).fill(`<div class="label-wrapper">${single}</div>`).join('');
  setPaperStyle();
  window.print();
  setTimeout(() => { area.innerHTML = ''; }, 1000);
}
