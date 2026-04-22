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
      ${td(p['葷素別'])}
      <td><span class="tag tag-cat">${p.類別||''}</span></td>
      ${td(p.條碼格式, true)}
      ${td(p.條碼內容, true)}
      ${td(p.保存天數)}
      ${td(p['容量'])}
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
      <td style="white-space:nowrap">
        <button class="edit-btn" onclick="openEditModal(${realIdx})">編輯</button>
        <button class="edit-btn" style="margin-left:6px;background:#FEE2E2;color:#B91C1C;border-color:#FECACA" onclick="openDeleteModal(${realIdx})">刪除</button>
      </td>
    </tr>`;
  }).join('');
}

// ── Add Modal ──
function openAddModal() {
  const nextId = products.length ? Math.max(...products.map(p => p.商品編號)) + 1 : 1;
  const blank = { 商品編號: nextId, 條碼格式: 'EAN8', 豬肉原產地: '否' };
  editIdx = -1;
  _openModalWith('新增商品', blank);
}

// ── Edit Modal ──
function openEditModal(idx) {
  editIdx = idx;
  const p = products[idx];
  _openModalWith(`編輯：${p.商品名稱}`, p);
}

function _openModalWith(title, p) {
  document.getElementById('edit-modal-title').textContent = title;

  const grid = document.getElementById('edit-form-grid');
  grid.innerHTML = FIELDS.map(f => {
    if(f.section) return `<div class="section-divider full">${f.section}</div>`;
    if(f.skip) return '';
    if(f.type === 'readonly') return `
      <div class="field-group ${f.full ? 'full' : ''}">
        <label class="field-label">${f.label}</label>
        <div class="field-input" style="background:var(--bg);color:var(--text-muted);cursor:default">${p[f.key] ?? ''}</div>
      </div>`;
    if(f.type === 'allergens') {
      const cur = p[f.key] || '';
      const boxes = f.options.map(o => {
        const checked = cur.includes(o) ? 'checked' : '';
        return `<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;white-space:nowrap">
          <input type="checkbox" data-allergen="${o}" ${checked}> ${o}
        </label>`;
      }).join('');
      return `<div class="field-group full">
        <label class="field-label">${f.label}</label>
        <div data-key="過敏原" data-type="allergens"
          style="display:flex;flex-wrap:wrap;gap:8px 16px;padding:8px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
          ${boxes}
        </div>
      </div>`;
    }
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
        <textarea class="field-textarea" data-key="${f.key}" placeholder="${f.placeholder||''}">${val}</textarea>
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
        <input class="field-input" type="${f.type}" data-key="${f.key}" value="${val}" ${f.type==='number'?'min="0"':''}>
      </div>`;
  }).join('');

  document.getElementById('edit-modal').classList.add('open');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('open');
  editIdx = null;
}

// ── Delete ──
let deleteIdx = null;

function openDeleteModal(idx) {
  deleteIdx = idx;
  document.getElementById('delete-modal-name').textContent = products[idx].商品名稱 || `商品編號 ${products[idx].商品編號}`;
  document.getElementById('delete-modal').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('open');
  deleteIdx = null;
}

function confirmDelete() {
  if(deleteIdx === null) return;
  products.splice(deleteIdx, 1);
  saveProducts();
  renderAdminTable();
  renderCats();
  closeDeleteModal();
  showToast('已刪除', 'success');
}

function saveEdit() {
  if(editIdx === null) return;

  // 必填驗證
  const missing = [];
  FIELDS.filter(f => f.required).forEach(f => {
    const el = document.querySelector(`#edit-form-grid [data-key="${f.key}"]`);
    if(!el) return;
    const val = (el.value || '').trim();
    if(!val) missing.push(f.label.replace(' *',''));
  });
  if(missing.length) { showToast(`請填寫：${missing.join('、')}`, 'error'); return; }

  const isAdd = editIdx === -1;
  const target = isAdd ? {} : products[editIdx];
  const inputs = document.querySelectorAll('#edit-form-grid [data-key]');
  inputs.forEach(el => {
    const key = el.dataset.key;
    const field = FIELDS.find(f => f.key === key);
    if(!field) return;
    if(field.type === 'toggle') {
      target[key] = el.checked ? '是' : '否';
      return;
    }
    if(field.type === 'allergens') {
      const checked = [...el.querySelectorAll('[data-allergen]:checked')].map(c => c.dataset.allergen);
      target[key] = checked.length ? checked.join('、') : '無';
      return;
    }
    let raw = el.value.trim();
    if(field.key === '成分') raw = raw.replace(/，/g, ',');
    if(field.type === 'number') {
      target[key] = raw === '' ? null : parseFloat(raw);
    } else {
      target[key] = raw === '' ? null : raw;
    }
  });
  if(isAdd) products.push(target);
  saveProducts();
  renderAdminTable();
  renderCats();
  closeEditModal();
  showToast(isAdd ? '已新增' : '已儲存', 'success');
}
