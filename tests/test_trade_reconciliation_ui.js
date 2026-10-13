const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../app/static/trade-reconciliation.js'), 'utf8');
function element() {
  return {value:'', textContent:'', innerHTML:'', hidden:false, disabled:false, checked:false,
    listeners:new Map(), classList:{toggle(){}}, setAttribute(){}, removeAttribute(){}, contains(){return false;},
    focus(){this.focused = true;},
    addEventListener(type, handler){this.listeners.set(type, handler);}, removeEventListener(type){this.listeners.delete(type);},
    replaceChildren(){this.innerHTML = '';}, querySelectorAll(){return [];}};
}
const elements = new Map();
const get = selector => {if (!elements.has(selector)) elements.set(selector, element());return elements.get(selector);};
const panel = element();panel.querySelector = get;panel.querySelectorAll = selector => selector.split(',').map(item => get(item.trim()));
const pending = [];
const context = vm.createContext({document:{querySelector:() => panel, activeElement:null},window:{},
  fetch:(url, options) => new Promise(resolve => pending.push({url, options, resolve})),
});
vm.runInContext(source.replace('window.TradeReconciliation = {clear, refresh};', 'window.TradeReconciliation = {clear, refresh, test:{filteredRows,date,table,state:()=>({selectedFile,preview,report,identity,selectedScope,busy,pendingDelete,draftKeys:[...drafts.keys()]})}};'), context);
const moduleApi = context.window.TradeReconciliation;
const sample = (ticker, scope = 'scope-one') => ({scopes:[{scope,account_label:'***01',first_trade_date:'2026-10-01',last_trade_date:'2026-10-02'}],selected_scope:scope,
  rows:[{scope,ticker,trade_date:'2026-10-02',buy_quantity:100,sell_quantity:50,matched_quantity:50,residual_buy_quantity:50,tracked_sell_quantity:0,ignored_sell_quantity:0,buy_average_price:25000,base_quantity:10000,opening_quantity:100,closing_quantity:150,opening_total_quantity:10100,closing_total_quantity:10150,closing_average_cost:23000,status:'buy_remaining',note:''}],
  positions:[{scope,ticker,quantity:150,base_quantity:10000,total_quantity:10150,average_cost:23000,total_cost:3450000,first_trade_date:'2026-10-01',last_trade_date:'2026-10-02',status:'buy_remaining'}],
  bases:[{scope,ticker,base_quantity:10000}],revision:'account-r1',imports:[{id:41,trade_date:'2026-10-02',filename:'report.xlsx',revision:'report-r1',rows_count:1,created_by:'admin'}],
  totals:{imports_count:2,outstanding_tickers:1,outstanding_quantity:150,total_cost:3450000,base_quantity:10000,total_quantity:10150,ignored_sell_quantity:0}});
const resolve = (request, body) => request.resolve({ok:true,status:200,json:async()=>body});
const tick = () => new Promise(setImmediate);
const submitBase = () => get('[data-base-form]').listeners.get('submit')({preventDefault(){}});
const clickDeleteImport = id => {
  const trigger = element();trigger.dataset = {deleteImport:String(id)};trigger.isConnected = true;
  elements.set('[data-delete-import]',trigger);
  panel.listeners.get('click')({target:{closest:selector => selector === '[data-delete-import]' ? trigger : null}});
  return trigger;
};
const clickDeleteAccount = () => get('[data-delete-account]').listeners.get('click')({currentTarget:get('[data-delete-account]')});
const clickConfirmDelete = () => get('[data-delete-confirm]').listeners.get('click')();
const draftNote = (scope,day,ticker,note) => {
  const input = {dataset:{noteInput:JSON.stringify([scope,day,ticker])},value:note};
  panel.listeners.get('input')({target:{closest:() => input}});
};
const emptyReport = () => ({scopes:[],selected_scope:null,rows:[],positions:[],bases:[],imports:[],revision:null,totals:{imports_count:0,outstanding_tickers:0,outstanding_quantity:0,total_cost:0,base_quantity:0,total_quantity:0,ignored_sell_quantity:0}});

