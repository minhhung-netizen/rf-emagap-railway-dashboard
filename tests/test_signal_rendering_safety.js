const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Load the real rendering helpers from app.js without bootstrapping the dashboard.
const source = fs.readFileSync(path.join(__dirname, "../app/static/app.js"), "utf8").replace(/\r\n/g, "\n");
function extract(name) {
  const start = source.indexOf(`\nfunction ${name}(`);
  assert(start >= 0, `missing function ${name}`);
  const end = source.indexOf("\n}\n", start);
  assert(end > start, `unterminated function ${name}`);
  return source.slice(start, end + 3);
}

function fakeContainer() {
  return {
    innerHTML: "",
    queries: [],
    matches: {},
    querySelectorAll(selector) {
      this.queries.push(selector);
      return this.matches[selector] || [];
    },
  };
}
function fakeElement(dataset) {
  return {
    dataset,
    listeners: [],
    addEventListener(type, handler) { this.listeners.push({ type, handler }); },
  };
}

const charted = [];
const els = {
  table: fakeContainer(),
  signalCards: fakeContainer(),
  riskAlertList: fakeContainer(),
};
const state = { language: "en", signals: [], dividendAlerts: [], invalidSignals: [], closedTrades: [] };
const context = vm.createContext({
  state,
  els,
  STRATEGY_DISPLAY_ALIASES: {},
  NUMBER_FORMAT_LOCALE: "en-US",
  t: (key) => key,
  renderChart: (ticker) => charted.push(ticker),
  setActiveTab: () => {},
  deleteSignal: async () => {},
  formatPrice: (value) => String(value),
  document: {
    querySelectorAll(selector) {
      throw new Error(`renderSignals must not query the whole document (${selector})`);
    },
  },
  openTradeRiskRows: () => [],
  aggregateRisk: () => [],
  averageLossSignals: () => [],
  averageGainSignals: () => [],
  recentTrades: () => [],
});
[
  "escapeHtml", "parseDateValue", "formatDate", "signalTimeValue", "formatSignalTime",
  "formatDateOnly", "formatPercent", "formatSignedPercent", "displayStrategyName",
  "averageLossSignalDetail", "averageGainSignalDetail", "formatSignalGate",
  "renderSignals", "renderRiskAlerts",
].forEach((name) => vm.runInContext(extract(name), context));

// Unparseable webhook times are shown as text without markup characters.
assert.equal(context.formatDate("<img src=x onerror=alert(1)>"), "img src=x onerror=alert(1)");
assert.equal(context.formatDate(""), "-");
assert.notEqual(context.formatDate("2026-10-01T09:00:00+07:00"), "2026-10-01T09:00:00+07:00");
assert.equal(context.formatDateOnly("2026-10-01<b>"), "01/10/2026");
assert.equal(context.formatDateOnly("bad\"date'<x>"), "baddatex");

// Signal rows: escaped output, listeners bound only inside the signal table.
state.signals = [{
  id: 7, ticker: "FPT", action: "buy", price: 100, timeframe: "60",
  strategy: "<b>RF</b>", source_time: "<img src=x onerror=alert(1)>", payload: {},
}];
const row = fakeElement({ ticker: "FPT" });
const deleteButton = fakeElement({ deleteId: "7" });
els.table.matches = { "[data-ticker]": [row], "[data-delete-id]": [deleteButton] };
context.renderSignals();
assert(!els.table.innerHTML.includes("<img"), els.table.innerHTML);
assert(!els.table.innerHTML.includes("<b>RF"), els.table.innerHTML);
assert(els.table.innerHTML.includes("&lt;b&gt;RF&lt;/b&gt;"));
assert(!els.signalCards.innerHTML.includes("<img"), els.signalCards.innerHTML);
assert.deepEqual(els.table.queries, ["[data-ticker]", "[data-delete-id]"]);
assert.deepEqual(els.signalCards.queries, ["[data-signal-card-ticker]"]);
assert.equal(row.listeners.length, 1);
row.listeners[0].handler();
assert.deepEqual(charted, ["FPT"]);

// Risk alerts: tickers/strategies escaped, coloured percentages kept as HTML.
context.openTradeRiskRows = () => [{ trade: { ticker: "<img src=x onerror=1>", strategy: "<script>x</script>", return_pct: -6 }, weightPct: 30 }];
context.aggregateRisk = (rows, keyOf) => rows.map((item) => ({ key: keyOf(item.trade), value: 60 }));
context.averageLossSignals = () => [{
  trade: { ticker: "<i>LOSS</i>", strategy: "<u>EMA</u>" },
  signal: { returnPct: -3, threshold: -2, maxLoss: null },
}];
context.recentTrades = () => [{ ticker: "<svg onload=1>", strategy: "RF", exit_time: "2026-10-01" }];
state.dividendAlerts = [{ alert_status: "ex_date_today", ticker: "<a href=x>", ex_date: "2026-10-02" }];
context.renderRiskAlerts();
const alertsHtml = els.riskAlertList.innerHTML;
["<img", "<script", "<i>", "<u>", "<svg", "<a href"].forEach((markup) => {
  assert(!alertsHtml.includes(markup), `${markup} leaked into risk alerts: ${alertsHtml}`);
});
assert(alertsHtml.includes("&lt;img src=x onerror=1&gt;"));
assert(alertsHtml.includes('<span class="negative">-6.00%</span>'));

console.log("signal rendering safety tests passed");
