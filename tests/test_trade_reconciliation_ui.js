const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../app/static/trade-reconciliation.js'), 'utf8');
function element() {
  return {value:'', textContent:'', innerHTML:'', hidden:false, disabled:false, checked:false,
    listeners:new Map(), classList:{toggle(){}}, setAttribute(){}, removeAttribute(){}, contains(){return false;},
    focus(){},
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
vm.runInContext(source.replace('window.TradeReconciliation = {clear, refresh};', 'window.TradeReconciliation = {clear, refresh, test:{filteredRows,date,table,state:()=>({selectedFile,preview,report,identity,selectedScope,busy})}};'), context);
const moduleApi = context.window.TradeReconciliation;
const sample = (ticker, scope = 'scope-one') => ({scopes:[{scope,account_label:'***01',first_trade_date:'2026-10-01',last_trade_date:'2026-10-02'}],selected_scope:scope,
  rows:[{scope,ticker,trade_date:'2026-10-02',buy_quantity:100,sell_quantity:50,matched_quantity:50,residual_buy_quantity:50,tracked_sell_quantity:0,ignored_sell_quantity:0,buy_average_price:25000,base_quantity:10000,opening_quantity:100,closing_quantity:150,opening_total_quantity:10100,closing_total_quantity:10150,closing_average_cost:23000,status:'buy_remaining',note:''}],
  positions:[{scope,ticker,quantity:150,base_quantity:10000,total_quantity:10150,average_cost:23000,total_cost:3450000,first_trade_date:'2026-10-01',last_trade_date:'2026-10-02',status:'buy_remaining'}],
  bases:[{scope,ticker,base_quantity:10000}],imports:[],
  totals:{imports_count:2,outstanding_tickers:1,outstanding_quantity:150,total_cost:3450000,base_quantity:10000,total_quantity:10150,ignored_sell_quantity:0}});
const resolve = (request, body) => request.resolve({ok:true,status:200,json:async()=>body});
const tick = () => new Promise(setImmediate);
const submitBase = () => get('[data-base-form]').listeners.get('submit')({preventDefault(){}});

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

  assert.equal(moduleApi.test.date('2026-10-02'), '02/10/2026');
  assert.equal(moduleApi.test.date(null), '—');
  const rows = Array.from({length:130}, (_,i) => ({ticker:`FPT${i}`,trade_date:'2026-10-02'}));
  assert.equal(moduleApi.test.filteredRows(rows, {ticker:'FPT',from:'2026-10-01',to:'2026-10-03'}).length, 130);
  assert.equal(moduleApi.test.filteredRows(rows, {ticker:'FPT',from:'2026-10-03',to:''}).length, 0);
  assert.match(moduleApi.test.table([{label:'<img>'}],[], '<script>', 'Caption'), /&lt;img&gt;|&lt;script&gt;/);
  assert.doesNotMatch(moduleApi.test.table([{label:'<img>'}],[], '<script>', 'Caption'), /<img>|<script>/);
  console.log('Trade reconciliation UI: async isolation, scopes, base mutations, sales, permissions, preview and draft retention passed.');
})().catch(error => {console.error(error);process.exitCode = 1;});
