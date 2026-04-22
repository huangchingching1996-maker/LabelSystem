// ── Label Settings ──
const SETTINGS_KEY = 'nls_label_settings_v1';
const MM_TO_PX = 3.7795;

const DEFAULT_SETTINGS = {
  large: {
    width: 55, height: 55,
    fontSize: { name: 16, sub: 10, body: 8, barcode: 8 },
    show: {
      葷素別: true, 條碼: true, 保存天數: true, 容量: true,
      成分: true, 過敏原: true, 保存方式: true, 有效日期: true,
      豬肉原產地: true, 營養標示: true,
    }
  },
  small: {
    width: 35, height: 25,
    fontSize: { name: 10, sub: 8, body: 7, barcode: 7 },
    show: {
      葷素別: true, 條碼: true, 保存天數: true, 容量: false,
      成分: false, 過敏原: false, 保存方式: true, 有效日期: true,
      豬肉原產地: true, 營養標示: false,
    }
  }
};

let labelSettings = null;
let settingsTab = 'large';

function loadLabelSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      const p = JSON.parse(saved);
      labelSettings = {
        large: {
          ...DEFAULT_SETTINGS.large, ...p.large,
          fontSize: { ...DEFAULT_SETTINGS.large.fontSize, ...p.large?.fontSize },
          show:     { ...DEFAULT_SETTINGS.large.show,     ...p.large?.show },
        },
        small: {
          ...DEFAULT_SETTINGS.small, ...p.small,
          fontSize: { ...DEFAULT_SETTINGS.small.fontSize, ...p.small?.fontSize },
          show:     { ...DEFAULT_SETTINGS.small.show,     ...p.small?.show },
        },
      };
    } catch { labelSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); }
  } else {
    labelSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(labelSettings));
  showToast('設定已儲存', 'success');
}

function resetSettings() {
  if (!confirm('確定要重設為預設值？')) return;
  labelSettings[settingsTab] = JSON.parse(JSON.stringify(DEFAULT_SETTINGS[settingsTab]));
  renderSettingsForm();
  updateSettingsPreview();
}

