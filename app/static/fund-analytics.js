/* Reconciled NAV analytics; portfolio scope is deliberately independent of signal filters. */
(() => {
  const performancePanel = document.querySelector('#fundPerformancePanel');
  const riskPanel = document.querySelector('#marketRiskPanel');
  const adminPanel = document.querySelector('#fundAdminPanel');
  let generation = 0, activeUser = null, adminLoaded = false;
  let renderedData = new WeakMap();
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const num = (v, digits=2) => v == null || !Number.isFinite(Number(v)) ? '—' : Number(v).toLocaleString('vi-VN', {maximumFractionDigits:digits});
  const pct = v => v == null ? '—' : `${num(v)}%`;
  const money = v => v == null ? '—' : `${num(v,0)} ₫`;
  const kpis = items => `<div class="fundKpis">${items.map(([label,value]) => `<article><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`).join('')}</div>`;
  const table = (headers, rows) => `<div class="tableWrap"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}" class="fundEmpty">Chưa đủ dữ liệu</td></tr>`}</tbody></table></div>`;
  async function request(url, options={}) {
    const response = await fetch(url, options);
    const body = await response.json();
    if (!response.ok) {
      const detail = Array.isArray(body.detail) ? body.detail.map(e=>`${e.loc.join('.')}: ${e.msg}`).join('; ') : body.detail;
      throw new Error(detail || `HTTP ${response.status}`);
    }
    return body;
  }
  const save = (url, data, method='POST') => request(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  function chart(curve) {
    if (curve.length < 2) return '<p class="fundEmpty">Cần ít nhất hai ngày NAV để vẽ diễn biến.</p>';
    const all = curve.flatMap(p=>[p.index,p.benchmark_index]).filter(v=>v!=null);
    const min=Math.min(...all), max=Math.max(...all), span=max-min || 1;
    const points = key => curve.map((p,i)=>p[key]==null ? null : `${50+i*830/(curve.length-1)},${210-(p[key]-min)*175/span}`).filter(Boolean).join(' ');
    return `<svg viewBox="0 0 950 255" role="img" aria-label="NAV TWR và benchmark, cùng mốc 100"><title>NAV TWR và benchmark theo ngày ghi nhận</title>
      ${[0,1,2,3].map(i=>`<line x1="50" y1="${35+i*175/3}" x2="880" y2="${35+i*175/3}" stroke="var(--line)"/><text x="885" y="${40+i*175/3}" fill="var(--muted)" font-size="12">${num(max-i*span/3)}</text>`).join('')}
      <polyline points="${points('index')}" fill="none" stroke="var(--accent)" stroke-width="3"/>
      <polyline points="${points('benchmark_index')}" fill="none" stroke="var(--buy)" stroke-width="2" stroke-dasharray="6 4"/>
      <text x="50" y="244" fill="var(--muted)" font-size="12">${esc(curve[0].date)}</text><text x="880" y="244" text-anchor="end" fill="var(--muted)" font-size="12">${esc(curve.at(-1).date)}</text></svg>`;
  }
  function renderPerformance(data) {
    if(data.status==='empty') { performancePanel.innerHTML='<h2>Hiệu suất NAV</h2><p class="fundEmpty">Chưa có NAV cuối ngày. Quản trị viên có thể nhập NAV và giá trị danh mục trong tab Quản trị.</p>'; return; }
    const m=data.metrics;
    performancePanel.innerHTML=`<p class="eyebrow">Toàn danh mục • ${esc(data.start_date)} → ${esc(data.as_of)}</p><h2>Hiệu suất NAV</h2>
      ${kpis([['NAV cuối ngày',money(m.nav)],['TWR từ đầu kỳ',pct(m.twr_pct)],['XIRR năm hóa',pct(m.xirr_pct)],['CAGR ≥ 1 năm',pct(m.cagr_pct)],['Drawdown hiện tại',pct(m.current_drawdown_pct)],['Drawdown lớn nhất',pct(m.max_drawdown_pct)],['Chưa phục hồi đỉnh',`${m.underwater_days} ngày`],['Drawdown dài nhất',`${m.longest_drawdown_days} ngày`],['Sharpe năm hóa',num(m.sharpe)],['Sortino năm hóa',num(m.sortino)],['Biến động năm hóa',pct(m.volatility_pct)],['Lãi/lỗ ròng kỳ này',money(m.net_pnl_vnd)]])}
      <p><span class="fundChartNav">━━ NAV TWR</span> &nbsp; <span class="fundChartBenchmark">┄┄ ${esc(data.benchmark_name)}</span> · Cùng mốc 100; khoảng cách ngang theo quan sát.</p>${chart(data.curve)}
      ${kpis([['Benchmark cùng kỳ',pct(m.benchmark_return_pct)],['Vượt benchmark',m.active_return_pp==null?'—':`${num(m.active_return_pp)} điểm %`],['Số ngày ghi nhận',String(m.observations)]])}
      <p>${esc(data.methodology)}</p><p>Benchmark có chữ “price” chưa bao gồm tái đầu tư cổ tức. XIRR hiển thị “—” nếu dòng tiền không xác định được nghiệm duy nhất.</p>
      ${data.warnings.map(w=>`<p class="fundNotice">${esc(w)}</p>`).join('')}
      <div class="fundGrid"><div><h3>Lợi nhuận tháng (kể cả kỳ chưa trọn)</h3>${table(['Tháng','TWR'],(data.periods.monthly||[]).map(p=>[p.period,pct(p.return_pct)]))}</div><div><h3>Lợi nhuận năm (kể cả kỳ chưa trọn)</h3>${table(['Năm','TWR'],(data.periods.yearly||[]).map(p=>[p.period,pct(p.return_pct)]))}</div></div>
      <details><summary>Lợi nhuận theo từng ngày ghi nhận</summary>${table(['Ngày','NAV','Lợi nhuận từ mốc trước','Drawdown'],data.curve.map(p=>[p.date,money(p.nav),pct(p.return_pct),pct(p.drawdown_pct)]))}</details>
      <h3>Đóng góp lãi/lỗ theo số liệu kế toán</h3><p>Nhập P/L từng ngày cho cả mã đã bán hết. Chênh lệch chưa phân bổ: ${money(data.unattributed_pnl_vnd)}.</p>
      <div class="fundGrid">${[['ticker','Theo mã'],['sector','Theo ngành'],['sleeve','Theo RF/EMA']].map(([key,title])=>`<div><h3>${title}</h3>${table(['Nhóm','Lãi/lỗ VND'],(data.attribution[key]||[]).map(p=>[p.name,money(p.pnl_vnd)]))}</div>`).join('')}</div>`;
  }
  function renderRisk(data) {
    if(data.status==='empty') {riskPanel.innerHTML=`<h2>Rủi ro theo giá thị trường</h2><p class="fundEmpty">Cần NAV và danh mục cuối ngày đã đối chiếu. Phần dưới vẫn là theo dõi tín hiệu.</p><p class="fundNotice">Chặn phân bổ mới: ${data.policy.pause_new_allocations?'đang bật — lệnh mua mới sẽ được ghi log và không duyệt vì thiếu NAV':'đang tắt'}.</p>`;return;}
    riskPanel.innerHTML=`<p class="eyebrow">Toàn danh mục • giá trị cuối ngày ${esc(data.as_of)}</p><h2>Rủi ro theo giá thị trường</h2>
      <p class="fundNotice ${data.pause_recommended?'':'fundOk'}">${data.pause_recommended?'Cần rà soát trước khi tăng phân bổ.':'Chưa chạm ngưỡng tạm dừng theo NAV.'} Chặn phân bổ mới: ${data.policy.pause_new_allocations?'đang bật':'đang tắt'}.</p>
      ${kpis([['NAV',money(data.nav)],['Exposure thị trường',pct(data.exposure_pct)],['Tiền mặt / NAV',pct(data.cash_pct)],['Tập trung 5 mã lớn nhất',pct(data.top5_weight_pct)],['Drawdown hiện tại',pct(data.current_drawdown_pct)],['Tuổi dữ liệu NAV',`${data.age_days} ngày`]])}
      ${data.alerts.map(a=>`<p class="fundNotice">${esc(a)}</p>`).join('')}
      <details open><summary>Tỷ trọng thực tế, mục tiêu và ngân sách rủi ro</summary>${table(['Mã','Nhóm','Giá trị VND','Hiện tại','Mục tiêu','Lệch điểm %','Rủi ro đến stop / NAV','Ngân sách / NAV'],data.positions.map(p=>[p.ticker,p.sleeve,money(p.market_value),pct(p.weight_pct),pct(p.target_weight_pct),num(p.deviation_pp),pct(p.stop_risk_pct),pct(p.risk_budget_pct)]))}</details>
      <div class="fundGrid">${[['ticker','Theo mã'],['sector','Theo ngành'],['sleeve','Theo RF/EMA']].map(([key,title])=>`<div><h3>${title}</h3>${table(['Nhóm','Hiện tại','Mục tiêu','Lệch điểm %','Trần','Vượt điểm %'],data.breakdown[key].map(r=>[r.name,pct(r.weight_pct),pct(r.target_weight_pct),num(r.deviation_pp),pct(r.cap_pct),num(r.excess_pp)]))}</div>`).join('')}</div>
      <h3>Kịch bản tổn thất giả định</h3>${table(['Kịch bản','Cú sốc','Tác động NAV','Lãi/lỗ VND','NAV sau sốc'],data.scenarios.map(s=>[s.name,pct(s.shock_pct),pct(s.nav_impact_pct),money(s.pnl_vnd),money(s.stressed_nav)]))}
      <details><summary>Tương quan các mã và RF/EMA</summary>${table(['Cặp','Quan sát chung','Tương quan'],data.correlations.map(c=>[c.pair,c.observations,num(c.correlation,3)]))}</details><p>${esc(data.methodology)}</p>`;
  }
  const input = (name,label,type='number',value='0',extra='') => `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${type==='number'?'step="any"':''} ${extra}></label>`;
  const holdingFields=['ticker','sector','sleeve','quantity','price','target_weight_pct','stop_price','risk_budget_pct','daily_pnl','total_return_pct'];
  function addHolding(h={}) {
    const row=document.createElement('tr');
    row.innerHTML=holdingFields.map(key=>`<td>${key==='sleeve'?`<select name="sleeve" aria-label="Nhóm chiến lược">${['RF','EMA','OTHER'].map(s=>`<option ${h.sleeve===s?'selected':''}>${s}</option>`).join('')}</select>`:`<input aria-label="${esc(key)}" name="${key}" value="${esc(h[key]??'')}" type="${['ticker','sector'].includes(key)?'text':'number'}" ${['ticker','sector','quantity','price'].includes(key)?'required':''} step="any">`}</td>`).join('')+'<td><button type="button" class="smallButton" data-remove>Xóa dòng</button></td>';
    row.querySelector('[data-remove]').addEventListener('click',()=>row.remove());
    adminPanel.querySelector('#fundHoldings').append(row);
  }
  function renderAdmin() {
    const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});
    adminPanel.innerHTML=`<h2>NAV cuối ngày & chính sách rủi ro</h2>
      <p class="fundEditorNote">Nhập NAV từ báo cáo tài khoản đã đối chiếu. Tất cả giá và số tiền dùng <strong>VND</strong> (ví dụ giá MBB là 25000). NAV = số lượng × giá + tiền mặt + phải thu − phải trả. NAV phải bao gồm phí, thuế và quyền lợi cổ tức đã ghi nhận. Dòng tiền ngoài danh mục: nạp dương, rút âm, giả định cuối ngày.</p>
      <form id="fundNavForm"><div class="fundForm">${input('trade_date','Ngày NAV','date',today,'required')}${input('nav','NAV sau dòng tiền (VND)','number','','min="1" required')}${input('cash','Tiền mặt (VND)','number','0','min="0" required')}${input('receivables','Khoản phải thu (VND)')}${input('liabilities','Khoản phải trả (VND)')}${input('external_flow','Nạp/rút ngoài danh mục (VND)')}${input('benchmark_name','Tên benchmark','text','VNINDEX (price)','required')}${input('benchmark_value','Mức benchmark','number','','min="0.000001"')}${input('note','Nguồn số liệu / ghi chú','text','')}</div>
      <h3>Danh mục theo giá thị trường</h3><p>Tỷ trọng mục tiêu và ngân sách rủi ro dùng đơn vị %. P/L và tổng lợi nhuận ngày là tùy chọn: để trống khi chưa có số liệu. Giá stop chỉ dùng để ước tính rủi ro. Mã đã bán hết có thể nhập số lượng 0 để ghi P/L ngày.</p>
      <div class="tableWrap"><table><thead><tr>${['Mã','Ngành','RF/EMA','Số lượng','Giá VND','Mục tiêu %','Stop VND','Ngân sách %','P/L ngày VND','Tổng LN ngày %',''].map(t=>`<th>${t}</th>`).join('')}</tr></thead><tbody id="fundHoldings"></tbody></table></div>
      <div class="fundActions"><button type="button" id="fundAddHolding" class="smallButton">Thêm mã</button><label><input type="checkbox" name="replace_existing"> Thay thế NAV cùng ngày (lưu lịch sử)</label><button type="submit">Lưu NAV</button><button type="button" id="fundLoadLatest" class="smallButton">Nạp ngày mới nhất vào biểu mẫu</button></div></form>
      <details><summary>Nhập/xuất nhiều ngày</summary><p>Tải mẫu JSON, điền NAV từng ngày rồi chọn tệp để nhập. Nhập hàng loạt không ghi đè ngày đã có. Chỉnh sửa ngày đã có bằng biểu mẫu phía trên.</p><div class="fundActions"><button type="button" id="fundTemplate" class="smallButton">Tải mẫu</button><button type="button" id="fundExport" class="smallButton">Xuất dữ liệu NAV</button><label>Nhập tệp JSON <input id="fundImport" type="file" accept=".json,application/json"></label></div></details>
      <h3>Chính sách cảnh báo</h3><p>Trần mã/ngành/RF/EMA lấy từ snapshot portfolio gate. Chặn phân bổ mới khi NAV thiếu/cũ, exposure vượt trần hoặc drawdown chạm ngưỡng dừng; lệnh thoát vẫn được xử lý. Các ngưỡng dưới đây là giá trị khởi tạo có thể chỉnh.</p>
      <form id="fundPolicyForm"><div class="fundForm">${input('annual_risk_free_pct','Lãi suất phi rủi ro %/năm','number','0','min="0" max="100" required')}${input('warning_drawdown_pct','Cảnh báo drawdown %','number','10','min="0.01" max="100" required')}${input('pause_drawdown_pct','Dừng phân bổ tại drawdown %','number','15','min="0.01" max="100" required')}${input('max_nav_age_days','Tuổi NAV tối đa (ngày lịch)','number','4','min="1" max="30" required')}${input('market_shock_pct','Cú sốc toàn thị trường %','number','-10','min="-100" max="0" required')}${input('sector_shock_pct','Cú sốc ngành lớn nhất %','number','-20','min="-100" max="0" required')}</div><div class="fundActions"><label><input type="checkbox" name="pause_new_allocations"> Bật chặn phân bổ mới theo NAV</label><button type="submit">Lưu chính sách</button></div></form>
      <p id="fundAdminStatus" role="status" aria-live="polite"></p>`;
    adminPanel.querySelector('#fundAddHolding').addEventListener('click',()=>addHolding());
    adminPanel.querySelector('#fundNavForm').addEventListener('submit',async event=>{
      event.preventDefault(); const f=event.target;
      const s={};
      for(const key of ['trade_date','benchmark_name','note']) s[key]=f.elements[key].value;
      for(const key of ['nav','cash','receivables','liabilities','external_flow']) s[key]=Number(f.elements[key].value);
      s.benchmark_value=f.elements.benchmark_value.value===''?null:Number(f.elements.benchmark_value.value);
      s.holdings=[...f.querySelectorAll('#fundHoldings tr')].map(row=>Object.fromEntries(holdingFields.map(key=>{const v=row.querySelector(`[name="${key}"]`).value;return [key,['ticker','sector','sleeve'].includes(key)?v:v===''?null:Number(v)];})));
      await action(()=>save('/api/admin/nav-snapshots',{snapshots:[s],replace_existing:f.elements.replace_existing.checked}), 'Đã lưu NAV.');
    });
    adminPanel.querySelector('#fundPolicyForm').addEventListener('submit',async e=>{
      e.preventDefault();const data=Object.fromEntries([...new FormData(e.target)].map(([k,v])=>[k,Number(v)]));
      data.pause_new_allocations=e.target.elements.pause_new_allocations.checked;
      await action(()=>save('/api/admin/fund-risk-policy',data,'PATCH'),'Đã lưu chính sách.');
    });
    adminPanel.querySelector('#fundLoadLatest').addEventListener('click',()=>action(async()=>{
      const {snapshots}=await request('/api/admin/nav-snapshots');const s=snapshots.at(-1);
      if(!s)throw new Error('Chưa có NAV để nạp.');
      const f=adminPanel.querySelector('#fundNavForm');
      for(const [key,v] of Object.entries(s)) if(key!=='holdings' && f.elements[key]) f.elements[key].value=v??'';
      adminPanel.querySelector('#fundHoldings').replaceChildren();s.holdings.forEach(addHolding);
    },'Đã nạp ngày mới nhất. Kiểm tra ngày và số liệu trước khi lưu.'));
    adminPanel.querySelector('#fundImport').addEventListener('change',async e=>{
      const file=e.target.files[0]; if(!file)return;
      await action(async()=>{if(file.size>5_000_000)throw new Error('Tệp tối đa 5 MB.');const data=JSON.parse(await file.text());return save('/api/admin/nav-snapshots',{snapshots:Array.isArray(data)?data:data.snapshots,replace_existing:false});},'Đã nhập NAV.');e.target.value='';
    });
    adminPanel.querySelector('#fundExport').addEventListener('click',()=>action(async()=>{const data=await request('/api/admin/nav-snapshots');download('nav-snapshots.json',{snapshots:data.snapshots});},'Đã xuất NAV.'));
    adminPanel.querySelector('#fundTemplate').addEventListener('click',()=>download('nav-template.json',{snapshots:[{trade_date:today,nav:100000000,cash:95000000,external_flow:0,benchmark_name:'VNINDEX (price)',benchmark_value:null,holdings:[{ticker:'MBB',sector:'banking',sleeve:'RF',quantity:200,price:25000,target_weight_pct:5,stop_price:23000,risk_budget_pct:1,daily_pnl:null,total_return_pct:null}],note:'Mẫu minh họa — thay bằng số liệu tài khoản'}]}));
  }
  function download(name,data) {const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function action(fn,message) {
    const status=adminPanel.querySelector('#fundAdminStatus');status.classList.remove('fundError');status.textContent='Đang xử lý…';
    try {await fn();status.textContent=message;await refresh(activeUser);}catch(e){status.classList.add('fundError');status.textContent=e.message;}
  }
  function clear() {window.TradeLedger?.clear();generation++;activeUser=null;adminLoaded=false;renderedData=new WeakMap();for(const panel of [performancePanel,riskPanel,adminPanel]){panel.replaceChildren();panel.hidden=true;}}
  async function refresh(user) {
    if(!user){clear();return;}
    const identity=`${user.id}:${user.role}:${JSON.stringify(user.features)}:${JSON.stringify(user.strategies)}`;
    if(activeUser?._identity!==identity){clear();activeUser={...user,_identity:identity};}
    const current=++generation;
    const admin=user.role==='admin', restricted=!admin && user.strategies?.length;
    const can=f=>admin || user.features?.includes(f);
    const jobs=[];
    jobs.push(window.TradeLedger?.refresh(user));
    for(const [panel,allowed,url,render] of [[performancePanel,can('performance'),'/api/fund-performance',renderPerformance],[riskPanel,can('overview'),'/api/market-risk',renderRisk]]) {
      panel.hidden=!allowed;
      if(!allowed)continue;
      if(restricted){panel.innerHTML='<p>NAV và rủi ro toàn danh mục cần tài khoản được xem toàn bộ chiến lược.</p>';continue;}
      jobs.push(request(url).then(data=>{
        if(current!==generation)return;
        const serialized=JSON.stringify(data);
        if(renderedData.get(panel)!==serialized){render(data);renderedData.set(panel,serialized);}
      }).catch(e=>{if(current===generation){renderedData.delete(panel);panel.innerHTML=`<p class="fundError">Không tải được dữ liệu: ${esc(e.message)}</p>`;}}));
    }
    adminPanel.hidden=!admin;
    if(admin && !adminLoaded){renderAdmin();adminLoaded=true;jobs.push(request('/api/admin/nav-snapshots').then(data=>{if(activeUser?._identity!==identity)return;const form=adminPanel.querySelector('#fundPolicyForm');for(const [key,value] of Object.entries(data.policy)){if(typeof value==='boolean')form.elements[key].checked=value;else form.elements[key].value=value;}}).catch(e=>{if(activeUser?._identity===identity){adminLoaded=false;adminPanel.querySelector('#fundAdminStatus').textContent=e.message;}}));}
    await Promise.all(jobs);
  }
  window.FundAnalytics={refresh,clear};
})();
