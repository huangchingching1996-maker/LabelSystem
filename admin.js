// ── Admin Table ──
function renderAdminTable() {
  const q = document.getElementById('admin-search')?.value.trim().toLowerCase() || '';
  const tbody = document.getElementById('admin-tbody');
  const filtered = products.filter(p => {
    if(!q) return true;
    return (p.商品名稱||'').toLowerCase().includes(q) ||
           String(p.商品編號||'').includes(q);
  });

  tbody.innerHTML = filtered.map((p, i) => {
    const realIdx = products.indexOf(p);
    const td = (val, mono=false, bold=false, maxw=false) => {
      const style = [mono?'font-family:\'DM Mono\',monospace':'', bold?'font-weight:600':'', maxw?'max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap':''].filter(Boolean).join(';');
      return `<td${style?' style="'+style+'"':''}>${val??''}</td>`;
    };
    return `<tr>
      ${td(p.商品編號, true)}
      ${td(p.商品名稱, false, true)}
      ${td(p['商品名稱(副)'])}
      <td><span class="tag tag-cat">${p.類別||''}</span></td>
      ${td(p.條碼格式, true)}
      ${td(p.條碼內容, true)}
      ${td(p.保存天數)}
      ${td(p['淨重(g)'])}
      ${td(p.成分, false, false, true)}
      ${td(p.過敏原, false, false, true)}
      ${td(p.保存方式, false, false, true)}
      <td>
        <label class="toggle-wrap" onclick="event.stopPropagation()">
          <div class="toggle">
            <input type="checkbox" ${p.豬肉原產地==='是'?'checked':''} onchange="togglePork(${realIdx}, this.checked)">
            <div class="toggle-track"></div>
            <div class="toggle-thumb"></div>
          </div>
          <span class="toggle-label">${p.豬肉原產地==='是'?'是':'否'}</span>
        </label>
      </td>
      ${td(p['每份重量(公克)'])}
      ${td(p.本包裝含幾份)}
      ${td(p['熱量(每份)'])}
      ${td(p['蛋白質(每份)'])}
      ${td(p['脂肪(每份)'])}
      ${td(p['飽和脂肪(每份)'])}
      ${td(p['反式脂肪(每份)'])}
      ${td(p['碳水化合物(每份)'])}
      ${td(p['糖(每份)'])}
      ${td(p['鈉(每份)'])}
      ${td(p.每包裝份數)}
      ${td(p['熱量(每100克)'])}
      ${td(p['蛋白質(每100克)'])}
      ${td(p['脂肪(每100克)'])}
      ${td(p['飽和脂肪(每100克)'])}
      ${td(p['反式脂肪(每100克)'])}
      ${td(p['碳水化合物(每100克)'])}
      ${td(p['糖(每100克)'])}
      ${td(p['鈉(每100克)'])}
      <td><button class="edit-btn" onclick="openEditModal(${realIdx})">編輯</button></td>
    </tr>`;
  }).join('');
}

// ── Edit Modal ──
function openEditModal(idx) {
  editIdx = idx;
  const p = products[idx];
  document.getElementById('edit-modal-title').textContent = `編輯：${p.商品名稱}`;

  const grid = document.getElementById('edit-form-grid');
  grid.innerHTML = FIELDS.map(f => {
    if(f.section) return `<div class="section-divider full">${f.section}</div>`;
    if(f.skip) return '';
    const val = p[f.key] != null ? p[f.key] : '';
    const fullClass = f.full ? 'full' : '';
    if(f.type === 'toggle') return `
      <div class="field-group ${fullClass}">
        <label class="field-label">${f.label}</label>
        <label class="toggle-wrap" style="padding:4px 0">
          <div class="toggle">
            <input type="checkbox" data-key="${f.key}" ${val==='是'?'checked':''} onchange="this.closest('.toggle-wrap').querySelector('.toggle-label').textContent=this.checked?'是':'否'">
            <div class="toggle-track"></div>
            <div class="toggle-thumb"></div>
          </div>
          <span class="toggle-label" style="font-size:13px;color:var(--text-primary)">${val==='是'?'是':'否'}</span>
        </label>
      </div>`;
    if(f.type === 'textarea') return `
      <div class="field-group ${fullClass}">
        <label class="field-label">${f.label}</label>
        <textarea class="field-textarea" data-key="${f.key}">${val}</textarea>
      </div>`;
    if(f.type === 'select') return `
      <div class="field-group ${fullClass}">
        <label class="field-label">${f.label}</label>
        <select class="field-select" data-key="${f.key}">
          ${f.options.map(o => `<option ${o===val?'selected':''}>${o}</option>`).join('')}
        </select>
      </div>`;
    return `
      <div class="field-group ${fullClass}">
        <label class="field-label">${f.label}</label>
        <input class="field-input" type="${f.type}" data-key="${f.key}" value="${val}">
      </div>`;
  }).join('');

  document.getElementById('edit-modal').classList.add('open');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('open');
  editIdx = null;
}

function saveEdit() {
  if(editIdx === null) return;
  const inputs = document.querySelectorAll('#edit-form-grid [data-key]');
  inputs.forEach(el => {
    const key = el.dataset.key;
    const field = FIELDS.find(f => f.key === key);
    if(!field) return;
    if(field.type === 'toggle') {
      products[editIdx][key] = el.checked ? '是' : '否';
      return;
    }
    const raw = el.value.trim();
    if(field.type === 'number') {
      products[editIdx][key] = raw === '' ? null : parseFloat(raw);
    } else {
      products[editIdx][key] = raw === '' ? null : raw;
    }
  });
  saveProducts();
  renderAdminTable();
  renderCats();
  closeEditModal();
  showToast('已儲存', 'success');
}