(async () => {
  const oldUser = moduleApi.refresh({id:1,role:'admin'}), oldRequest = pending.shift();
  assert(oldRequest);
  const nextUser = moduleApi.refresh({id:2,role:'admin'}), nextRequest = pending.shift();
  resolve(nextRequest, sample('NEW'));await nextUser;
  resolve(oldRequest, sample('PRIVATE_OLD'));await oldUser;
  assert.match(get('[data-rows]').innerHTML, /NEW/);
  assert.doesNotMatch(get('[data-rows]').innerHTML, /PRIVATE_OLD/);

  // A polling response arriving after logout must not expose the previous account.
  const polling = moduleApi.refresh({id:2,role:'admin'}), pollingRequest = pending.shift();
  moduleApi.clear();resolve(pollingRequest, sample('PRIVATE_AFTER_LOGOUT'));await polling;
  assert.equal(panel.innerHTML, '');assert.equal(panel.hidden, true);

  await moduleApi.refresh({id:3,role:'user',features:[]});assert.equal(pending.length, 0);
  await moduleApi.refresh({id:3,role:'user',features:['tradeReconciliation'],strategies:['RF']});
  assert.equal(pending.length, 0);assert.match(panel.innerHTML, /quyền xem toàn danh mục/);

  const viewerLoad = moduleApi.refresh({id:4,role:'user',features:['tradeReconciliation']});
  resolve(pending.shift(), sample('FPT'));await viewerLoad;
  assert.match(panel.innerHTML, /data-import-area hidden/);
  assert.match(panel.innerHTML, /data-base-admin hidden/);
  assert.equal(get('[data-base-save]').disabled, true);
  assert.doesNotMatch(get('[data-bases]').innerHTML, /data-base-edit/);
  assert.doesNotMatch(get('[data-imports]').innerHTML, /data-delete-import/);
  assert.match(panel.innerHTML, /data-delete-account-area hidden/);
  assert.equal(get('[data-delete-account]').disabled, true);
  clickDeleteImport(41);clickDeleteAccount();await clickConfirmDelete();
  assert.equal(pending.length, 0, 'Read-only viewers cannot open or confirm delete actions');
  assert.doesNotMatch(get('[data-rows]').innerHTML, /data-note-save|textarea/);
  get('[data-base-ticker]').value = 'FPT';get('[data-base-quantity]').value = '10000';
  await submitBase();assert.equal(pending.length, 0, 'Viewers cannot mutate base configurations');

  const adminLoad = moduleApi.refresh({id:5,role:'admin'});resolve(pending.shift(), sample('FPT'));await adminLoad;
  assert.match(get('[data-rows]').innerHTML, /data-note-save/);
  assert.match(panel.innerHTML, /bán giảm tồn vượt cơ sở/);
  assert.doesNotMatch(panel.innerHTML, /Ngày bán nhiều hơn hoặc bằng mua được bỏ qua/);
  assert.match(get('[data-positions]').innerHTML, /Cơ sở \(CP\)|Tổng theo dõi/);
  assert.equal(get('[data-base-save]').disabled, false);
  get('[data-base-ticker]').value = 'cii';get('[data-base-quantity]').value = '10000';
  const file = {name:'report.xlsx',size:1024};
  get('[data-file]').listeners.get('change')({target:{files:[file]}});
  assert.equal(get('[data-import-button]').disabled, true);
  assert.equal(moduleApi.test.state().selectedFile, file);
  const sameUserPoll = moduleApi.refresh({id:5,role:'admin'});resolve(pending.shift(), sample('FPT'));await sameUserPoll;
  assert.equal(moduleApi.test.state().selectedFile, file, 'Polling must retain selected files before preview/import');
  assert.equal(get('[data-base-ticker]').value, 'cii', 'Polling must retain an unsaved base ticker');
  assert.equal(get('[data-base-quantity]').value, '10000', 'Polling must retain an unsaved base quantity');
  assert.equal(get('[data-import-button]').disabled, true, 'Cannot import a file without a preview');
  const previewTask = get('[data-preview-button]').listeners.get('click')(), previewRequest = pending.shift();
  assert.equal(previewRequest.url, '/api/trade-reconciliation/preview');
  assert.equal(previewRequest.options.body, file);
  resolve(previewRequest, {scope:'scope-one',account_label:'***01',trade_date:'2026-10-02',rows:sample('FPT').rows,import_state:'conflict'});await previewTask;
  assert.equal(get('[data-replace-label]').hidden, false);
  assert.equal(get('[data-import-button]').disabled, true, 'A conflicting report requires explicit replacement');
  get('[data-replace]').checked = true;get('[data-replace]').listeners.get('change')();
  assert.equal(get('[data-import-button]').disabled, false);
  get('[data-file]').listeners.get('change')({target:{files:[{name:'different.xlsx',size:1024}]}});
  assert.equal(moduleApi.test.state().preview, null);
  assert.equal(get('[data-import-button]').disabled, true, 'Changing the file invalidates its previous preview');

  // Base mutations use the currently loaded scope and freeze drafts until the response returns.
  const baseTask = submitBase(), baseRequest = pending.shift();
  assert.equal(baseRequest.url, '/api/trade-reconciliation/bases');
  assert.equal(baseRequest.options.method, 'PUT');
  assert.deepEqual(JSON.parse(baseRequest.options.body), {scope:'scope-one',ticker:'CII',base_quantity:10000});
  assert.equal(get('[data-scope]').disabled, true);
  assert.equal(get('[data-base-ticker]').disabled, true);
  assert.equal(get('[data-note-input]').disabled, true);
  get('[data-scope]').listeners.get('change')({target:{value:'scope-other'}});
  assert.equal(moduleApi.test.state().selectedScope, 'scope-one', 'Cannot reroute a pending base mutation');
  resolve(baseRequest, {scope:'scope-one',ticker:'CII',base_quantity:10000});await tick();
  const afterBase = sample('CII');
  resolve(pending.shift(), afterBase);await baseTask;
  assert.match(get('[data-status]').textContent, /Đã lưu cơ sở CII/);
  assert.equal(get('[data-base-ticker]').value, '');assert.equal(get('[data-scope]').disabled, false);
  panel.listeners.get('click')({target:{closest:selector => selector === '[data-base-edit]' ? {dataset:{baseEdit:'CII'}} : null}});
  assert.equal(get('[data-base-ticker]').value, 'CII');assert.equal(get('[data-base-quantity]').value, '10000');

  // Switching accounts clears the base draft, and saving while the account is still loading is blocked.
  get('[data-scope]').listeners.get('change')({target:{value:'scope-two'}});
  const scopeRequest = pending.shift();
  assert.equal(scopeRequest.url, '/api/trade-reconciliation?scope=scope-two');
  assert.equal(get('[data-base-ticker]').value, '');assert.equal(get('[data-base-save]').disabled, true);
  get('[data-base-ticker]').value = 'CII';get('[data-base-quantity]').value = '20000';
  await submitBase();assert.equal(pending.length, 0, 'Must not save a base against a stale account report');
  resolve(scopeRequest, sample('FPT', 'scope-two'));await tick();
  assert.equal(get('[data-base-save]').disabled, false);
  get('[data-base-quantity]').value = '1.5';await submitBase();assert.equal(pending.length, 0);
  get('[data-base-quantity]').value = '1000000000001';await submitBase();assert.equal(pending.length, 0);
  get('[data-base-quantity]').value = '0';
  const removeBase = submitBase(), removeRequest = pending.shift();
  assert.deepEqual(JSON.parse(removeRequest.options.body), {scope:'scope-two',ticker:'CII',base_quantity:0});
  resolve(removeRequest, {base_quantity:0});await tick();resolve(pending.shift(), sample('CII','scope-two'));await removeBase;
  assert.match(get('[data-status]').textContent, /Đã bỏ cơ sở CII/);

  // A sell-only day is rendered with the server's reduced surplus and preserved average cost.
  const sold = sample('CII','scope-two');
  Object.assign(sold.rows[0], {buy_quantity:0,sell_quantity:500,matched_quantity:0,residual_buy_quantity:0,tracked_sell_quantity:500,opening_quantity:2000,closing_quantity:1500,opening_total_quantity:12000,closing_total_quantity:11500,buy_average_price:null,closing_average_cost:23000});
  Object.assign(sold.positions[0], {quantity:1500,total_quantity:11500,total_cost:34500000});
  const soldLoad = moduleApi.refresh({id:5,role:'admin'});resolve(pending.shift(), sold);await soldLoad;
  assert.match(get('[data-rows]').innerHTML, /Bán trừ dư cũ/);
  assert.match(get('[data-rows]').innerHTML, />1\.500</);
  assert.match(get('[data-rows]').innerHTML, />11\.500</);
  assert.match(get('[data-rows]').innerHTML, />23\.000</);
  const noteInput = get('[data-note-input]');
  noteInput.dataset = {noteInput:JSON.stringify(['scope-two','2026-10-02','CII'])};noteInput.value = 'Đã bán một phần';
  panel.listeners.get('input')({target:{closest:() => noteInput}});
  const noteTask = panel.listeners.get('click')({target:{closest:selector => selector === '[data-note-save]' ? {dataset:{noteSave:noteInput.dataset.noteInput}} : null}});
  const noteRequest = pending.shift();
  assert.equal(noteRequest.url, '/api/trade-reconciliation/notes');
  assert.deepEqual(JSON.parse(noteRequest.options.body), {scope:'scope-two',trade_date:'2026-10-02',ticker:'CII',note:'Đã bán một phần'});
  resolve(noteRequest, {saved:true});await tick();sold.rows[0].note = 'Đã bán một phần';resolve(pending.shift(),sold);await noteTask;
  assert.match(get('[data-rows]').innerHTML, /Đã bán một phần/);

  const closed = sample('CII','scope-two');
  Object.assign(closed.positions[0], {quantity:0,total_quantity:10000,average_cost:null,total_cost:0,status:'base_only'});
  Object.assign(closed.rows[0], {closing_quantity:0,closing_total_quantity:10000,closing_average_cost:null,status:'base_only',ignored_sell_quantity:250});
  closed.totals.ignored_sell_quantity = 250;
  const closedLoad = moduleApi.refresh({id:5,role:'admin'});resolve(pending.shift(),closed);await closedLoad;
  assert.match(get('[data-positions]').innerHTML, /Chỉ còn cơ sở/);
  assert.match(get('[data-warnings]').innerHTML, /250 CP bán vượt/);

  // Delete confirmation is explicit and cancellable; it never fires a mutation on the first click.
  const initialDeleteLoad = moduleApi.refresh({id:5,role:'admin'});resolve(pending.shift(),sample('CII'));await initialDeleteLoad;
  assert.match(get('[data-imports]').innerHTML, /data-delete-import="41"/);
  const cancelTrigger = clickDeleteImport(41);
  assert.equal(pending.length, 0);
  assert.equal(get('[data-delete-confirmation]').hidden, false);
  assert.equal(get('[data-delete-cancel]').focused, true);
  assert.match(get('[data-delete-detail]').textContent, /\*\*\*01.*02\/10\/2026.*report.xlsx/);
  assert.equal(moduleApi.test.state().pendingDelete.revision, 'report-r1');
  const replacementTrigger = element();replacementTrigger.dataset = {deleteImport:'41'};
  elements.set('[data-delete-import]',replacementTrigger);cancelTrigger.isConnected = false;
  get('[data-delete-cancel]').listeners.get('click')();
  assert.equal(moduleApi.test.state().pendingDelete, null);
  assert.equal(get('[data-delete-confirmation]').hidden, true);
  assert.equal(replacementTrigger.focused, true, 'Cancel restores focus by stable report id after the original DOM node is replaced');
  assert.equal(pending.length, 0, 'Cancel retains all reports');

  // Changing scopes while confirmation is open keeps the captured account, id, date and revision.
  draftNote('scope-one','2026-10-02','CII','Delete this day');
  draftNote('scope-one','2026-10-01','CII','Keep prior day');
  draftNote('scope-two','2026-10-02','FPT','Keep other account');
  get('[data-file]').listeners.get('change')({target:{files:[file]}});
  clickDeleteImport(41);
  get('[data-scope]').listeners.get('change')({target:{value:'scope-two'}});
  resolve(pending.shift(),sample('FPT','scope-two'));await tick();
  assert.equal(moduleApi.test.state().pendingDelete.scope, 'scope-one');
  assert.match(get('[data-delete-detail]').textContent, /report.xlsx/);
  const deleteOneTask = clickConfirmDelete(), deleteOneRequest = pending.shift();
  assert.equal(deleteOneRequest.url, '/api/trade-reconciliation/imports/41?scope=scope-one&expected_revision=report-r1');
  assert.equal(deleteOneRequest.options.method, 'DELETE');
  assert.equal(get('[data-scope]').disabled, true);
  resolve(deleteOneRequest,{deleted_imports_count:1});await tick();
  const unscoped = pending.shift();assert.equal(unscoped.url, '/api/trade-reconciliation');
  const defaultAccount = sample('OLD');defaultAccount.scopes.push(sample('FPT','scope-two').scopes[0]);
  resolve(unscoped,defaultAccount);await tick();
  const restoreScope = pending.shift();assert.equal(restoreScope.url, '/api/trade-reconciliation?scope=scope-two');
  resolve(restoreScope,sample('FPT','scope-two'));await deleteOneTask;
  assert.equal(moduleApi.test.state().selectedScope, 'scope-two');
  assert.equal(moduleApi.test.state().selectedFile, null);
  assert.equal(moduleApi.test.state().preview, null);
  assert.equal(moduleApi.test.state().draftKeys.includes(JSON.stringify(['scope-one','2026-10-02','CII'])), false);
  assert.equal(moduleApi.test.state().draftKeys.includes(JSON.stringify(['scope-one','2026-10-01','CII'])), true);
  assert.equal(moduleApi.test.state().draftKeys.includes(JSON.stringify(['scope-two','2026-10-02','FPT'])), true);

  // Clearing the final account also clears its bases/drafts and ignores polling responses started before deletion.
  get('[data-base-ticker]').value = 'CII';get('[data-base-quantity]').value = '10000';
  const oldPoll = moduleApi.refresh({id:5,role:'admin'}), oldPollRequest = pending.shift();
  clickDeleteAccount();
  const clearAccountTask = clickConfirmDelete(), clearAccountRequest = pending.shift();
  assert.equal(clearAccountRequest.url, '/api/trade-reconciliation/accounts/scope-two?expected_revision=account-r1');
  resolve(oldPollRequest,sample('STALE_BEFORE_DELETE','scope-two'));await oldPoll;
  assert.doesNotMatch(get('[data-rows]').innerHTML, /STALE_BEFORE_DELETE/);
  resolve(clearAccountRequest,{deleted_imports_count:1,deleted_notes_count:1,deleted_bases_count:1});await tick();
  const emptyReload = pending.shift();assert.equal(emptyReload.url, '/api/trade-reconciliation');
  resolve(emptyReload,emptyReport());await clearAccountTask;
  assert.equal(moduleApi.test.state().selectedScope, '');
  assert.equal(get('[data-base-ticker]').value, '');
  assert.equal(get('[data-base-quantity]').value, '');
  assert.equal(moduleApi.test.state().draftKeys.includes(JSON.stringify(['scope-two','2026-10-02','FPT'])), false);
  assert.equal(moduleApi.test.state().draftKeys.includes(JSON.stringify(['scope-one','2026-10-01','CII'])), true);
  assert.equal(get('[data-delete-account]').disabled, true);
  assert.equal(pending.length, 0, 'The removed final account is not reloaded with an invalid scope');

  // Deleting a final report leaves a base-only account selectable and allows clearing that account later.
  const baseOnlyLoad = moduleApi.refresh({id:5,role:'admin'});resolve(pending.shift(),sample('CII'));await baseOnlyLoad;
  clickDeleteImport(41);const finalReportTask = clickConfirmDelete();resolve(pending.shift(),{deleted_imports_count:1});await tick();
  const baseOnly = sample('CII');baseOnly.imports = [];baseOnly.rows = [];
  baseOnly.scopes[0].first_trade_date = null;baseOnly.scopes[0].last_trade_date = null;
  baseOnly.positions[0].quantity = 0;baseOnly.positions[0].status = 'base_only';
  resolve(pending.shift(),baseOnly);await finalReportTask;
  assert.equal(moduleApi.test.state().selectedScope, 'scope-one');
  assert.equal(get('[data-delete-account]').disabled, false);
  assert.match(get('[data-scope-context]').textContent, /chỉ còn cơ sở giữ riêng/);

  // Concurrent edits reject an old captured revision; a fresh confirmation is required after reload.
  clickDeleteAccount();
  const conflictPoll = moduleApi.refresh({id:5,role:'admin'});const changed = sample('CII');changed.revision = 'account-r2';
  resolve(pending.shift(),changed);await conflictPoll;
  assert.equal(moduleApi.test.state().pendingDelete.revision, 'account-r1');
  const conflictTask = clickConfirmDelete(), conflictRequest = pending.shift();
  assert.match(conflictRequest.url, /expected_revision=account-r1$/);
  conflictRequest.resolve({ok:false,status:409,json:async()=>({detail:'Dữ liệu đã thay đổi.'})});await tick();
  assert.equal(pending[0].url, '/api/trade-reconciliation');resolve(pending.shift(),changed);await conflictTask;
  assert.equal(moduleApi.test.state().pendingDelete, null);
  assert.equal(get('[data-delete-confirmation]').hidden, true);
  assert.match(get('[data-status]').textContent, /hãy chọn lại mục cần xóa/);
  await clickConfirmDelete();assert.equal(pending.length, 0, 'A rejected revision cannot be retried through an old confirmation');

  // After a successful delete, a failed GET cannot leave deleted cached rows or enabled mutation controls.
  clickDeleteImport(41);const failedRefreshDelete = clickConfirmDelete();
  resolve(pending.shift(),{deleted_imports_count:1});await tick();
  assert.equal(moduleApi.test.state().report, null);
  assert.equal(get('[data-rows]').innerHTML, '');
  assert.equal(get('[data-base-save]').disabled, true);
  const failedReload = pending.shift();failedReload.resolve({ok:true,status:200,json:async()=>{throw new SyntaxError('Malformed JSON');}});await failedRefreshDelete;
  assert.equal(moduleApi.test.state().report, null);
  assert.equal(get('[data-delete-account]').disabled, true);
  assert.equal(get('[data-base-save]').disabled, true);
  assert.match(get('[data-status]').textContent, /Chưa tải được số liệu mới/);
  const retryLoad = moduleApi.refresh({id:5,role:'admin'});assert.equal(pending[0].url, '/api/trade-reconciliation');
  resolve(pending.shift(),changed);await retryLoad;

  // A rejected revision followed by a failed reload must also clear stale data and avoid claiming a successful reload.
  clickDeleteAccount();const rejectedReload = clickConfirmDelete();
  pending.shift().resolve({ok:false,status:409,json:async()=>({detail:'Dữ liệu đã thay đổi.'})});await tick();
  pending.shift().resolve({ok:false,status:500,json:async()=>({detail:'Lỗi tải lại.'})});await rejectedReload;
  assert.equal(moduleApi.test.state().report, null);
  assert.equal(get('[data-rows]').innerHTML, '');
  assert.equal(get('[data-delete-account]').disabled, true);
  assert.match(get('[data-status]').textContent, /Chưa tải được dữ liệu mới/);
  assert.doesNotMatch(get('[data-status]').textContent, /Dữ liệu đã được tải lại/);
  const afterRejectedLoad = moduleApi.refresh({id:5,role:'admin'});resolve(pending.shift(),changed);await afterRejectedLoad;

  // A current-session auth failure invalidates the entire module, while an old session's failure cannot clear a new user.
  const oldAuthLoad = moduleApi.refresh({id:5,role:'admin'}), oldAuthRequest = pending.shift();
  const newAuthLoad = moduleApi.refresh({id:6,role:'admin'});resolve(pending.shift(),sample('NEW_IDENTITY'));await newAuthLoad;
  oldAuthRequest.resolve({ok:false,status:401,json:async()=>({detail:'Phiên cũ hết hạn.'})});await oldAuthLoad;
  assert.match(get('[data-rows]').innerHTML, /NEW_IDENTITY/);
  assert.notEqual(moduleApi.test.state().identity, null);
  const revokedLoad = moduleApi.refresh({id:6,role:'admin'});
  pending.shift().resolve({ok:false,status:403,json:async()=>({detail:'Quyền đã bị thu hồi.'})});await revokedLoad;
  assert.equal(moduleApi.test.state().report, null);
  assert.equal(moduleApi.test.state().identity, null);
  assert.equal(panel.innerHTML, '');assert.equal(panel.hidden, true);
  const authRecovery = moduleApi.refresh({id:5,role:'admin'});resolve(pending.shift(),changed);await authRecovery;
  const malformedAuth = moduleApi.refresh({id:5,role:'admin'});
  pending.shift().resolve({ok:false,status:401,json:async()=>{throw new SyntaxError('Malformed auth JSON');}});await malformedAuth;
  assert.equal(moduleApi.test.state().identity, null);
  assert.equal(panel.innerHTML, '');assert.equal(panel.hidden, true);
  const afterMalformedAuth = moduleApi.refresh({id:5,role:'admin'});resolve(pending.shift(),changed);await afterMalformedAuth;

  // A deletion finishing after logout must not render old data or issue a report request.
  clickDeleteAccount();const logoutDeleteTask = clickConfirmDelete(), logoutDeleteRequest = pending.shift();
  moduleApi.clear();resolve(logoutDeleteRequest,{deleted_imports_count:1});await logoutDeleteTask;
  assert.equal(panel.innerHTML, '');assert.equal(panel.hidden, true);
  assert.equal(pending.length, 0);

  assert.equal(moduleApi.test.date('2026-10-02'), '02/10/2026');
  assert.equal(moduleApi.test.date(null), '—');
  const rows = Array.from({length:130}, (_,i) => ({ticker:`FPT${i}`,trade_date:'2026-10-02'}));
  assert.equal(moduleApi.test.filteredRows(rows, {ticker:'FPT',from:'2026-10-01',to:'2026-10-03'}).length, 130);
  assert.equal(moduleApi.test.filteredRows(rows, {ticker:'FPT',from:'2026-10-03',to:''}).length, 0);
  assert.match(moduleApi.test.table([{label:'<img>'}],[], '<script>', 'Caption'), /&lt;img&gt;|&lt;script&gt;/);
  assert.doesNotMatch(moduleApi.test.table([{label:'<img>'}],[], '<script>', 'Caption'), /<img>|<script>/);
  console.log('Trade reconciliation UI: async isolation, bases, sales, previews, explicit deletes, revisions, scopes and draft retention passed.');
})().catch(error => {console.error(error);process.exitCode = 1;});
