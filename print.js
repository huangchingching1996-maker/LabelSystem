const PX_PER_MM = 96 / 25.4;
const LABEL_MM = {
  large: { w: 55, h: 55 },
  small: { w: 35, h: 25 },
};

// ── Preview ──
function doPreview() {
  if(!selectedProduct) return;
  const qty    = parseInt(document.getElementById('qty-input').value) || 1;
  const single = buildLabelHTML(selectedProduct, selectedSize);
  const mm     = LABEL_MM[selectedSize];

  const labelPxW = mm.w * PX_PER_MM;
  const labelPxH = mm.h * PX_PER_MM;
  const maxW  = Math.min(window.innerWidth * 0.8, 480);
  const maxH  = window.innerHeight * 0.55;
  const scale = Math.min(maxW / labelPxW, maxH / labelPxH, 4);

  const scaledW = Math.round(labelPxW * scale);
  const scaledH = Math.round(labelPxH * scale);

  const sizeText = selectedSize === 'large'
    ? `大標 ${mm.w}×${mm.h}mm` : `小標 ${mm.w}×${mm.h}mm`;
  document.getElementById('preview-label').textContent =
    `${selectedProduct.商品名稱} · ${sizeText} · ${qty} 張`;

  const previewCount = Math.min(qty, 3);
  const labelsHTML = Array(previewCount).fill(0).map(() =>
    `<div style="width:${scaledW}px;height:${scaledH}px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
      <div style="display:inline-block;transform:scale(${scale});transform-origin:top left;">
        <div class="label-wrapper">${single}</div>
      </div>
    </div>`
  ).join('');

  document.getElementById('preview-labels-wrap').innerHTML =
    `<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">
      ${labelsHTML}
      ${qty > 3 ? `<div style="font-size:12px;color:#888;width:100%;text-align:center;">共 ${qty} 張，預覽前 3 張</div>` : ''}
    </div>`;

  document.getElementById('preview-overlay').classList.add('open');
}

function closePreview() {
  document.getElementById('preview-overlay').classList.remove('open');
}

// ── Print ──
function setPaperStyle() {
  const mm = LABEL_MM[selectedSize];
  let s = document.getElementById('_page_style');
  if(!s) { s = document.createElement('style'); s.id = '_page_style'; document.head.appendChild(s); }
  const orient = (selectedSize === 'small') ? ' landscape' : '';
  s.textContent = `@media print { @page { size: ${mm.w}mm ${mm.h}mm${orient}; margin: 0; } }`;
}

function doPrint() {
  if(!selectedProduct) return;
  const qty    = parseInt(document.getElementById('qty-input').value) || 1;
  const area   = document.getElementById('print-area');
  const single = buildLabelHTML(selectedProduct, selectedSize);
  area.innerHTML = Array(qty).fill(buildWrapperHTML(single)).join('');
  setPaperStyle();
  closePreview();
  setTimeout(() => {
    window.print();
    setTimeout(() => { area.innerHTML = ''; }, 500);
  }, 300);
}

function doPrintFromPreview() {
  if(!selectedProduct) return;
  const qty    = parseInt(document.getElementById('qty-input').value) || 1;
  const area   = document.getElementById('print-area');
  const single = buildLabelHTML(selectedProduct, selectedSize);
  area.innerHTML = Array(qty).fill(buildWrapperHTML(single)).join('');
  setPaperStyle();
  window.print();
  setTimeout(() => { area.innerHTML = ''; }, 1000);
}
