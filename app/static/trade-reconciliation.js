/* Daily broker fills, netted by ticker; VND cost is calculated on the server. */
(() => {
  const panel = document.querySelector('#tradeReconciliationPanel');
  const endpoint = '/api/trade-reconciliation';
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const number = value => value == null ? '—' : Number(value).toLocaleString('vi-VN', {maximumFractionDigits: 2});
  const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : '—';
  const statuses = {buy_remaining:'Còn dư mua',base_only:'Chỉ còn cơ sở',closed:'Hết dư mua'};
  let identity = null, epoch = 0, readVersion = 0, fileVersion = 0;
  let administrator = false, selectedScope = '', report = null, selectedFile = null, preview = null, busy = false, pendingDelete = null;
  const signatures = new Map(), drafts = new Map();
  const rowKey = row => JSON.stringify([row.scope, row.trade_date, row.ticker]);
  const validIdentity = current => current === epoch && identity !== null;
  const filters = () => ({ticker: panel.querySelector('[data-ticker]').value.trim().toUpperCase(),from:panel.querySelector('[data-from]').value,to:panel.querySelector('[data-to]').value});
  function filteredRows(rows, criteria) {
    return rows.filter(row => (!criteria.ticker || row.ticker.includes(criteria.ticker)) && (!criteria.from || row.trade_date >= criteria.from) && (!criteria.to || row.trade_date <= criteria.to));
  }
  async function request(path = '', options = {}) {
    const requestEpoch = epoch;
    const response = await fetch(endpoint + path, options);
    if (!response.ok && (response.status === 401 || response.status === 403) && validIdentity(requestEpoch)) clear();
    let body;
    try { body = await response.json(); } catch (_) { throw new Error(`Không đọc được phản hồi máy chủ (HTTP ${response.status}).`); }
    if (!response.ok) {
      const detail = body.detail;
      const error = new Error(Array.isArray(detail) ? detail.map(item => item.msg || String(item)).join('; ') : (detail && typeof detail === 'object' ? detail.message || JSON.stringify(detail) : detail) || `HTTP ${response.status}`);
      error.httpStatus = response.status;
      throw error;
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
    panel.querySelectorAll('[data-file], [data-preview-button], [data-note-save], [data-note-input], [data-replace], [data-base-ticker], [data-base-quantity], [data-base-edit], [data-base-reset]').forEach(element => {element.disabled = value || !!pendingDelete;});
    panel.querySelector('[data-scope]').disabled = value;
    syncImportButton();
    syncBaseForm();
    syncDeleteControls();
  }
  function syncImportButton() {
    const button = panel.querySelector('[data-import-button]');
    if (!button) return;
    const conflict = preview?.import_state === 'conflict';
    const replacement = panel.querySelector('[data-replace]').checked;
    button.disabled = busy || !!pendingDelete || !selectedFile || !preview || preview.import_state === 'duplicate' || (conflict && !replacement);
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
    panel.innerHTML = `<div class="panelHead"><div><p class="eyebrow">Báo cáo khớp lệnh • VND • theo từng tài khoản</p><h2>Đối chiếu khớp lệnh</h2><p class="mutedText">Theo dõi dư mua vượt lượng cổ phiếu cơ sở, giảm dư mua khi bán và chuyển giá vốn bình quân sang phiên tiếp theo.</p></div></div>
      <details class="reconciliationMethod"><summary>Cách tính và phạm vi dữ liệu</summary><p>Lượng cơ sở là cổ phiếu đã có sẵn, giữ riêng từ đầu kỳ theo dõi. Ví dụ CII có cơ sở 10.000 CP: mua thêm 2.000 CP thì dư mua là 2.000 CP, tổng theo dõi 12.000 CP; bán 500 CP thì dư mua còn 1.500 CP, tổng theo dõi 11.500 CP.</p><p>Cùng mã, cùng ngày: đối ứng mua/bán trước. Dư mua được cộng vào tồn vượt cơ sở, theo giá mua bình quân ngày; dư bán giảm tồn vượt cơ sở từ các ngày trước và giữ nguyên giá vốn bình quân. Chỉ bỏ qua lượng bán vượt phần dư này, không giảm cơ sở và không ghi nhận tồn âm.</p><p>Khi hết dư mua, giá vốn phần dư được xóa; lần mua tiếp theo bắt đầu tính bình quân mới. Giá vốn dùng giá trị khớp chia cho số lượng, chưa gồm phí/thuế và không gồm cổ phiếu cơ sở. Thay đổi cơ sở áp dụng từ báo cáo đầu tiên, không trừ vào các giao dịch mua đã nhập. Các báo cáo cũ được tính lại theo cùng quy tắc. Dữ liệu tách riêng từng tài khoản và không tự cập nhật sổ giao dịch hay NAV.</p></details>
      <section class="reconciliationImport" data-import-area ${administrator ? '' : 'hidden'} aria-labelledby="reconciliationImportTitle"><h3 id="reconciliationImportTitle">Nhập báo cáo Excel</h3><p class="mutedText">Chọn tệp .xlsx theo mẫu báo cáo khớp lệnh theo mã. Xem trước để kiểm tra tài khoản, ngày và các mã trước khi lưu. Tệp tối đa 10 MB.</p><div class="reconciliationUploadActions"><label for="reconciliationFile">Báo cáo khớp lệnh<input id="reconciliationFile" data-file type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-describedby="reconciliationFileStatus"></label><button type="button" class="smallButton" data-preview-button>Xem trước</button><button type="button" class="smallButton" data-import-button disabled>Lưu báo cáo</button></div><p id="reconciliationFileStatus" class="mutedText" data-file-status>Chưa chọn tệp.</p><label class="reconciliationReplace" data-replace-label hidden><input data-replace type="checkbox">Thay toàn bộ báo cáo của tài khoản và ngày này, đồng thời tính lại các ngày sau</label><div data-preview hidden></div></section>
      <p data-status role="status" aria-live="polite" class="reconciliationStatus">Đang tải dữ liệu…</p>
      <div class="reconciliationFilters"><label>Tài khoản<select data-scope aria-label="Tài khoản báo cáo"><option value="">Chưa có tài khoản</option></select></label><label>Tìm mã<input data-ticker type="search" placeholder="Ví dụ: FPT" autocomplete="off" maxlength="30"></label><label>Từ ngày<input data-from type="date"></label><label>Đến ngày<input data-to type="date"></label><button type="button" class="smallButton ghostButton" data-reset-filters>Xóa bộ lọc</button></div>
      <p class="mutedText" data-scope-context></p><div class="fundKpis reconciliationKpis" data-totals></div><div data-warnings></div>
      <section class="reconciliationSection" aria-labelledby="reconciliationBasesTitle"><div class="panelHead"><div><h3 id="reconciliationBasesTitle">Cổ phiếu cơ sở giữ riêng</h3><p class="mutedText">Lượng đã có sẵn cho tài khoản đang chọn, không tính giá vốn. Đặt 0 để bỏ cơ sở của mã.</p></div></div><div data-base-admin ${administrator ? '' : 'hidden'}><form class="reconciliationBaseForm" data-base-form><label>Mã cổ phiếu<input data-base-ticker type="text" placeholder="Ví dụ: CII" autocomplete="off" maxlength="20" required></label><label>Lượng cơ sở (CP)<input data-base-quantity type="number" min="0" max="1000000000000" step="1" inputmode="numeric" placeholder="10000" required></label><button type="submit" class="smallButton" data-base-save disabled>Lưu cơ sở</button><button type="button" class="smallButton ghostButton" data-base-reset>Xóa nhập liệu</button></form><p class="mutedText" data-base-context>Nhập báo cáo trước để chọn tài khoản và thiết lập cơ sở.</p></div><div data-bases></div></section>
      <section class="reconciliationSection" aria-labelledby="reconciliationPositionsTitle"><div class="panelHead"><div><h3 id="reconciliationPositionsTitle">Tồn vượt cơ sở lũy kế</h3><p class="mutedText">Tổng theo dõi = cơ sở giữ riêng + dư mua còn lại từ báo cáo đã nhập. Giá vốn chỉ tính phần dư mua. Bộ lọc ngày chỉ áp dụng bảng thống kê bên dưới.</p></div><span class="mutedText" data-positions-count></span></div><div data-positions></div></section>
      <section class="reconciliationSection" aria-labelledby="reconciliationDailyTitle"><div class="panelHead"><div><h3 id="reconciliationDailyTitle">Đối chiếu mua/bán từng ngày theo mã</h3><p class="mutedText">Hiển thị cả ngày mua và bán. Đối ứng = phần mua và bán khớp cùng ngày. Bán trừ dư cũ giữ giá vốn bình quân; phần bán vượt dư cũ được bỏ qua. Giá mua BQ ngày và giá vốn BQ phần dư hiển thị bằng VND.</p></div><span class="mutedText" data-rows-count></span></div><div data-rows></div></section>
      <section class="reconciliationDeleteConfirmation" data-delete-confirmation role="region" aria-labelledby="reconciliationDeleteTitle" hidden><h3 id="reconciliationDeleteTitle" data-delete-title></h3><p data-delete-detail></p><p data-delete-impact></p><div class="reconciliationDeleteActions"><button type="button" class="smallButton ghostButton" data-delete-cancel>Hủy</button><button type="button" class="smallButton reconciliationDangerButton" data-delete-confirm>Xác nhận xóa</button></div></section>
      <details class="reconciliationSection"><summary>Lịch sử báo cáo đã nhập</summary><div class="reconciliationHistoryActions" data-delete-account-area ${administrator ? '' : 'hidden'}><p class="mutedText">Có thể xóa riêng từng báo cáo hoặc xóa toàn bộ báo cáo, ghi chú và cơ sở của tài khoản đang chọn.</p><button type="button" class="smallButton reconciliationDangerButton" data-delete-account disabled>Xóa toàn bộ dữ liệu tài khoản</button></div><div data-imports></div></details>`;
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
    panel.querySelector('[data-scope]').addEventListener('change', event => {if (busy) return;selectedScope = event.target.value;resetBaseForm();syncBaseForm();load(true);});
    panel.querySelector('[data-base-form]').addEventListener('submit', saveBase);
    panel.querySelector('[data-base-reset]').addEventListener('click', () => {if (!busy) resetBaseForm();});
    panel.querySelector('[data-delete-account]').addEventListener('click', event => beginDelete('account', event.currentTarget));
    panel.querySelector('[data-delete-cancel]').addEventListener('click', cancelDelete);
    panel.querySelector('[data-delete-confirm]').addEventListener('click', confirmDelete);
    ['[data-ticker]','[data-from]','[data-to]'].forEach(selector => panel.querySelector(selector).addEventListener('input', render));
    panel.querySelector('[data-reset-filters]').addEventListener('click', () => {
      ['[data-ticker]','[data-from]','[data-to]'].forEach(selector => {panel.querySelector(selector).value = '';});render();
    });
    panel.addEventListener('input', noteInput);
    panel.addEventListener('click', actionClick);
    syncBaseForm();
    syncDeleteControls();
  }
  function validateFile() {
    if (!selectedFile) throw new Error('Chọn tệp Excel trước khi xem dữ liệu.');
    if (!/\.xlsx$/i.test(selectedFile.name)) throw new Error('Chỉ nhận báo cáo Excel .xlsx.');
    if (selectedFile.size > MAX_FILE_BYTES) throw new Error('Tệp vượt quá giới hạn 10 MB.');
  }
  async function previewFile() {
    if (busy || pendingDelete) return;
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
    if (busy || pendingDelete || !preview || !selectedFile) return;
    const current = epoch, file = selectedFile, scope = preview.scope;
    const replace = preview.import_state === 'conflict' && panel.querySelector('[data-replace]').checked;
    if (preview.import_state === 'conflict' && !replace) return;
    try {
      setBusy(true);status('Đang lưu báo cáo và tính lại số dư…');
      const result = await request('/import' + (replace ? '?replace_existing=true' : ''), uploadOptions(file));
      if (!validIdentity(current)) return;
      if (selectedScope !== scope) resetBaseForm();
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
  function actionClick(event) {
    const deleteButton = event.target.closest('[data-delete-import]');
    if (deleteButton) return beginDelete('import', deleteButton);
    const baseButton = event.target.closest('[data-base-edit]');
    if (baseButton && administrator && !busy && !pendingDelete && report?.selected_scope === selectedScope) {
      const base = (report.bases || []).find(item => item.ticker === baseButton.dataset.baseEdit);
      if (base) {
        panel.querySelector('[data-base-ticker]').value = base.ticker;
        panel.querySelector('[data-base-quantity]').value = String(base.base_quantity);
        panel.querySelector('[data-base-ticker]').focus({preventScroll:true});
      }
      return;
    }
    const button = event.target.closest('[data-note-save]');
    if (button) return saveNote(button);
  }
  function resetBaseForm() {
    panel.querySelector('[data-base-ticker]').value = '';
    panel.querySelector('[data-base-quantity]').value = '';
  }
  function syncBaseForm() {
    const available = !!selectedScope && report?.selected_scope === selectedScope;
    panel.querySelector('[data-base-save]').disabled = busy || !!pendingDelete || !administrator || !available;
    panel.querySelector('[data-base-context]').textContent = available ? 'Lưu cơ sở cho tài khoản đang chọn. Các giao dịch mua đã nhập vẫn được tính vào phần dư mua.' : 'Nhập báo cáo trước để chọn tài khoản và thiết lập cơ sở.';
  }
  async function saveBase(event) {
    event.preventDefault();
    if (!administrator || busy || pendingDelete) return;
    const scope = selectedScope, current = epoch;
    const ticker = panel.querySelector('[data-base-ticker]').value.trim().toUpperCase();
    const rawQuantity = panel.querySelector('[data-base-quantity]').value.trim();
    const quantity = Number(rawQuantity);
    if (!scope || report?.selected_scope !== scope) {status('Chờ tải xong tài khoản trước khi lưu cơ sở.', true);return;}
    if (!/^[A-Z0-9][A-Z0-9._-]{0,19}$/.test(ticker)) {status('Nhập mã cổ phiếu hợp lệ để thiết lập cơ sở.', true);return;}
    if (!/^\d+$/.test(rawQuantity) || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 1000000000000) {status('Lượng cơ sở phải là số nguyên từ 0 đến 1.000.000.000.000 CP.', true);return;}
    try {
      setBusy(true);status(`Đang lưu cơ sở ${ticker}…`);
      await request('/bases', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope,ticker,base_quantity:quantity})});
      if (!validIdentity(current) || selectedScope !== scope) return;
      resetBaseForm();await load(false, true);
      if (validIdentity(current) && selectedScope === scope) status(quantity === 0 ? `Đã bỏ cơ sở ${ticker}; giữ nguyên các giao dịch đã nhập.` : `Đã lưu cơ sở ${ticker}: ${number(quantity)} CP giữ riêng.`);
    } catch (error) {if (validIdentity(current) && selectedScope === scope) status(error.message, true);}
    finally {if (validIdentity(current)) setBusy(false);}
  }
  async function saveNote(button) {
    if (!administrator || busy || pendingDelete) return;
    if (report?.selected_scope !== selectedScope) {status('Chờ tải xong tài khoản trước khi lưu ghi chú.', true);return;}
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
  function syncDeleteControls() {
    const available = administrator && !!selectedScope && report?.selected_scope === selectedScope;
    const hasData = (report?.imports || []).length > 0 || (report?.bases || []).length > 0;
    panel.querySelector('[data-delete-account]').disabled = busy || !!pendingDelete || !available || !hasData || !report?.revision;
    panel.querySelectorAll('[data-delete-import]').forEach(button => {button.disabled = busy || !!pendingDelete || !available || !(report?.imports || []).find(item => String(item.id) === button.dataset?.deleteImport)?.revision;});
    panel.querySelector('[data-delete-confirm]').disabled = busy || !administrator || !pendingDelete;
    panel.querySelector('[data-delete-cancel]').disabled = busy;
  }
  function beginDelete(kind, trigger) {
    if (!administrator || busy || pendingDelete) return;
    if (!selectedScope || report?.selected_scope !== selectedScope) {status('Chờ tải xong tài khoản trước khi chọn dữ liệu cần xóa.', true);return;}
    const account = (report.scopes || []).find(item => item.scope === selectedScope);
    const item = kind === 'import' ? (report.imports || []).find(entry => String(entry.id) === String(trigger?.dataset.deleteImport)) : null;
    const revision = item?.revision || (kind === 'account' ? report.revision : null);
    if (!account || !revision || (kind === 'import' && !item)) {status('Tải lại dữ liệu trước khi chọn báo cáo cần xóa.', true);return;}
    pendingDelete = Object.freeze({kind,scope:selectedScope,account_label:account.account_label,revision,id:item?.id,trade_date:item?.trade_date,filename:item?.filename});
    panel.querySelector('[data-delete-title]').textContent = kind === 'import' ? `Xóa báo cáo ngày ${date(item.trade_date)}?` : `Xóa toàn bộ dữ liệu đối chiếu của tài khoản ${account.account_label}?`;
    panel.querySelector('[data-delete-detail]').textContent = kind === 'import' ? `Tài khoản: ${account.account_label}. Ngày: ${date(item.trade_date)}. Tệp: ${item.filename}.` : `Tài khoản: ${account.account_label}. Bao gồm tất cả báo cáo đã nhập, ghi chú và lượng cổ phiếu cơ sở của tài khoản này.`;
    panel.querySelector('[data-delete-impact]').textContent = kind === 'import' ? 'Báo cáo và ghi chú của ngày này sẽ bị xóa; các ngày còn lại được tính lại. Lượng cơ sở giữ nguyên. Có thể nhập lại tệp Excel để khôi phục giao dịch, nhưng ghi chú đã xóa không tự khôi phục.' : 'Báo cáo, ghi chú và cơ sở của tài khoản này sẽ bị xóa. Muốn theo dõi lại, cần nhập lại Excel và thiết lập cơ sở. Các tài khoản khác được giữ nguyên.';
    panel.querySelector('[data-delete-confirm]').textContent = kind === 'import' ? 'Xác nhận xóa báo cáo' : 'Xác nhận xóa dữ liệu tài khoản';
    const confirmation = panel.querySelector('[data-delete-confirmation]');confirmation.hidden = false;
    setBusy(false);
    confirmation.scrollIntoView?.({block:'nearest'});
    panel.querySelector('[data-delete-cancel]').focus({preventScroll:true});
  }
  function closeDeleteConfirmation() {
    pendingDelete = null;
    panel.querySelector('[data-delete-confirmation]').hidden = true;
  }
  function restoreDeleteFocus(target) {
    const reportButton = target?.kind === 'import' ? [...panel.querySelectorAll('[data-delete-import]')].find(button => button.dataset?.deleteImport === String(target.id)) : null;
    const accountButton = panel.querySelector('[data-delete-account]');
    const focusTarget = reportButton && !reportButton.disabled ? reportButton : (!accountButton.disabled ? accountButton : panel.querySelector('[data-scope]'));
    focusTarget.focus({preventScroll:true});
  }
  function cancelDelete() {
    if (busy) return;
    const target = pendingDelete;
    closeDeleteConfirmation();setBusy(false);restoreDeleteFocus(target);
    status('Đã hủy, dữ liệu được giữ nguyên.');
  }
  function resetFileSelection() {
    selectedFile = null;preview = null;fileVersion++;
    panel.querySelector('[data-file]').value = '';
    panel.querySelector('[data-file-status]').textContent = 'Chưa chọn tệp.';
    panel.querySelector('[data-preview]').hidden = true;
    panel.querySelector('[data-preview]').replaceChildren();
    panel.querySelector('[data-replace-label]').hidden = true;
    panel.querySelector('[data-replace]').checked = false;
  }
  function removeDeletedDrafts(target) {
    for (const key of drafts.keys()) {
      const [scope, tradeDate] = JSON.parse(key);
      if (scope === target.scope && (target.kind === 'account' || tradeDate === target.trade_date)) drafts.delete(key);
    }
  }
  function invalidateReport() {
    readVersion++;report = null;selectedScope = '';signatures.clear();
    panel.querySelector('[data-scope]').innerHTML = '<option value="">Đang cập nhật tài khoản…</option>';
    panel.querySelector('[data-scope]').value = '';
    panel.querySelector('[data-scope-context]').textContent = 'Đang tải lại dữ liệu đối chiếu…';
    panel.querySelector('[data-positions-count]').textContent = '';
    panel.querySelector('[data-rows-count]').textContent = '';
    ['[data-totals]','[data-warnings]','[data-bases]','[data-positions]','[data-rows]','[data-imports]'].forEach(selector => panel.querySelector(selector).replaceChildren());
    syncBaseForm();syncDeleteControls();
  }
  async function confirmDelete() {
    if (!administrator || busy || !pendingDelete) return;
    const target = pendingDelete, current = epoch, preferredScope = selectedScope;
    const baseDraft = {ticker:panel.querySelector('[data-base-ticker]').value,quantity:panel.querySelector('[data-base-quantity]').value};
    const restoreBaseDraft = (deleted = false) => {
      if (report?.selected_scope === preferredScope && !(deleted && target.kind === 'account' && target.scope === preferredScope)) {
        panel.querySelector('[data-base-ticker]').value = baseDraft.ticker;
        panel.querySelector('[data-base-quantity]').value = baseDraft.quantity;
      }
    };
    const path = target.kind === 'import' ? `/imports/${encodeURIComponent(target.id)}?scope=${encodeURIComponent(target.scope)}&expected_revision=${encodeURIComponent(target.revision)}` : `/accounts/${encodeURIComponent(target.scope)}?expected_revision=${encodeURIComponent(target.revision)}`;
    try {
      readVersion++;setBusy(true);status('Đang xóa dữ liệu đã xác nhận và tính lại phần còn lại…');
      await request(path, {method:'DELETE'});
      if (!validIdentity(current)) return;
      removeDeletedDrafts(target);resetFileSelection();
      if (target.kind === 'account' && selectedScope === target.scope) resetBaseForm();
      closeDeleteConfirmation();invalidateReport();
      const refreshed = await load(false, true, preferredScope);
      if (validIdentity(current) && refreshed) restoreBaseDraft(true);
      if (validIdentity(current)) status(`${target.kind === 'import' ? `Đã xóa báo cáo ngày ${date(target.trade_date)} của tài khoản ${target.account_label}` : `Đã xóa dữ liệu đối chiếu tài khoản ${target.account_label}`}.${refreshed ? '' : ' Chưa tải được số liệu mới; hãy tải lại trang.'}`, !refreshed);
    } catch (error) {
      if (!validIdentity(current)) return;
      if (error.httpStatus === 409 || error.httpStatus === 404) {
        closeDeleteConfirmation();resetFileSelection();invalidateReport();
        const refreshed = await load(false, true, preferredScope);
        if (validIdentity(current) && refreshed) restoreBaseDraft();
        if (validIdentity(current)) status(`${error.message} ${refreshed ? 'Dữ liệu đã được tải lại; hãy chọn lại mục cần xóa.' : 'Chưa tải được dữ liệu mới; hãy tải lại trang trước khi tiếp tục.'}`, true);
      } else status(error.message, true);
    } finally {if (validIdentity(current)) setBusy(false);}
  }
  function render() {
    if (!report) return;
    const criteria = filters(), invalidRange = criteria.from && criteria.to && criteria.from > criteria.to;
    const dailyRows = invalidRange ? [] : filteredRows(report.rows || [], criteria);
    const positions = (report.positions || []).filter(row => !criteria.ticker || row.ticker.includes(criteria.ticker));
    const scope = (report.scopes || []).find(item => item.scope === report.selected_scope);
    panel.querySelector('[data-scope-context]').textContent = scope ? (scope.first_trade_date ? `Tài khoản ${scope.account_label} • dữ liệu đã nhập từ ${date(scope.first_trade_date)} đến ${date(scope.last_trade_date)} • cơ sở đã có sẵn + phần dư mua còn lại từ các báo cáo này.` : `Tài khoản ${scope.account_label} • chỉ còn cơ sở giữ riêng, chưa có báo cáo giao dịch.`) : 'Chưa có báo cáo. Nhập tệp Excel để bắt đầu đối chiếu.';
    const totals = report.totals || {};
    replaceSection('[data-totals]', [['Báo cáo đã nhập',totals.imports_count],['Mã còn dư mua',totals.outstanding_tickers],['Dư mua vượt cơ sở (CP)',totals.outstanding_quantity],['Giá vốn phần dư (VND)',totals.total_cost],['Cơ sở giữ riêng (CP)',totals.base_quantity],['Tổng theo dõi (CP)',totals.total_quantity]].map(([label,value]) => `<article><span>${esc(label)}</span><strong>${number(value)}</strong></article>`).join(''));
    replaceSection('[data-warnings]', totals.ignored_sell_quantity > 0 ? `<p class="reconciliationNotice">${number(totals.ignored_sell_quantity)} CP bán vượt phần dư mua đã được bỏ qua; cơ sở giữ riêng không bị giảm.</p>` : '');
    const bases = (report.bases || []).filter(row => !criteria.ticker || row.ticker.includes(criteria.ticker));
    replaceSection('[data-bases]', table([{label:'Mã'},{label:'Cơ sở giữ riêng (CP)',numeric:true},...(administrator ? [{label:'Thiết lập'}] : [])], bases.map(base => `<tr>${tickerCell(base.ticker)}${numericCell(base.base_quantity)}${administrator ? `<td><button type="button" class="smallButton ghostButton" data-base-edit="${esc(base.ticker)}" ${busy || pendingDelete ? 'disabled' : ''}>Sửa cơ sở</button></td>` : ''}</tr>`), criteria.ticker ? 'Không có cơ sở phù hợp bộ lọc mã.' : 'Chưa thiết lập cơ sở. Mã không có cơ sở được tính từ 0 CP.', 'Lượng cổ phiếu cơ sở giữ riêng cho tài khoản đang chọn'));
    syncBaseForm();
    panel.querySelector('[data-positions-count]').textContent = `${number(positions.length)} / ${number((report.positions || []).length)} mã`;
    replaceSection('[data-positions]', table([{label:'Mã'},{label:'Cơ sở (CP)',numeric:true},{label:'Dư mua còn lại (CP)',numeric:true},{label:'Tổng theo dõi (CP)',numeric:true},{label:'Giá vốn BQ phần dư (VND)',numeric:true},{label:'Giá vốn phần dư (VND)',numeric:true},{label:'Ngày đầu theo dõi'},{label:'Cập nhật gần nhất'},{label:'Trạng thái'}], positions.map(row => `<tr>${tickerCell(row.ticker)}${numericCell(row.base_quantity)}${numericCell(row.quantity)}${numericCell(row.total_quantity)}${numericCell(row.average_cost)}${numericCell(row.total_cost)}${textCell(date(row.first_trade_date))}${textCell(date(row.last_trade_date))}${textCell(statuses[row.status] || row.status || '—')}</tr>`), criteria.ticker ? 'Không có mã phù hợp bộ lọc.' : 'Chưa có cơ sở hoặc giao dịch trong tài khoản này.', 'Cổ phiếu cơ sở và dư mua còn lại, giá vốn chỉ tính phần dư'));
    panel.querySelector('[data-rows-count]').textContent = invalidRange ? 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.' : `${number(dailyRows.length)} / ${number((report.rows || []).length)} dòng`;
    replaceSection('[data-rows]', table([{label:'Mã'},{label:'Ngày'},{label:'SL mua',numeric:true},{label:'SL bán',numeric:true},{label:'Đối ứng',numeric:true},{label:'Dư mua ngày',numeric:true},{label:'Bán trừ dư cũ',numeric:true},{label:'Bán vượt dư bỏ qua',numeric:true},{label:'Giá mua BQ ngày (VND)',numeric:true},{label:'Cơ sở (CP)',numeric:true},{label:'Dư mua trước ngày',numeric:true},{label:'Dư mua còn lại',numeric:true},{label:'Tổng theo dõi đầu ngày',numeric:true},{label:'Tổng theo dõi cuối ngày',numeric:true},{label:'Giá vốn BQ phần dư (VND)',numeric:true},{label:'Trạng thái cuối ngày'},{label:'Ghi chú'}], dailyRows.map(row => {
      const key = rowKey(row), note = drafts.has(key) ? drafts.get(key) : row.note || '';
      const noteCell = administrator ? `<td class="reconciliationNote"><label class="reconciliationSrOnly" for="reconciliation-note-${esc(row.trade_date)}-${esc(row.ticker)}">Ghi chú ${esc(row.ticker)} ngày ${date(row.trade_date)}</label><textarea id="reconciliation-note-${esc(row.trade_date)}-${esc(row.ticker)}" data-note-input="${esc(key)}" rows="2" maxlength="2000" ${busy || pendingDelete ? 'disabled' : ''}>${esc(note)}</textarea><button type="button" class="smallButton ghostButton" data-note-save="${esc(key)}" ${busy || pendingDelete ? 'disabled' : ''}>Lưu ghi chú</button></td>` : `<td class="reconciliationNote">${esc(note || '—')}</td>`;
      return `<tr>${tickerCell(row.ticker)}${textCell(date(row.trade_date))}${numericCell(row.buy_quantity)}${numericCell(row.sell_quantity)}${numericCell(row.matched_quantity)}${numericCell(row.residual_buy_quantity)}${numericCell(row.tracked_sell_quantity)}${numericCell(row.ignored_sell_quantity)}${numericCell(row.buy_average_price)}${numericCell(row.base_quantity)}${numericCell(row.opening_quantity)}${numericCell(row.closing_quantity)}${numericCell(row.opening_total_quantity)}${numericCell(row.closing_total_quantity)}${numericCell(row.closing_average_cost)}<td><span class="reconciliationBadge ${row.status === 'buy_remaining' ? 'remaining' : ''}">${esc(statuses[row.status] || row.status || '—')}</span></td>${noteCell}</tr>`;
    }), invalidRange ? 'Kiểm tra lại khoảng ngày.' : 'Không có giao dịch phù hợp bộ lọc.', 'Đối chiếu số lượng mua bán từng mã mỗi ngày'));
    replaceSection('[data-imports]', table([{label:'Ngày giao dịch'},{label:'Tệp báo cáo'},{label:'Số mã',numeric:true},{label:'Người nhập'},...(administrator ? [{label:'Thao tác'}] : [])], (report.imports || []).map(item => `<tr>${textCell(date(item.trade_date))}${textCell(item.filename)}${numericCell(item.rows_count)}${textCell(item.created_by)}${administrator ? `<td><button type="button" class="smallButton reconciliationDangerButton" data-delete-import="${esc(item.id)}" aria-label="Xóa báo cáo ngày ${date(item.trade_date)}: ${esc(item.filename)}" ${busy || pendingDelete || !item.revision ? 'disabled' : ''}>Xóa báo cáo</button></td>` : ''}</tr>`), 'Chưa nhập báo cáo.', 'Lịch sử báo cáo của tài khoản đang chọn'));
    syncDeleteControls();
  }
  function renderScopes() {
    const select = panel.querySelector('[data-scope]');
    const options = (report.scopes || []).map(scope => `<option value="${esc(scope.scope)}">${esc(scope.account_label)}</option>`).join('') || '<option value="">Chưa có tài khoản</option>';
    if (signatures.get('scopes') !== options) {select.innerHTML = options;signatures.set('scopes', options);}
    const nextScope = report.selected_scope || '';
    if (selectedScope !== nextScope) resetBaseForm();
    selectedScope = nextScope;select.value = selectedScope;
  }
  async function load(explicit = false, force = false, preferredScope = null) {
    if (!identity || (busy && !force)) return;
    const current = epoch, read = ++readVersion;
    if (explicit) status('Đang tải báo cáo tài khoản…');
    try {
      let result = await request(preferredScope === null && selectedScope ? `?scope=${encodeURIComponent(selectedScope)}` : '');
      if (!validIdentity(current) || read !== readVersion) return false;
      if (preferredScope && result.selected_scope !== preferredScope && (result.scopes || []).some(item => item.scope === preferredScope)) {
        result = await request(`?scope=${encodeURIComponent(preferredScope)}`);
        if (!validIdentity(current) || read !== readVersion) return false;
      }
      report = result;renderScopes();render();
      if (explicit || panel.querySelector('[data-status]').textContent === 'Đang tải dữ liệu…') status('Đã tải dữ liệu đối chiếu.');
      return true;
    } catch (error) {if (validIdentity(current) && read === readVersion) status(error.message, true);return false;}
  }
  function clear() {
    epoch++;readVersion++;fileVersion++;identity = null;administrator = false;selectedScope = '';report = null;selectedFile = null;preview = null;busy = false;pendingDelete = null;
    signatures.clear();drafts.clear();
    if (panel) {panel.removeEventListener('input', noteInput);panel.removeEventListener('click', actionClick);panel.replaceChildren();panel.hidden = true;panel.removeAttribute('aria-busy');}
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
