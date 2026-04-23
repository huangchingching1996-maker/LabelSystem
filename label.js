// ── Label HTML ──
function ean13SVG(code13, width, height) {
  const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
  const PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
  const d = code13.split('').map(Number);
  const parity = PARITY[d[0]];
  let bars = '101';
  for(let i=0;i<6;i++) bars += parity[i]==='L' ? L[d[i+1]] : G[d[i+1]];
  bars += '01010';
  for(let i=7;i<13;i++) bars += R[d[i]];
  bars += '101';
  const bw = width / bars.length;
  let rects = '';
  for(let i=0;i<bars.length;i++){
    if(bars[i]==='1') rects += `<rect x="${(i*bw).toFixed(2)}" y="0" width="${(bw+0.1).toFixed(2)}" height="${height}" fill="black"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${rects}</svg>`;
}

// ── Expiry date ──
function expiryDate(days) {
  if(!days) return '';
  const dateVal = document.getElementById('start-date')?.value;
  const d = dateVal ? new Date(dateVal + 'T00:00:00') : new Date();
  d.setDate(d.getDate() + Number(days));
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}/${m}/${day}`;
}

// ── Barcode SVG (EAN-8) ──
function ean8SVG(code8, width, height) {
  const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
  const guards = { start:'101', middle:'01010', end:'101' };
  let bars = guards.start;
  for(let i=0;i<4;i++) bars += L[parseInt(code8[i])];
  bars += guards.middle;
  for(let i=4;i<8;i++) bars += R[parseInt(code8[i])];
  bars += guards.end;
  const bw = width / bars.length;
  let rects = '';
  for(let i=0;i<bars.length;i++){
    if(bars[i]==='1') rects += `<rect x="${(i*bw).toFixed(2)}" y="0" width="${(bw+0.1).toFixed(2)}" height="${height}" fill="black"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${rects}</svg>`;
}

function buildLabelHTML(product, size) {
  const p = product;
  const showExpiry = document.getElementById('show-expiry')?.checked ?? true;

  const isEAN13 = p.條碼格式 === 'EAN13';

  // ── Small label: 30×25mm ──
  if(size === 'small') {
    let bcCode, svg;
    bcCode = (p.條碼內容||'').toString();
    if(isEAN13) {
      svg = ean13SVG(bcCode, 115, 20);
    } else {
      svg = ean8SVG(bcCode, 100, 20);
    }
    const expiry = expiryDate(p.保存天數);
    return `<div class="label-small">
      <div class="sl-text">
        <div class="sl-name">${p.商品名稱}</div>
        <div class="sl-sub">${p['葷素別']||''}</div>
        <div class="sl-info">${p.保存方式||''}</div>
        <div class="sl-info">保存天數:${p.保存天數||''}&nbsp;&nbsp;天</div>
        ${showExpiry ? `<div class="sl-info">有效日期:${expiry}</div>` : `<div class="sl-info"></div>`}
        ${p.豬肉原產地==='是' ? `<div class="sl-info">豬肉原料原產地:臺灣</div>` : ''}
      </div>
      <div class="sl-barcode-wrap">
        ${svg}
        <div class="sl-barcode-num">${bcCode}</div>
      </div>
    </div>`;
  }

  // ── Large label: 55×55mm = 208×208px ──
  let bcCodeL, svgL;
  bcCodeL = (p.條碼內容||'').toString();
  if(isEAN13) {
    svgL = ean13SVG(bcCodeL, 160, 18);
  } else {
    svgL = ean8SVG(bcCodeL, 120, 18);
  }
  const expiryL = expiryDate(p.保存天數);

  const ntRows = [
    {label:'熱量',      sKey:'熱量(每份)',         hKey:'熱量(每100克)',        unit:'大卡',  indent:false},
    {label:'蛋白質',    sKey:'蛋白質(每份)',        hKey:'蛋白質(每100克)',      unit:'公克',  indent:false},
    {label:'脂肪',      sKey:'脂肪(每份)',          hKey:'脂肪(每100克)',        unit:'公克',  indent:false},
    {label:'飽和脂肪',  sKey:'飽和脂肪(每份)',      hKey:'飽和脂肪(每100克)',    unit:'公克',  indent:true},
    {label:'反式脂肪',  sKey:'反式脂肪(每份)',      hKey:'反式脂肪(每100克)',    unit:'公克',  indent:true},
    {label:'碳水化合物',sKey:'碳水化合物(每份)',    hKey:'碳水化合物(每100克)',  unit:'公克',  indent:false},
    {label:'糖',        sKey:'糖(每份)',            hKey:'糖(每100克)',          unit:'公克',  indent:true},
    {label:'鈉',        sKey:'鈉(每份)',            hKey:'鈉(每100克)',          unit:'毫克',  indent:false},
  ];

  const ntTableRows = ntRows.map(({label, sKey, hKey, unit, indent}) => {
    const sv = p[sKey] != null ? `${p[sKey]}${unit}` : '-';
    const hv = p[hKey] != null ? `${p[hKey]}${unit}` : '-';
    const labelCls = indent ? 'nt-label nt-indent' : 'nt-label';
    return `<tr>
      <td class="${labelCls}">${indent ? '　' : ''}${label}</td>
      <td class="nt-val">${sv}</td>
      <td class="nt-val">${hv}</td>
    </tr>`;
  }).join('');

  const notes = p.豬肉原產地 === '是' ? '豬肉原料原產地:臺灣' : '';

  return `<div class="label-large" style="width:208px;height:208px;padding:8px 4px 4px 4px;">
    <div class="ll-header">
      <div class="ll-name">${p.商品名稱}</div>
      <div class="ll-sub">${p['葷素別']||''}</div>
    </div>
    <div class="ll-body">
      <div class="ll-left">
        ${p.成分 ? `<div class="ll-row" style="flex-wrap:nowrap;align-items:flex-start"><span class="ll-label" style="flex-shrink:0">成分:</span><span class="ll-val">${p.成分}</span></div>` : ''}
        ${p['容量'] ? `<div class="ll-row"><span class="ll-label">容量:</span><span class="ll-val">${p['容量']} 公克</span></div>` : ''}
        ${p.過敏原 ? `<div class="ll-row"><span class="ll-label">過敏原:</span><span class="ll-val">${p.過敏原==='無'?'無':'本產品含有'+p.過敏原.replace(/[、,，]/g,',')}</span></div>` : ''}
        <div class="ll-row"><span class="ll-label">保存期限:</span><span class="ll-val">${p.保存天數||''}&nbsp;&nbsp;天</span></div>
        ${showExpiry ? `<div class="ll-row" style="flex-wrap:nowrap;white-space:nowrap"><span class="ll-label">有效日期:</span><span class="ll-val">${expiryL}</span></div>` : `<div class="ll-row"></div>`}
        ${p.保存方式 ? `<div class="ll-row"><span class="ll-label">保存方式:</span><span class="ll-val">${p.保存方式}</span></div>` : ''}
        <div class="ll-row"><span class="ll-label">製造商:</span><span class="ll-val">玉珍齋</span></div>
        ${notes ? `<div class="ll-row"><span class="ll-val">${notes}</span></div>` : ''}
      </div>
      <div class="ll-right">
        <div class="ll-nt-title">營 養 標 示</div>
        <div class="ll-nt-serving">
          每一份量 ${p['每份重量(公克)']||''} 公克<br>
          本包裝含 ${p['本包裝含幾份']||''} 份
        </div>
        <table class="ll-nt-table">
          <tr class="nt-header-row">
            <th></th>
            <th>每份</th>
            <th>每100克</th>
          </tr>
          ${ntTableRows}
        </table>
      </div>
    </div>
    <div class="ll-barcode-wrap">
      ${svgL}
      <div class="ll-barcode-num">${bcCodeL}</div>
    </div>
  </div>`;
}

