const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../app/static/trade-reconciliation.js'), 'utf8');
function element() {
  return {value:'', textContent:'', innerHTML:'', hidden:false, disabled:false, checked:false,
    listeners:new Map(), classList:{toggle(){}}, setAttribute(){}, removeAttribute(){}, contains(){return false;},
    addEventListener(type, handler){this.listeners.set(type, handler);}, removeEventListener(type){this.listeners.delete(type);},
    replaceChildren(){this.innerHTML = '';}, querySelectorAll(){return [];}};
}
const elements = new Map();
const get = selector => {if (!elements.has(selector)) elements.set(selector, element());return elements.get(selector);};
const panel = element();panel.querySelector = get;panel.querySelectorAll = () => [];
const pending = [];
const context = vm.createContext({document:{querySelector:() => panel, activeElement:null},window:{},
  fetch:(url, options) => new Promise(resolve => pending.push({url, options, resolve})),
});
vm.runInContext(source.replace('window.TradeReconciliation = {clear, refresh};', 'window.TradeReconciliation = {clear, refresh, test:{filteredRows,date,table,state:()=>({selectedFile,preview,report,identity})}};'), context);
const moduleApi = context.window.TradeReconciliation;
const sample = (ticker, scope = 'scope-one') => ({scopes:[{scope,account_label:'***01',first_trade_date:'2026-10-01',last_trade_date:'2026-10-02'}],selected_scope:scope,
  rows:[{scope,ticker,trade_date:'2026-10-02',buy_quantity:100,sell_quantity:50,matched_quantity:50,residual_buy_quantity:50,buy_average_price:25000,opening_quantity:100,closing_quantity:150,closing_average_cost:23000,status:'buy_remaining',note:''}],
  positions:[{scope,ticker,quantity:150,average_cost:23000,total_cost:3450000,first_trade_date:'2026-10-01',last_trade_date:'2026-10-02'}],imports:[],
  totals:{imports_count:2,outstanding_tickers:1,outstanding_quantity:150,total_cost:3450000,ignored_rows_count:1}});
const resolve = (request, body) => request.resolve({ok:true,status:200,json:async()=>body});

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
  assert.doesNotMatch(get('[data-rows]').innerHTML, /data-note-save|textarea/);

  const adminLoad = moduleApi.refresh({id:5,role:'admin'});resolve(pending.shift(), sample('FPT'));await adminLoad;
  assert.match(get('[data-rows]').innerHTML, /data-note-save/);
  const file = {name:'report.xlsx',size:1024};
  get('[data-file]').listeners.get('change')({target:{files:[file]}});
  assert.equal(get('[data-import-button]').disabled, true);
  assert.equal(moduleApi.test.state().selectedFile, file);
  const sameUserPoll = moduleApi.refresh({id:5,role:'admin'});resolve(pending.shift(), sample('FPT'));await sameUserPoll;
  assert.equal(moduleApi.test.state().selectedFile, file, 'Polling must retain selected files before preview/import');
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

  assert.equal(moduleApi.test.date('2026-10-02'), '02/10/2026');
  assert.equal(moduleApi.test.date(null), '—');
  const rows = Array.from({length:130}, (_,i) => ({ticker:`FPT${i}`,trade_date:'2026-10-02'}));
  assert.equal(moduleApi.test.filteredRows(rows, {ticker:'FPT',from:'2026-10-01',to:'2026-10-03'}).length, 130);
  assert.equal(moduleApi.test.filteredRows(rows, {ticker:'FPT',from:'2026-10-03',to:''}).length, 0);
  assert.match(moduleApi.test.table([{label:'<img>'}],[], '<script>', 'Caption'), /&lt;img&gt;|&lt;script&gt;/);
  assert.doesNotMatch(moduleApi.test.table([{label:'<img>'}],[], '<script>', 'Caption'), /<img>|<script>/);
  console.log('Trade reconciliation UI: async isolation, permissions, file preview/replacement and filters passed.');
})().catch(error => {console.error(error);process.exitCode = 1;});
