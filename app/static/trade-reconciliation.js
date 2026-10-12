/* Daily broker fills, netted by ticker; VND cost is calculated on the server. */
(() => {
  const panel = document.querySelector('#tradeReconciliationPanel');
  const endpoint = '/api/trade-reconciliation';
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const number = value => value == null ? '—' : Number(value).toLocaleString('vi-VN', {maximumFractionDigits: 2});
  const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : '—';
  const statuses = {buy_remaining:'Còn dư mua'};
  let identity = null, epoch = 0, readVersion = 0, fileVersion = 0;
  let administrator = false, selectedScope = '', report = null, selectedFile = null, preview = null, busy = false;
  const signatures = new Map(), drafts = new Map();
  const rowKey = row => JSON.stringify([row.scope, row.trade_date, row.ticker]);
  const validIdentity = current => current === epoch && identity !== null;
  const filters = () => ({ticker: panel.querySelector('[data-ticker]').value.trim().toUpperCase(),from:panel.querySelector('[data-from]').value,to:panel.querySelector('[data-to]').value});
  function filteredRows(rows, criteria) {
    return rows.filter(row => (!criteria.ticker || row.ticker.includes(criteria.ticker)) && (!criteria.from || row.trade_date >= criteria.from) && (!criteria.to || row.trade_date <= criteria.to));
  }
  async function request(path = '', options = {}) {
    const response = await fetch(endpoint + path, options);
    let body;
    try { body = await response.json(); } catch (_) { throw new Error(`Không đọc được phản hồi máy chủ (HTTP ${response.status}).`); }
    if (!response.ok) {
      const detail = body.detail;
      throw new Error(Array.isArray(detail) ? detail.map(item => item.msg || String(item)).join('; ') : (typeof detail === 'object' ? detail.message || JSON.stringify(detail) : detail) || `HTTP ${response.status}`);
    }
    return body;
  }
  function status(message, error = false) {
    const element = panel.querySelector('[data-status]');
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('reconciliationError', error);
    element.setAttribute('role', error ? 'alert' : 'status');
  }
  function uploadOptions(file) {
    return {method:'POST',headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','X-Filename':encodeURIComponent(file.name)},body:file};
  }
  function setBusy(value) {
    busy = value;
    panel.setAttribute('aria-busy', String(value));
    panel.querySelectorAll('[data-file], [data-preview-button], [data-note-save], [data-note-input], [data-replace]').forEach(element => {element.disabled = value;});
    syncImportButton();
  }
  function syncImportButton() {
    const button = panel.querySelector('[data-import-button]');
    if (!button) return;
    const conflict = preview?.import_state === 'conflict';
    const replacement = panel.querySelector('[data-replace]').checked;
    button.disabled = busy || !selectedFile || !preview || preview.import_state === 'duplicate' || (conflict && !replacement);
    button.textContent = conflict ? 'Thay báo cáo ngày này' : 'Lưu báo cáo';
  }
  function replaceSection(selector, html) {
    if (signatures.get(selector) === html) return;
    const target = panel.querySelector(selector);
    if (target.contains(document.activeElement) && document.activeElement.matches('[data-note-input]')) {
      const active = document.activeElement, key = active.dataset.noteInput;
      const start = active.selectionStart, end = active.selectionEnd;
      target.innerHTML = html;
      const restored = [...target.querySelectorAll('[data-note-input]')].find(input => input.dataset.noteInput === key);
      if (restored) {restored.focus({preventScroll:true});restored.setSelectionRange(start, end);}
    } else target.innerHTML = html;
    signatures.set(selector, html);
  }
  function table(headers, rows, empty = 'Chưa có dữ liệu.', caption = '') {
    return `<div class="reconciliationTableWrap" tabindex="0" role="region" aria-label="${esc(caption)}"><table class="reconciliationTable"><caption class="reconciliationSrOnly">${esc(caption)}</caption><thead><tr>${headers.map(header => `<th scope="col"${header.numeric ? ' class="numeric"' : ''}>${esc(header.label)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${headers.length}" class="reconciliationEmpty">${esc(empty)}</td></tr>`}</tbody></table></div>`;
  }
  const textCell = value => `<td>${esc(value)}</td>`;
  const numericCell = value => `<td class="numeric">${number(value)}</td>`;
  const tickerCell = ticker => `<th scope="row" class="reconciliationTicker">${esc(ticker)}</th>`;
  function mount() {
    panel.innerHTML = `<div class="panelHead"><div><p class="eyebrow">Báo cáo khớp lệnh • VND • theo từng tài khoản</p><h2>Đối chiếu khớp lệnh</h2><p class="mutedText">Đối ứng mua/bán trong ngày, chuyển lượng mua còn dư và giá vốn bình quân sang các ngày tiếp theo.</p></div></div>
      <details class="reconciliationMethod"><summary>Cách tính và phạm vi dữ liệu</summary><p>Cùng mã, cùng ngày: đối ứng số lượng mua và bán trước. Chỉ ghi nhận phần mua còn dư, theo giá mua bình quân của ngày đó. Lượng và giá vốn này được cộng vào dư mua từ các ngày trước để tính giá vốn bình quân mới.</p><p>Ngày bán nhiều hơn hoặc bằng mua được bỏ qua khi lũy kế, không giảm lượng mua đã ghi nhận trước đó. Đây là bảng theo dõi các ngày dư mua cần xử lý. Giá vốn dùng giá trị khớp chia cho số lượng, chưa gồm phí/thuế. Dữ liệu tách riêng từng tài khoản và không tự cập nhật sổ giao dịch hay NAV.</p></details>
      <section class="reconciliationImport" data-import-area ${administrator ? '' : 'hidden'} aria-labelledby="reconciliationImportTitle"><h3 id="reconciliationImportTitle">Nhập báo cáo Excel</h3><p class="mutedText">Chọn tệp .xlsx theo mẫu báo cáo khớp lệnh theo mã. Xem trước để kiểm tra tài khoản, ngày và các mã trước khi lưu. Tệp tối đa 10 MB.</p><div class="reconciliationUploadActions"><label for="reconciliationFile">Báo cáo khớp lệnh<input id="reconciliationFile" data-file type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-describedby="reconciliationFileStatus"></label><button type="button" class="smallButton" data-preview-button>Xem trước</button><button type="button" class="smallButton" data-import-button disabled>Lưu báo cáo</button></div><p id="reconciliationFileStatus" class="mutedText" data-file-status>Chưa chọn tệp.</p><label class="reconciliationReplace" data-replace-label hidden><input data-replace type="checkbox">Thay toàn bộ báo cáo của tài khoản và ngày này, đồng thời tính lại các ngày sau</label><div data-preview hidden></div></section>
      <p data-status role="status" aria-live="polite" class="reconciliationStatus">Đang tải dữ liệu…</p>
      <div class="reconciliationFilters"><label>Tài khoản<select data-scope aria-label="Tài khoản báo cáo"><option value="">Chưa có tài khoản</option></select></label><label>Tìm mã<input data-ticker type="search" placeholder="Ví dụ: FPT" autocomplete="off" maxlength="30"></label><label>Từ ngày<input data-from type="date"></label><label>Đến ngày<input data-to type="date"></label><button type="button" class="smallButton ghostButton" data-reset-filters>Xóa bộ lọc</button></div>
      <p class="mutedText" data-scope-context></p><div class="fundKpis reconciliationKpis" data-totals></div><div data-warnings></div>
      <section class="reconciliationSection" aria-labelledby="reconciliationPositionsTitle"><div class="panelHead"><div><h3 id="reconciliationPositionsTitle">Mua còn dư lũy kế</h3><p class="mutedText">Tổng các ngày dư mua đã ghi nhận đến báo cáo mới nhất, không phải số dư chứng khoán thực tế. Bộ lọc ngày chỉ áp dụng bảng thống kê bên dưới.</p></div><span class="mutedText" data-positions-count></span></div><div data-positions></div></section>
      <section class="reconciliationSection" aria-labelledby="reconciliationDailyTitle"><div class="panelHead"><div><h3 id="reconciliationDailyTitle">Các ngày còn dư mua theo mã</h3><p class="mutedText">Chỉ hiển thị mã có SL mua lớn hơn SL bán trong ngày. Đối ứng = phần mua và bán khớp cùng ngày. Giá mua BQ ngày và giá vốn BQ lũy kế hiển thị bằng VND.</p></div><span class="mutedText" data-rows-count></span></div><div data-rows></div></section>
      <details class="reconciliationSection"><summary>Lịch sử báo cáo đã nhập</summary><div data-imports></div></details>`;
    panel.querySelector('[data-file]').addEventListener('change', event => {
      selectedFile = event.target.files[0] || null; preview = null; fileVersion++;
      panel.querySelector('[data-preview]').hidden = true;
      panel.querySelector('[data-preview]').replaceChildren();
      panel.querySelector('[data-replace-label]').hidden = true;
      panel.querySelector('[data-replace]').checked = false;
      panel.querySelector('[data-file-status]').textContent = selectedFile ? `${selectedFile.name} • ${number(selectedFile.size / 1024)} KB` : 'Chưa chọn tệp.';
      syncImportButton();
    });
    panel.querySelector('[data-preview-button]').addEventListener('click', previewFile);
    panel.querySelector('[data-import-button]').addEventListener('click', importFile);
    panel.querySelector('[data-replace]').addEventListener('change', syncImportButton);
    panel.querySelector('[data-scope]').addEventListener('change', event => {selectedScope = event.target.value;load(true);});
    ['[data-ticker]','[data-from]','[data-to]'].forEach(selector => panel.querySelector(selector).addEventListener('input', render));
    panel.querySelector('[data-reset-filters]').addEventListener('click', () => {
      ['[data-ticker]','[data-from]','[data-to]'].forEach(selector => {panel.querySelector(selector).value = '';});render();
    });
    panel.addEventListener('input', noteInput);
    panel.addEventListener('click', noteClick);
  }
  function validateFile() {
    if (!selectedFile) throw new Error('Chọn tệp Excel trước khi xem dữ liệu.');
    if (!/\.xlsx$/i.test(selectedFile.name)) throw new Error('Chỉ nhận báo cáo Excel .xlsx.');
    if (selectedFile.size > MAX_FILE_BYTES) throw new Error('Tệp vượt quá giới hạn 10 MB.');
  }
  async function previewFile() {
    if (busy) return;
    const current = epoch, currentFile = fileVersion;
    try {
      validateFile();setBusy(true);status('Đang đọc và kiểm tra báo cáo…');
      const result = await request('/preview', uploadOptions(selectedFile));
      if (!validIdentity(current) || currentFile !== fileVersion) return;
      preview = result;renderPreview();status(result.import_state === 'duplicate' ? 'Báo cáo đã được nhập, không tạo bản trùng.' : result.import_state === 'conflict' ? 'Đã có báo cáo ngày này. Kiểm tra phần xem trước trước khi chọn thay thế.' : 'Đã đọc báo cáo. Kiểm tra phần xem trước rồi lưu.');
    } catch (error) {if (validIdentity(current)) status(error.message, true);}
    finally {if (validIdentity(current)) setBusy(false);}
  }
  function renderPreview() {
    const target = panel.querySelector('[data-preview]');
    target.hidden = false;
    const importState = preview.import_state;
    panel.querySelector('[data-replace-label]').hidden = importState !== 'conflict';
    panel.querySelector('[data-replace]').checked = false;
    const notice = importState === 'duplicate' ? 'Báo cáo này đã được nhập, không tạo thêm dữ liệu trùng.' : importState === 'conflict' ? 'Đã có báo cáo khác cho tài khoản và ngày này. Chỉ chọn thay thế sau khi đã kiểm tra số liệu.' : '';
    target.innerHTML = `<div class="reconciliationPreviewHead"><h4>Xem trước: ${date(preview.trade_date)}</h4><p>Tài khoản: <strong>${esc(preview.account_label)}</strong> • ${number(preview.rows.length)} mã • đơn vị VND</p>${notice ? `<p class="reconciliationNotice">${esc(notice)}</p>` : ''}${(preview.warnings || []).map(warning => `<p class="reconciliationNotice">${esc(warning)}</p>`).join('')}</div>` + table([{label:'Mã'},{label:'SL mua',numeric:true},{label:'SL bán',numeric:true},{label:'Đối ứng',numeric:true},{label:'Dư mua ngày',numeric:true},{label:'Giá mua BQ (VND)',numeric:true},{label:'Giá trị mua (VND)',numeric:true},{label:'Giá trị bán (VND)',numeric:true}], preview.rows.map(row => `<tr>${tickerCell(row.ticker)}${numericCell(row.buy_quantity)}${numericCell(row.sell_quantity)}${numericCell(row.matched_quantity)}${numericCell(row.residual_buy_quantity)}${numericCell(row.buy_average_price)}${numericCell(row.buy_amount)}${numericCell(row.sell_amount)}</tr>`), 'Báo cáo không có giao dịch.', 'Xem trước báo cáo Excel, chưa lưu');
    syncImportButton();
  }
  async function importFile() {
    if (busy || !preview || !selectedFile) return;
    const current = epoch, file = selectedFile, scope = preview.scope;
    const replace = preview.import_state === 'conflict' && panel.querySelector('[data-replace]').checked;
    if (preview.import_state === 'conflict' && !replace) return;
    try {
      setBusy(true);status('Đang lưu báo cáo và tính lại số dư…');
      const result = await request('/import' + (replace ? '?replace_existing=true' : ''), uploadOptions(file));
      if (!validIdentity(current)) return;
      selectedScope = scope;selectedFile = null;preview = null;fileVersion++;
      panel.querySelector('[data-file]').value = '';
      panel.querySelector('[data-file-status]').textContent = 'Chưa chọn tệp.';
      panel.querySelector('[data-preview]').hidden = true;
      panel.querySelector('[data-preview]').replaceChildren();
      panel.querySelector('[data-replace-label]').hidden = true;
      panel.querySelector('[data-replace]').checked = false;
      await load(false, true);
      if (validIdentity(current)) status(result.duplicate || result.import_state === 'duplicate' ? 'Báo cáo đã có sẵn, không tạo bản trùng.' : 'Đã lưu báo cáo và cập nhật giá vốn lũy kế.');
    } catch (error) {if (validIdentity(current)) status(error.message, true);}
    finally {if (validIdentity(current)) setBusy(false);}
  }
  function noteInput(event) {
    const input = event.target.closest('[data-note-input]');
    if (input) drafts.set(input.dataset.noteInput, input.value);
  }
  function noteClick(event) {
    const button = event.target.closest('[data-note-save]');
    if (button) saveNote(button);
  }
  async function saveNote(button) {
    if (!administrator || busy) return;
    const key = button.dataset.noteSave, row = report?.rows.find(item => rowKey(item) === key);
    if (!row) return;
    const input = [...panel.querySelectorAll('[data-note-input]')].find(item => item.dataset.noteInput === key);
    const current = epoch, note = input.value;
    try {
      setBusy(true);status(`Đang lưu ghi chú ${row.ticker} ngày ${date(row.trade_date)}…`);
      await request('/notes', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope:row.scope,trade_date:row.trade_date,ticker:row.ticker,note})});
      if (!validIdentity(current)) return;
      drafts.delete(key);await load(false, true);
      if (validIdentity(current)) status(`Đã lưu ghi chú ${row.ticker} ngày ${date(row.trade_date)}.`);
    } catch (error) {if (validIdentity(current)) status(error.message, true);}
    finally {if (validIdentity(current)) setBusy(false);}
  }
  function render() {
    if (!report) return;
    const criteria = filters(), invalidRange = criteria.from && criteria.to && criteria.from > criteria.to;
    const dailyRows = invalidRange ? [] : filteredRows(report.rows || [], criteria);
    const positions = (report.positions || []).filter(row => !criteria.ticker || row.ticker.includes(criteria.ticker));
    const scope = (report.scopes || []).find(item => item.scope === report.selected_scope);
    panel.querySelector('[data-scope-context]').textContent = scope ? `Tài khoản ${scope.account_label} • dữ liệu đã nhập từ ${date(scope.first_trade_date)} đến ${date(scope.last_trade_date)} • chỉ tính từ các báo cáo này.` : 'Chưa có báo cáo. Nhập tệp Excel để bắt đầu đối chiếu.';
    const totals = report.totals || {};
    replaceSection('[data-totals]', [['Báo cáo đã nhập',totals.imports_count],['Mã còn dư mua',totals.outstanding_tickers],['SL mua còn dư (CP)',totals.outstanding_quantity],['Giá vốn tổng (VND)',totals.total_cost]].map(([label,value]) => `<article><span>${esc(label)}</span><strong>${number(value)}</strong></article>`).join(''));
    replaceSection('[data-warnings]', totals.ignored_rows_count > 0 ? `<p class="mutedText">${number(totals.ignored_rows_count)} dòng có lượng mua bằng hoặc nhỏ hơn lượng bán được bỏ qua khi lũy kế dư mua.</p>` : '');
    panel.querySelector('[data-positions-count]').textContent = `${number(positions.length)} / ${number((report.positions || []).length)} mã`;
    replaceSection('[data-positions]', table([{label:'Mã'},{label:'SL còn dư (CP)',numeric:true},{label:'Giá vốn BQ (VND)',numeric:true},{label:'Giá vốn tổng (VND)',numeric:true},{label:'Ngày mua đầu'},{label:'Cập nhật gần nhất'},{label:'Trạng thái'}], positions.map(row => `<tr>${tickerCell(row.ticker)}${numericCell(row.quantity)}${numericCell(row.average_cost)}${numericCell(row.total_cost)}${textCell(date(row.first_trade_date))}${textCell(date(row.last_trade_date))}${textCell('Còn dư mua')}</tr>`), criteria.ticker ? 'Không có mã còn dư mua phù hợp bộ lọc.' : 'Không còn dư mua trong dữ liệu đã nhập.', 'Số lượng mua còn dư và giá vốn bình quân lũy kế'));
    panel.querySelector('[data-rows-count]').textContent = invalidRange ? 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.' : `${number(dailyRows.length)} / ${number((report.rows || []).length)} dòng`;
    replaceSection('[data-rows]', table([{label:'Mã'},{label:'Ngày'},{label:'SL mua',numeric:true},{label:'SL bán',numeric:true},{label:'Đối ứng',numeric:true},{label:'Dư mua ngày',numeric:true},{label:'Giá mua BQ ngày (VND)',numeric:true},{label:'Dư mua trước ngày',numeric:true},{label:'Dư mua lũy kế',numeric:true},{label:'Giá vốn BQ lũy kế (VND)',numeric:true},{label:'Trạng thái'},{label:'Ghi chú'}], dailyRows.map(row => {
      const key = rowKey(row), note = drafts.has(key) ? drafts.get(key) : row.note || '';
      const noteCell = administrator ? `<td class="reconciliationNote"><label class="reconciliationSrOnly" for="reconciliation-note-${esc(row.trade_date)}-${esc(row.ticker)}">Ghi chú ${esc(row.ticker)} ngày ${date(row.trade_date)}</label><textarea id="reconciliation-note-${esc(row.trade_date)}-${esc(row.ticker)}" data-note-input="${esc(key)}" rows="2" maxlength="2000" ${busy ? 'disabled' : ''}>${esc(note)}</textarea><button type="button" class="smallButton ghostButton" data-note-save="${esc(key)}" ${busy ? 'disabled' : ''}>Lưu ghi chú</button></td>` : `<td class="reconciliationNote">${esc(note || '—')}</td>`;
      return `<tr>${tickerCell(row.ticker)}${textCell(date(row.trade_date))}${numericCell(row.buy_quantity)}${numericCell(row.sell_quantity)}${numericCell(row.matched_quantity)}${numericCell(row.residual_buy_quantity)}${numericCell(row.buy_average_price)}${numericCell(row.opening_quantity)}${numericCell(row.closing_quantity)}${numericCell(row.closing_average_cost)}<td><span class="reconciliationBadge remaining">${esc(statuses[row.status] || row.status)}</span></td>${noteCell}</tr>`;
    }), invalidRange ? 'Kiểm tra lại khoảng ngày.' : 'Không có giao dịch phù hợp bộ lọc.', 'Đối chiếu số lượng mua bán từng mã mỗi ngày'));
    replaceSection('[data-imports]', table([{label:'Ngày giao dịch'},{label:'Tệp báo cáo'},{label:'Số mã',numeric:true},{label:'Người nhập'}], (report.imports || []).map(item => `<tr>${textCell(date(item.trade_date))}${textCell(item.filename)}${numericCell(item.rows_count)}${textCell(item.created_by)}</tr>`), 'Chưa nhập báo cáo.', 'Lịch sử báo cáo của tài khoản đang chọn'));
  }
  function renderScopes() {
    const select = panel.querySelector('[data-scope]');
    const options = (report.scopes || []).map(scope => `<option value="${esc(scope.scope)}">${esc(scope.account_label)}</option>`).join('') || '<option value="">Chưa có tài khoản</option>';
    if (signatures.get('scopes') !== options) {select.innerHTML = options;signatures.set('scopes', options);}
    selectedScope = report.selected_scope || '';select.value = selectedScope;
  }
  async function load(explicit = false, force = false) {
    if (!identity || (busy && !force)) return;
    const current = epoch, read = ++readVersion;
    if (explicit) status('Đang tải báo cáo tài khoản…');
    try {
      const result = await request(selectedScope ? `?scope=${encodeURIComponent(selectedScope)}` : '');
      if (!validIdentity(current) || read !== readVersion) return;
      report = result;renderScopes();render();
      if (explicit || panel.querySelector('[data-status]').textContent === 'Đang tải dữ liệu…') status('Đã tải dữ liệu đối chiếu.');
    } catch (error) {if (validIdentity(current) && read === readVersion) status(error.message, true);}
  }
  function clear() {
    epoch++;readVersion++;fileVersion++;identity = null;administrator = false;selectedScope = '';report = null;selectedFile = null;preview = null;busy = false;
    signatures.clear();drafts.clear();
    if (panel) {panel.removeEventListener('input', noteInput);panel.removeEventListener('click', noteClick);panel.replaceChildren();panel.hidden = true;panel.removeAttribute('aria-busy');}
  }
  async function refresh(user) {
    if (!panel) return;
    const enabled = user?.role === 'admin' || user?.features?.includes('tradeReconciliation');
    if (!enabled) {clear();return;}
    const key = JSON.stringify([user.id, user.role, user.features || [], user.strategies || []]);
    if (user.role !== 'admin' && user.strategies?.length) {
      if (identity !== key) {clear();identity = key;panel.hidden = false;panel.innerHTML = '<h2>Đối chiếu khớp lệnh</h2><p class="reconciliationNotice">Báo cáo khớp lệnh cần quyền xem toàn danh mục vì không phân chia theo chiến lược. Tài khoản hiện tại đang giới hạn chiến lược.</p>';}
      return;
    }
    if (identity !== key) {clear();identity = key;administrator = user.role === 'admin';panel.hidden = false;mount();}
    await load();
  }
  window.TradeReconciliation = {clear, refresh};
})();
