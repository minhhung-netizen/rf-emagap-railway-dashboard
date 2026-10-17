const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Exercise the real refresh() scheduler with a controllable loadDashboard().
const source = fs.readFileSync(path.join(__dirname, "../app/static/app.js"), "utf8").replace(/\r\n/g, "\n");
const start = source.indexOf("let refreshRun = null;");
const end = source.indexOf("\nasync function loadDashboard()", start);
assert(start >= 0 && end > start, "refresh scheduler not found");

const loads = [];
const context = vm.createContext({
  loadDashboard() {
    let finish;
    let fail;
    const promise = new Promise((resolve, reject) => { finish = resolve; fail = reject; });
    loads.push({ finish, fail });
    return promise;
  },
});
vm.runInContext(source.slice(start, end), context);
const tick = () => new Promise(setImmediate);

(async () => {
  const settled = [];
  const first = context.refresh().then(() => settled.push("first"));
  const second = context.refresh().then(() => settled.push("second"));
  const third = context.refresh().then(() => settled.push("third"));
  await tick();
  assert.equal(loads.length, 1, "only one load runs at a time");

  loads[0].finish();
  await tick();
  assert.deepEqual(settled, ["first"]);
  assert.equal(loads.length, 2, "calls made during a load share one follow-up load");

  loads[1].finish();
  await Promise.all([first, second, third]);
  assert.deepEqual(settled.sort(), ["first", "second", "third"]);
  assert.equal(loads.length, 2);

  // A failed load still lets the queued follow-up run, and the scheduler resets afterwards.
  const failed = context.refresh().catch(() => "failed");
  const queued = context.refresh();
  await tick();
  loads[2].fail(new Error("network"));
  assert.equal(await failed, "failed");
  await tick();
  assert.equal(loads.length, 4);
  loads[3].finish();
  await queued;

  const later = context.refresh();
  await tick();
  assert.equal(loads.length, 5, "a new load starts once the previous one has settled");
  loads[4].finish();
  await later;

  console.log("dashboard refresh scheduler tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