function showSettingsTab(tab) {
  settingsTab = tab;
  document.querySelectorAll('.settings-tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );
  renderSettingsForm();
  updateSettingsPreview();
}

// ── Form ──
const SHOW_FIELDS = [
  { key: '葷素別',    label: '葷素別' },
  { key: '條碼',      label: '條碼' },
  { key: '保存天數',  label: '保存天數' },
  { key: '容量',      label: '容量' },
  { key: '成分',      label: '成分' },
  { key: '過敏原',    label: '過敏原' },
  { key: '保存方式',  label: '保存方式' },
  { key: '有效日期',  label: '有效日期' },
  { key: '豬肉原產地',label: '豬肉原產地' },
  { key: '營養標示',  label: '營養標示（打包）' },
];

function renderSettingsForm() {
  const s = labelSettings[settingsTab];
  document.getElementById('settings-form').innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">尺寸</div>
      <div class="settings-row">
        <span class="settings-label">寬度 (mm)</span>
        <input class="settings-input" type="number" min="20" max="200" value="${s.width}"
          oninput="onSettingChange('width', +this.value)">
      </div>
      <div class="settings-row">
        <span class="settings-label">高度 (mm)</span>
        <input class="settings-input" type="number" min="15" max="200" value="${s.height}"
          oninput="onSettingChange('height', +this.value)">
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">字體大小 (px)</div>
      <div class="settings-row">
        <span class="settings-label">商品名稱</span>
        <input class="settings-input" type="number" min="6" max="40" value="${s.fontSize.name}"
          oninput="onFontChange('name', +this.value)">
      </div>
      <div class="settings-row">
        <span class="settings-label">葷素別 / 副標</span>
        <input class="settings-input" type="number" min="5" max="30" value="${s.fontSize.sub}"
          oninput="onFontChange('sub', +this.value)">
      </div>
      <div class="settings-row">
        <span class="settings-label">一般文字</span>
        <input class="settings-input" type="number" min="5" max="20" value="${s.fontSize.body}"
          oninput="onFontChange('body', +this.value)">
      </div>
      <div class="settings-row">
        <span class="settings-label">條碼數字</span>
        <input class="settings-input" type="number" min="5" max="16" value="${s.fontSize.barcode}"
          oninput="onFontChange('barcode', +this.value)">
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">顯示欄位</div>
      ${SHOW_FIELDS.map(f => `
        <div class="settings-row">
          <span class="settings-label">${f.label}</span>
          <label class="toggle-wrap" style="margin:0">
            <div class="toggle">
              <input type="checkbox" ${s.show[f.key] ? 'checked' : ''}
                onchange="onShowChange('${f.key}', this.checked)">
              <div class="toggle-track"></div>
              <div class="toggle-thumb"></div>
            </div>
          </label>
        </div>
      `).join('')}
    </div>

    <div class="settings-actions">
      <button class="btn" onclick="resetSettings()">重設預設值</button>
      <button class="btn btn-primary" onclick="saveSettings()">儲存設定</button>
    </div>
  `;
}

function onSettingChange(key, val) {
  if (!val || val <= 0) return;
  labelSettings[settingsTab][key] = val;
  updateSettingsPreview();
}

function onFontChange(key, val) {
  if (!val || val <= 0) return;
  labelSettings[settingsTab].fontSize[key] = val;
  updateSettingsPreview();
}

function onShowChange(key, val) {
  labelSettings[settingsTab].show[key] = val;
  updateSettingsPreview();
}

// ── Preview ──
let previewZoom = 1.0;

function updateSettingsPreview() {
  const s = labelSettings[settingsTab];
  const wPx = Math.round(s.width  * MM_TO_PX);
  const hPx = Math.round(s.height * MM_TO_PX);

  const html = settingsTab === 'large'
    ? buildLargePreviewHTML(s, wPx, hPx)
    : buildSmallPreviewHTML(s, wPx, hPx);

  document.getElementById('settings-preview-container').innerHTML = `
    <div class="preview-scale-wrap">
      <div id="preview-scaled-label" style="transform:scale(${previewZoom.toFixed(2)});transform-origin:top center;display:inline-block;">
        ${html}
      </div>
    </div>
    <div class="preview-size-info">${s.width} × ${s.height} mm　|　${wPx} × ${hPx} px</div>
  `;

  // sync slider value without rebuilding it
  const slider = document.getElementById('preview-zoom-slider');
  if (slider) slider.value = previewZoom;
  const pct = document.getElementById('preview-zoom-pct');
  if (pct) pct.textContent = Math.round(previewZoom * 100) + '%';
}

function onPreviewZoom(val) {
  previewZoom = val;
  const el = document.getElementById('preview-scaled-label');
  if (el) el.style.transform = `scale(${val.toFixed(2)})`;
  const pct = document.getElementById('preview-zoom-pct');
  if (pct) pct.textContent = Math.round(val * 100) + '%';
}

// ── Large label preview ──
function buildLargePreviewHTML(s, wPx, hPx) {
  const { show, fontSize: fs } = s;

  const leftLines = [
    show.成分      ? `<div class="pv-line" style="font-size:${fs.body}px">成分：糯米粉、砂糖、玫瑰花</div>` : '',
    show.過敏原    ? `<div class="pv-line" style="font-size:${fs.body}px">過敏原：無</div>` : '',
    show.容量      ? `<div class="pv-line" style="font-size:${fs.body}px">容量：250g</div>` : '',
    show.保存天數  ? `<div class="pv-line" style="font-size:${fs.body}px">保存天數：5 天</div>` : '',
    show.有效日期  ? `<div class="pv-line" style="font-size:${fs.body}px">有效日期：2026/05/01</div>` : '',
    show.保存方式  ? `<div class="pv-line" style="font-size:${fs.body}px">請放置陰涼處保存</div>` : '',
    show.豬肉原產地? `<div class="pv-line" style="font-size:${fs.body}px">豬肉原料原產地：臺灣</div>` : '',
  ].filter(Boolean).join('');

  const ntHTML = show.營養標示 ? `
    <div style="border:1px solid #000;display:flex;flex-direction:column;height:100%;box-sizing:border-box;font-size:${fs.body - 1}px">
      <div style="text-align:center;letter-spacing:2px;padding:1px 2px;border-bottom:1px solid #000;font-size:${fs.body - 1}px">營 養 標 示</div>
      <div style="font-size:${fs.body - 1}px;padding:1px 3px;border-bottom:1px solid #000;white-space:nowrap;line-height:1.35">
        每一份量 10 公克<br>本包裝含 25 份
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:${fs.body - 1}px;flex:1">
        <thead>
          <tr style="border-bottom:0.5px solid #000">
            <th style="text-align:left;font-weight:400;padding:0.5px 1px;white-space:nowrap"></th>
            <th style="font-weight:400;text-align:center;padding:0.5px 1px">每份</th>
            <th style="font-weight:400;text-align:center;padding:0.5px 1px">每100克</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:0.5px 1px">熱量</td><td style="text-align:right;padding:0.5px 1px">36.5大卡</td><td style="text-align:right;padding:0.5px 1px">365大卡</td></tr>
          <tr><td style="padding:0.5px 1px">蛋白質</td><td style="text-align:right;padding:0.5px 1px">0公克</td><td style="text-align:right;padding:0.5px 1px">0公克</td></tr>
          <tr><td style="padding:0.5px 1px">脂肪</td><td style="text-align:right;padding:0.5px 1px">0.5公克</td><td style="text-align:right;padding:0.5px 1px">5公克</td></tr>
          <tr><td style="padding:0.5px 1px 0.5px 6px">飽和脂肪</td><td style="text-align:right;padding:0.5px 1px">0公克</td><td style="text-align:right;padding:0.5px 1px">0公克</td></tr>
          <tr><td style="padding:0.5px 1px 0.5px 6px">反式脂肪</td><td style="text-align:right;padding:0.5px 1px">0公克</td><td style="text-align:right;padding:0.5px 1px">0公克</td></tr>
          <tr><td style="padding:0.5px 1px">碳水化合物</td><td style="text-align:right;padding:0.5px 1px">8公克</td><td style="text-align:right;padding:0.5px 1px">80公克</td></tr>
          <tr><td style="padding:0.5px 1px 0.5px 6px">糖</td><td style="text-align:right;padding:0.5px 1px">2公克</td><td style="text-align:right;padding:0.5px 1px">20公克</td></tr>
          <tr><td style="padding:0.5px 1px">鈉</td><td style="text-align:right;padding:0.5px 1px">1毫克</td><td style="text-align:right;padding:0.5px 1px">10毫克</td></tr>
        </tbody>
      </table>
    </div>
  ` : '';

  const barcodeHTML = show.條碼 ? `
    <div style="margin-top:2px;text-align:center;flex-shrink:0">
      <svg width="110" height="${Math.max(10, fs.barcode * 2)}" style="display:block;margin:0 auto">
        ${Array.from({length: 60}, (_,i) => {
          const on = [0,3,5,8,10,13,15,20,22,25,27,30,32,35,37,40,42,47,49,52,54,57,59].includes(i);
          return on ? `<rect x="${i*1.85}" y="0" width="1.4" height="${Math.max(10, fs.barcode*2)}" fill="#000"/>` : '';
        }).join('')}
      </svg>
      <div style="font-size:${fs.barcode}px;font-family:'DM Mono',monospace;letter-spacing:1.5px;margin-top:1px">0 0 3 0 3 0 1 9</div>
    </div>
  ` : '';

  return `
    <div style="width:${wPx}px;height:${hPx}px;border:1px solid #aaa;background:#fff;
      font-family:'Noto Sans TC',sans-serif;padding:5px;box-sizing:border-box;
      display:flex;flex-direction:column;overflow:hidden;">
      <!-- 商品名稱 + 葷素別（無橫線） -->
      <div style="display:flex;justify-content:space-between;align-items:baseline;
        margin-bottom:2px;flex-shrink:0">
        <div style="font-size:${fs.name}px;font-weight:400;white-space:nowrap;overflow:hidden">玫瑰花茶糕</div>
        ${show.葷素別 ? `<div style="font-size:${fs.sub}px;color:#000;white-space:nowrap;margin-left:4px">純素</div>` : ''}
      </div>
      <!-- 左欄 + 右欄(營養) -->
      <div style="display:flex;flex:1;gap:3px;overflow:hidden;min-height:0">
        <div style="flex:1;overflow:hidden;font-size:${fs.body}px">${leftLines}</div>
        ${ntHTML ? `<div style="width:113px;flex-shrink:0;overflow:hidden">${ntHTML}</div>` : ''}
      </div>
      <!-- 條碼（無橫線） -->
      ${barcodeHTML}
    </div>
  `;
}

// ── Small label preview ──
function buildSmallPreviewHTML(s, wPx, hPx) {
  const { show, fontSize: fs } = s;

  const textLines = [
    `<div style="font-size:${fs.name}px;font-weight:700;margin-bottom:1px">玫瑰花茶糕</div>`,
    show.葷素別    ? `<div class="pv-line" style="font-size:${fs.sub}px;color:#555">純素</div>` : '',
    show.保存方式  ? `<div class="pv-line" style="font-size:${fs.body}px">請放置陰涼處保存</div>` : '',
    show.保存天數  ? `<div class="pv-line" style="font-size:${fs.body}px">保存天數：5 天</div>` : '',
    show.有效日期  ? `<div class="pv-line" style="font-size:${fs.body}px">有效日期：2026/05/01</div>` : '',
    show.豬肉原產地? `<div class="pv-line" style="font-size:${fs.body}px">豬肉原料原產地：臺灣</div>` : '',
  ].filter(Boolean).join('');

  const barcodeHTML = show.條碼 ? `
    <div style="border-top:0.5px solid #ccc;padding-top:2px;text-align:center;flex-shrink:0">
      <svg width="${Math.round(wPx * 0.85)}" height="${Math.max(8, fs.barcode * 2.2)}" style="display:block;margin:0 auto">
        ${Array.from({length: 50}, (_,i) => {
          const on = [0,2,4,7,9,12,14,17,19,22,24,27,29,32,34,37,39,42,44,47,49].includes(i);
          return on ? `<rect x="${i*(wPx*0.85/50)}" y="0" width="${wPx*0.85/50 - 0.4}" height="${Math.max(8, fs.barcode*2.2)}" fill="#000"/>` : '';
        }).join('')}
      </svg>
      <div style="font-size:${fs.barcode}px;font-family:'DM Mono',monospace;letter-spacing:1.5px;margin-top:1px">0 0 3 0 3 0 1 9</div>
    </div>
  ` : '';

  return `
    <div style="width:${wPx}px;height:${hPx}px;border:1px solid #aaa;background:#fff;
      font-family:'Noto Sans TC',sans-serif;padding:3px;box-sizing:border-box;
      display:flex;flex-direction:column;overflow:hidden;">
      <div style="flex:1;overflow:hidden">${textLines}</div>
      ${barcodeHTML}
    </div>
  `;
}

// init
loadLabelSettings();
