const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Exercise the actual table helpers without bootstrapping the unrelated dashboard modules.
const source = fs.readFileSync(path.join(__dirname, "../app/static/app.js"), "utf8");
const start = source.indexOf("function activeLeadingSignals()");
const end = source.indexOf("function renderSignals()", start);
assert(start >= 0 && end > start);
const state = {
  leadingSignals: [],
  leadingSignalSort: { key: "detected_at", direction: "desc" },
  user: { role: "admin" },
};
const select = {
  value: "",
  options: [],
  replaceChildren(...options) { this.options = options; },
  append(option) { this.options.push(option); },
};
const eventSelect = {
  value: "",
  options: [],
  replaceChildren(...options) { this.options = options; },
  append(option) { this.options.push(option); },
};
const els = {
  leadingSignalSectorFilter: select,
  leadingSignalEventFilter: eventSelect,
  leadingSignalSortButtons: [],
  leadingSignalStatus: { textContent: "" },
  leadingSignalsTable: { innerHTML: "", querySelectorAll: () => [] },
};
const context = vm.createContext({
  state, els,
  NUMBER_FORMAT_LOCALE: "en-US",
  Option: function(text, value) { this.text = text; this.value = value; },
  escapeHtml: (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;"),
  formatDateOnly: (value) => value || "-",
  formatPrice: (value) => value,
});
vm.runInContext(source.slice(start, end), context);
const event = (id, data = {}) => ({
  id, ticker: `T${id}`, sector: "Banking", action: "setup_bull", event: "bull_divergence",
  is_active: true, status: "active", valid_for_days: 30,
  detected_at: `2026-10-0${id}T09:00:00+07:00`, ...data,
});
const ids = (rows) => Array.from(rows, (row) => row.id);

const prices = [event(1, { price: 9 }), event(2, { price: 100 }), event(3, { price: 26.4 })];
state.leadingSignalSort = { key: "price", direction: "asc" };
assert.deepEqual(ids(context.sortLeadingSignals(prices)), [1, 3, 2]);
state.leadingSignalSort.direction = "desc";
assert.deepEqual(ids(context.sortLeadingSignals(prices)), [2, 3, 1]);
assert.deepEqual(ids(prices), [1, 2, 3]);

const leads = [event(1, { lead_days: null }), event(2, { lead_days: 0 }), event(3, { lead_days: 7 })];
state.leadingSignalSort = { key: "lead_days", direction: "asc" };
assert.deepEqual(ids(context.sortLeadingSignals(leads)), [2, 3, 1]);
state.leadingSignalSort.direction = "desc";
assert.deepEqual(ids(context.sortLeadingSignals(leads)), [3, 2, 1]);

const pivots = [
  event(1, { pivot_time: "2026-10-01T09:00:00+07:00" }),
  event(2, { pivot_time: "2026-10-01T03:00:00Z" }),
  event(3, { pivot_time: "invalid" }),
  event(4, { pivot_time: null }),
];
state.leadingSignalSort = { key: "pivot_time", direction: "asc" };
assert.deepEqual(ids(context.sortLeadingSignals(pivots)), [1, 2, 4, 3]);
state.leadingSignalSort.direction = "desc";
assert.deepEqual(ids(context.sortLeadingSignals(pivots)), [2, 1, 4, 3]);

state.leadingSignals = [
  event(1, { ticker: "SSI", event: " BULL_DIVERGENCE ", lead_days: 0, status: "matched_rf", matched_signal_id: 10 }),
  event(2, { ticker: "FPT", sector: "Technology", event: "bear_divergence", action: "setup_bear" }),
  event(3, { ticker: "UNKNOWN", sector: "", event: null, action: "momentum_bull" }),
  event(4, { ticker: "EXPIRED", event: "rsi_cross_oversold", is_active: false, status: "expired" }),
  event(5, { ticker: "REVERSED", event: "rsi_cross_overbought", is_active: false, status: "matched_rf" }),
];
assert.deepEqual(ids(context.activeLeadingSignals()), [1, 2, 3]);
context.toggleLeadingSignalSort("ticker");
assert.equal(state.leadingSignalSort.direction, "asc");
context.toggleLeadingSignalSort("ticker");
assert.equal(state.leadingSignalSort.direction, "desc");
context.toggleLeadingSignalSort("price");
assert.equal(state.leadingSignalSort.direction, "desc");

select.value = "Banking";
context.renderLeadingSignals();
assert.equal(els.leadingSignalStatus.textContent, "1/3 còn hiệu lực · 1 đã khớp RF/EMA");
assert.match(els.leadingSignalsTable.innerHTML, /SSI/);
assert.match(els.leadingSignalsTable.innerHTML, /data-leading-delete-id="1"/);
assert.match(els.leadingSignalsTable.innerHTML, /0 ngày/);
assert.doesNotMatch(els.leadingSignalsTable.innerHTML, /FPT|EXPIRED|REVERSED/);
assert(select.options.some((option) => option.value === "Technology"));
assert.deepEqual(eventSelect.options.map((option) => [option.value, option.text]), [
  ["", "Tất cả tín hiệu"],
  ["momentum_bull", "Động lượng tăng"],
  ["bear_divergence", "Phân kỳ giảm"],
  ["bull_divergence", "Phân kỳ tăng"],
]);
context.updateLeadingSignalEventFilter([...context.activeLeadingSignals(), state.leadingSignals[0]]);
assert.equal(eventSelect.options.filter((option) => option.value === "bull_divergence").length, 1);

select.value = "__unmapped__";
context.renderLeadingSignals();
assert.match(els.leadingSignalsTable.innerHTML, /UNKNOWN/);
assert.doesNotMatch(els.leadingSignalsTable.innerHTML, /SSI|FPT/);

select.value = "Empty industry";
context.renderLeadingSignals();
assert.equal(select.value, "Empty industry");
assert(select.options.some((option) => option.value === "Empty industry"));
assert.match(els.leadingSignalsTable.innerHTML, /Không có tín hiệu sớm phù hợp bộ lọc đã chọn/);

select.value = "";
eventSelect.value = "bull_divergence";
context.renderLeadingSignals();
assert.equal(els.leadingSignalStatus.textContent, "1/3 còn hiệu lực · 1 đã khớp RF/EMA");
assert.match(els.leadingSignalsTable.innerHTML, /SSI/);
assert.doesNotMatch(els.leadingSignalsTable.innerHTML, /FPT|UNKNOWN|EXPIRED|REVERSED/);
context.toggleLeadingSignalSort("ticker");
assert.equal(eventSelect.value, "bull_divergence");
assert.match(els.leadingSignalsTable.innerHTML, /SSI/);

select.value = "Technology";
context.renderLeadingSignals();
assert.equal(els.leadingSignalStatus.textContent, "0/3 còn hiệu lực · 0 đã khớp RF/EMA");
assert.match(els.leadingSignalsTable.innerHTML, /Không có tín hiệu sớm phù hợp bộ lọc đã chọn/);
eventSelect.value = "bear_divergence";
context.renderLeadingSignals();
assert.equal(els.leadingSignalStatus.textContent, "1/3 còn hiệu lực · 0 đã khớp RF/EMA");
assert.match(els.leadingSignalsTable.innerHTML, /FPT/);
assert.doesNotMatch(els.leadingSignalsTable.innerHTML, /SSI|UNKNOWN/);

state.leadingSignals[1].is_active = false;
context.renderLeadingSignals();
assert.equal(eventSelect.value, "bear_divergence");
assert(eventSelect.options.some((option) => option.value === "bear_divergence"));
assert.equal(els.leadingSignalStatus.textContent, "0/2 còn hiệu lực · 0 đã khớp RF/EMA");
assert.match(els.leadingSignalsTable.innerHTML, /Không có tín hiệu sớm phù hợp bộ lọc đã chọn/);
state.leadingSignals[1].is_active = true;

select.value = "__unmapped__";
eventSelect.value = "momentum_bull";
context.renderLeadingSignals();
assert.match(els.leadingSignalsTable.innerHTML, /UNKNOWN/);
assert.match(els.leadingSignalsTable.innerHTML, /Động lượng tăng/);
assert.doesNotMatch(els.leadingSignalsTable.innerHTML, /SSI|FPT/);

state.user.role = "user";
select.value = "";
eventSelect.value = "";
context.renderLeadingSignals();
assert.equal(els.leadingSignalStatus.textContent, "3 còn hiệu lực · 1 đã khớp RF/EMA");
assert.doesNotMatch(els.leadingSignalsTable.innerHTML, /data-leading-delete-id/);
state.leadingSignals = [];
context.renderLeadingSignals();
assert.match(els.leadingSignalsTable.innerHTML, /colspan="10"/);
assert.match(els.leadingSignalsTable.innerHTML, /Không có tín hiệu sớm còn hiệu lực/);

console.log("Leading signal table checks passed: sorting, combined sector/event filters, refresh, expiry, empty states, and admin-only deletion.");
