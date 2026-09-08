/* Confirmed fills and reviewed VND marks, not TradingView model positions. */
(() => {
  const panel = document.querySelector('#tradeLedgerPanel');
  let identity = null, version = 0, latest = null;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => v == null ? '—' : Number(v).toLocaleString('vi-VN',{maximumFractionDigits:2});
  const labels = {deposit:'Nạp tiền',withdraw:'Rút tiền',buy:'Mua khớp',sell:'Bán khớp',dividend:'Cổ tức tiền ròng',expense:'Chi phí khác'};
  const input = (name,label,type='text',value='',extra='') => `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${type==='number'?'step="any" min="0"':''} ${extra}></label>`;
  const table = (headers,rows) => `<div class="tableWrap"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}">Chưa có dữ liệu</td></tr>`}</tbody></table></div>`;
  async function api(path='',data) {
    const r = await fetch('/api/admin/ledger'+path,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const body = await r.json();
    if(!r.ok) throw new Error(Array.isArray(body.detail)?body.detail.map(e=>`${e.loc.join('.')}: ${e.msg}`).join('; '):body.detail || `HTTP ${r.status}`);
    return body;
  }
  function download(name,data) {
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function action(fn,success) {
    const status=panel.querySelector('[data-status]');
    const currentIdentity=identity;
    status.textContent='Đang xử lý…';
    try {await fn(); if(identity!==currentIdentity)return; status.textContent=success;await load();}
    catch(e){if(identity===currentIdentity)status.textContent=e.message;}
  }
  function mount() {
    const day=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});
    panel.innerHTML=`<p class="eyebrow">Sổ thực tế • VND • quản trị viên</p><h2>Sổ giao dịch + NAV + đối soát dữ liệu</h2>
      <p>Webhook không tự sinh giao dịch khớp. Nhập theo sao kê: nạp/rút tiền, mua/bán thực khớp, phí và thuế. Không hỗ trợ tiền mặt âm, bán khống hoặc margin. Thứ tự cùng ngày là thứ tự nhập.</p>
      <div class="fundActions">${input('valuation_date','Ngày định giá','date',day,'required')}<button type="button" data-reload>Xem / đối soát</button></div>
      <div data-summary></div>
      <details><summary>Ghi giao dịch / dòng tiền</summary><form data-entry><div class="fundForm">
        ${input('reference','Mã đối chiếu duy nhất (sao kê)','text','','required maxlength="100"')}${input('trade_date','Ngày giao dịch','date',day,'required')}
        <label>Loại<select name="kind">${Object.entries(labels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
        ${input('ticker','Mã cổ phiếu')}
        <label>Nhóm<select name="sleeve"><option>OTHER</option><option>RF</option><option>EMA</option></select></label>
        ${input('sector','Ngành','text','unknown')}${input('quantity','Số lượng khớp','number','0')}${input('price','Giá khớp VND','number','0')}${input('fees','Tổng phí + thuế VND','number','0')}${input('amount','Số tiền nạp/rút/cổ tức/chi phí VND','number','0')}${input('signal_id','ID webhook liên kết (tùy chọn)','number')}${input('note','Ghi chú')}
      </div><p>Mua/bán: amount = 0. Dòng tiền: quantity, price, fees = 0. Cổ tức là số tiền sau thuế. Nhiều lần khớp có thể cùng ID webhook, nhưng mỗi lần phải có mã đối chiếu riêng.</p><button>Lưu vào sổ</button></form></details>
      <details><summary>Kiểm chứng giá cuối ngày</summary><form data-price><div class="fundForm">
        ${input('trade_date','Ngày giá','date',day,'required')}${input('ticker','Mã','text','','required')}${input('price','Giá đóng cửa VND (ví dụ 25000)','number','','required min="0.000001"')}${input('source','Nguồn giá (sao kê/nhà cung cấp)','text','','required minlength="3"')}${input('evidence','Tham chiếu kiểm chứng / ghi chú','text','','required minlength="3"')}
      </div><label><input name="confirmed" type="checkbox" required> Đã đối chiếu đúng mã, ngày, đơn vị VND và giá đóng cửa chưa điều chỉnh</label><p>Giá nhà cung cấp/webhook chưa được tự động chứng nhận. Ghi giá mới cùng mã/ngày sẽ thay bản đang dùng nhưng giữ mọi phiên bản trong lịch sử.</p><button>Lưu giá đã kiểm chứng</button></form></details>
      <details><summary>Chốt NAV từ sổ giao dịch</summary><form data-close><div class="fundForm">${input('trade_date','Ngày chốt NAV','date',day,'required')}${input('benchmark_name','Benchmark','text','VNINDEX (price)','required')}${input('benchmark_value','Mức benchmark đã đối chiếu','number')}</div>
      <p>NAV = tiền mặt kế toán + số lượng × giá cùng ngày đã kiểm chứng. Sổ ghi nhận tiền theo ngày giao dịch, không phải tiền có thể rút theo T+2. Chốt sẽ khóa toàn bộ giao dịch/giá đến ngày này và cập nhật Hiệu suất NAV + Rủi ro. Không ghi đè NAV có sẵn. Dòng tiền giữa hai mốc NAV quy ước cuối kỳ.</p>
      <label><input type="checkbox" required> Đã đối chiếu sổ, số dư, phí/thuế và giá với sao kê; đồng ý khóa kỳ</label><button>Chốt NAV & khóa kỳ</button></form></details>
      <details><summary>Nhập/xuất và sửa sai trước khi chốt</summary><div class="fundActions"><button type="button" data-template>Tải mẫu JSON</button><button type="button" data-export>Xuất sổ + đối soát</button><label>Nhập giao dịch JSON<input data-import type="file" accept=".json,application/json"></label></div>
      <p>Nhập nguyên lô hoặc không nhập nếu có lỗi. Cùng mã đối chiếu và cùng nội dung không tạo bản trùng. Hủy chỉ áp dụng kỳ chưa khóa, không xóa lịch sử; sau đó nhập lại với mã đối chiếu mới.</p>
      <form data-void><div class="fundForm">${input('entry_id','ID giao dịch cần hủy','number','','required min="1"')}${input('reason','Lý do hủy','text','','required minlength="5"')}</div><button>Hủy có lưu vết</button></form></details>
      <p data-status role="status" aria-live="polite"></p>
      <details open><summary>Sổ giao dịch — toàn lịch sử</summary><div data-entries></div></details>
      <details><summary>Lịch sử giá đã kiểm chứng — toàn lịch sử</summary><div data-prices></div></details>
      <details open><summary>Chất lượng giá từ bộ nhớ nhà cung cấp — hiện tại</summary><p>Kiểm tra bản lưu trên tín hiệu mới nhất mỗi mã, không gọi nhà cung cấp trực tiếp. Tuổi giá tính theo ngày lịch; trên 4 ngày hoặc có nến lỗi cần rà soát. Giá này không tự đi vào NAV. Mã chỉ có trong sổ, chưa có webhook, sẽ không có dòng bộ nhớ giá.</p><div data-health></div></details>
      <details open><summary>Đối soát webhook — 500 tín hiệu gần nhất</summary><p>Liên kết không chứng minh khớp đủ: webhook không có khối lượng thực khớp. Chênh lệch giá so với đóng cửa cùng ngày nhận chỉ là dấu hiệu rà soát, không khẳng định giá webhook sai. |Lệch| ≥ 5% được đánh dấu. Giá webhook cổ phiếu từ nghìn VND được đổi sang VND.</p><div data-audit></div></details>
      <details><summary>Webhook bị phân lỗi — 100 bản ghi gần nhất</summary><div data-invalid></div></details>`;
    panel.querySelector('[data-reload]').onclick=()=>action(async()=>{},'Đã tải dữ liệu.');
    panel.querySelector('[data-entry]').onsubmit=e=>{
      e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
      for(const k of ['quantity','price','fees','amount'])d[k]=Number(d[k]);d.signal_id=d.signal_id?Number(d.signal_id):null;
      action(()=>api('/entries',{entries:[d]}),'Đã ghi nhận (mã trùng giống nội dung sẽ được bỏ qua).');
    };
    panel.querySelector('[data-price]').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.price=Number(d.price);d.confirmed=true;action(()=>api('/prices',d),'Đã lưu giá đã kiểm chứng.');};
    panel.querySelector('[data-close]').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.benchmark_value=d.benchmark_value?Number(d.benchmark_value):null;action(()=>api('/close',d),'Đã chốt NAV và khóa kỳ. Các bảng hiệu suất/rủi ro cập nhật ở lần làm mới kế tiếp.');};
    panel.querySelector('[data-void]').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));action(()=>api(`/entries/${Number(d.entry_id)}/void`,{reason:d.reason}),'Đã hủy có lưu lịch sử.');};
    panel.querySelector('[data-template]').onclick=()=>download('ledger-template.json',{entries:[{reference:'EXAMPLE-deposit-001',trade_date:day,kind:'deposit',amount:100000000},{reference:'EXAMPLE-buy-001',trade_date:day,kind:'buy',ticker:'MBB',sleeve:'RF',sector:'banking',quantity:200,price:25000,fees:7500,note:'Ví dụ: thay toàn bộ bằng số liệu sao kê'}]});
    panel.querySelector('[data-export]').onclick=()=>{if(latest)download('ledger-audit.json',latest);};
    panel.querySelector('[data-import]').onchange=e=>{const f=e.target.files[0];if(!f)return;action(async()=>{if(f.size>5000000)throw new Error('Tệp tối đa 5 MB');const d=JSON.parse(await f.text());return api('/entries',{entries:Array.isArray(d)?d:d.entries});},'Đã nhập giao dịch.');e.target.value='';};
  }
  function render(d) {
    latest=d;
    const cards=[['NAV dự thảo VND',d.nav],['Tiền mặt kế toán VND',d.cash],['Lãi/lỗ đã chốt VND',d.realized_pnl],['Lãi/lỗ chưa chốt VND',d.unrealized_pnl],['Cổ tức ròng VND',d.dividend_income],['Chi phí khác VND',d.expenses],['Tổng lãi/lỗ VND',d.total_pnl]];
    panel.querySelector('[data-summary]').innerHTML=`<p>Định giá ${esc(d.trade_date)} • Đã khóa đến: ${esc(d.locked_through||'chưa khóa')} • ${d.signal_count} tín hiệu lưu, ${d.invalid_count} bản ghi phân lỗi • ${d.unlinked_trades} giao dịch không gắn webhook.</p><div class="fundKpis">${cards.map(([k,v])=>`<article><span>${esc(k)}</span><strong>${num(v)}</strong></article>`).join('')}</div>${d.missing_prices.length?`<p class="fundNotice">Chưa thể tính/chốt NAV. Thiếu giá đã kiểm chứng cùng ngày: ${esc(d.missing_prices.join(', '))}</p>`:''}${table(['Mã','Nhóm','Số lượng','Giá vốn BQ gồm phí','Giá VND','Giá trị VND','P/L chưa chốt'],d.holdings.map(h=>[h.ticker,h.sleeve,num(h.quantity),num(h.cost/h.quantity),num(h.price),num(h.market_value),num(h.unrealized_pnl)]))}`;
    panel.querySelector('[data-entries]').innerHTML=table(['ID','Ngày','Mã đối chiếu','Loại','Mã','Nhóm','SL','Giá VND','Phí/thuế','Dòng tiền','Webhook','Người nhập','Trạng thái'],[...d.entries].reverse().map(e=>[e.id,e.trade_date,e.reference,labels[e.kind],e.ticker,e.sleeve,num(e.quantity),num(e.price),num(e.fees),num(e.amount),e.signal_id,e.created_by,e.void_reason?`Hủy: ${e.void_reason}`:'Có hiệu lực']));
    panel.querySelector('[data-prices]').innerHTML=table(['ID','Ngày','Mã','Giá VND','Nguồn','Tham chiếu','Người duyệt','Lúc lưu'],[...d.prices].reverse().map(p=>[p.id,p.trade_date,p.ticker,num(p.price),p.source,p.evidence,p.created_by,p.created_at]));
    panel.querySelector('[data-health]').innerHTML=table(['Mã','Trạng thái nguồn','Ngày giá mới nhất','Tuổi (ngày)','Giá lưu VND','Nến lỗi','Lệch giá kiểm chứng %','Đánh giá'],d.price_health.map(p=>[p.ticker,p.status,p.latest_date,p.age_days,num(p.cached_price_vnd),p.invalid_bars,num(p.deviation_pct),!p.latest_date?'Thiếu giá':p.age_days>4||p.invalid_bars||p.status!=='ok'||Math.abs(p.deviation_pct)>=5?'Cần rà soát':'Chưa thấy bất thường cấu trúc']));
    panel.querySelector('[data-audit]').innerHTML=table(['ID','Nhận lúc','Mã','Chiến lược','Tín hiệu','Trạng thái','Lần khớp','SL khớp','Giá webhook VND','Giá kiểm chứng VND','Lệch %'],d.webhooks.map(w=>[w.id,w.received_at,w.ticker,w.strategy,w.action,w.status,w.fill_count,num(w.filled_quantity),num(w.signal_price_vnd),num(w.reference_price),`${num(w.deviation_pct)}${Math.abs(w.deviation_pct)>=5?' ⚠':''}`]));
    panel.querySelector('[data-invalid]').innerHTML=table(['ID','Lúc nhận','Mã','Tín hiệu','Phân lỗi'],d.invalid.map(w=>[w.id,w.received_at,w.ticker,w.action,w.reason]));
  }
  async function load() {
    const current=++version;
    const day=panel.querySelector('[name="valuation_date"]').value;
    const d=await api(`?trade_date=${encodeURIComponent(day)}`);
    if(current===version)render(d);
  }
  function clear(){version++;identity=null;latest=null;panel.replaceChildren();panel.hidden=true;}
  async function refresh(user){
    if(user?.role!=='admin'){clear();return;}
    if(identity!==user.id){clear();identity=user.id;panel.hidden=false;mount();}
    const currentIdentity=identity;
    try{await load();}catch(e){if(identity===currentIdentity)panel.querySelector('[data-status]').textContent=e.message;}
  }
  window.TradeLedger={clear,refresh};
})();
