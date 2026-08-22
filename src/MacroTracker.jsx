import { useState, useMemo, useEffect } from "react";

const STORAGE_KEY = "macroTracker";

// Format a Date object → "YYYY-MM-DD" (used as localStorage key)
const formatDateKey = (date) => date.toLocaleDateString("en-CA");
// Format a Date object → "Mon 9 Jun" style (used in header)
const formatDateDisplay = (date) => date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
// Advance any Date by exactly one calendar day (handles month/year rollover via JS Date)
function advanceDay(date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next;
}

function loadStorage(dateKey) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.date !== dateKey) return null; // stale
    return data;
  } catch {
    return null;
  }
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

const MACRO_CORRECTIONS = {
  "Chicken breast — skinless":    { cal: 120, p: 23, c: 0, f: 2 },
  "Chicken thigh — skinless":     { cal: 145, p: 19, c: 0, f: 7 },
  "Chicken thigh — skin-on":      { cal: 190, p: 18, c: 0, f: 14 },
  "Chicken drumstick — skinless": { cal: 130, p: 21, c: 0, f: 4 },
  "Chicken drumstick — skin-on":  { cal: 175, p: 19, c: 0, f: 11 },
  "Chicken leg — skinless":       { cal: 158, p: 20, c: 0, f: 6 },
  "Chicken leg — skin-on":        { cal: 215, p: 18, c: 0, f: 14 },
  "Salmon":                       { cal: 175, p: 20, c: 0, f: 11 },
  "Prawns":                       { cal: 71,  p: 14, c: 0, f: 1 },
  "Tuna — canned":                { cal: 116, p: 25, c: 0, f: 0.8 },
  "Mackerel":                     { cal: 205, p: 19, c: 0, f: 14 },
};

function runMacroMigrationV1() {
  if (localStorage.getItem("macro_migration_v1") === "done") return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) keys.push(k);
  }
  for (const key of keys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;
      for (const entry of day.entries) {
        const corrected = MACRO_CORRECTIONS[entry.food?.name];
        if (!corrected) continue;
        entry.food.cal = corrected.cal;
        entry.food.p   = corrected.p;
        entry.food.c   = corrected.c;
        entry.food.f   = corrected.f;
        const mult = entry.food.unit === "serving" ? entry.qty : entry.qty / 100;
        entry.macros = {
          cal: Math.round(corrected.cal * mult * 10) / 10,
          p:   Math.round(corrected.p   * mult * 10) / 10,
          c:   Math.round(corrected.c   * mult * 10) / 10,
          f:   Math.round(corrected.f   * mult * 10) / 10,
        };
        changed = true;
      }
      if (!changed) continue;
      day.totals = {
        cal: day.entries.reduce((a, e) => a + e.macros.cal, 0),
        p:   day.entries.reduce((a, e) => a + e.macros.p,   0),
        c:   day.entries.reduce((a, e) => a + e.macros.c,   0),
        f:   day.entries.reduce((a, e) => a + e.macros.f,   0),
      };
      const t = day.targets;
      day.score = [
        [day.totals.cal, t.cal], [day.totals.p, t.p],
        [day.totals.c,   t.c],   [day.totals.f, t.f],
      ].filter(([v, tgt]) => Math.abs(v / tgt - 1) <= 0.05).length;
      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }
  localStorage.setItem("macro_migration_v1", "done");
}

runMacroMigrationV1();

function runMacroMigrationV2() {
  if (localStorage.getItem("macro_migration_v2") === "done") return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) keys.push(k);
  }
  for (const key of keys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;
      for (const entry of day.entries) {
        const n = entry.food?.name ?? "";
        if (!n.includes("Pizza Union") && !n.includes("Pizza — gourmet") && !n.includes("Pizza —")) continue;
        entry.food.name = "Pizza (whole 12\")";
        entry.food.cal  = 1500;
        entry.food.p    = 65;
        entry.food.c    = 155;
        entry.food.f    = 60;
        const mult = entry.food.unit === "serving" ? entry.qty : entry.qty / 100;
        entry.macros = {
          cal: Math.round(1500 * mult * 10) / 10,
          p:   Math.round(65   * mult * 10) / 10,
          c:   Math.round(155  * mult * 10) / 10,
          f:   Math.round(60   * mult * 10) / 10,
        };
        changed = true;
      }
      if (!changed) continue;
      day.totals = {
        cal: day.entries.reduce((a, e) => a + e.macros.cal, 0),
        p:   day.entries.reduce((a, e) => a + e.macros.p,   0),
        c:   day.entries.reduce((a, e) => a + e.macros.c,   0),
        f:   day.entries.reduce((a, e) => a + e.macros.f,   0),
      };
      const t = day.targets;
      day.score = [
        [day.totals.cal, t.cal], [day.totals.p, t.p],
        [day.totals.c,   t.c],   [day.totals.f, t.f],
      ].filter(([v, tgt]) => Math.abs(v / tgt - 1) <= 0.05).length;
      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }
  localStorage.setItem("macro_migration_v2", "done");
}

runMacroMigrationV2();

function runMacroMigrationV3() {
  if (localStorage.getItem("macro_migration_v3") === "done") return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) keys.push(k);
  }
  for (const key of keys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;
      for (const entry of day.entries) {
        if (entry.food?.name !== "Fried chicken — per piece (~150g)") continue;
        entry.food.name = "Fried chicken — per piece (KFC avg)";
        entry.food.cal  = 320;
        entry.food.p    = 28;
        entry.food.c    = 8;
        entry.food.f    = 19;
        const mult = entry.food.unit === "serving" ? entry.qty : entry.qty / 100;
        entry.macros = {
          cal: Math.round(320 * mult * 10) / 10,
          p:   Math.round(28  * mult * 10) / 10,
          c:   Math.round(8   * mult * 10) / 10,
          f:   Math.round(19  * mult * 10) / 10,
        };
        changed = true;
      }
      if (!changed) continue;
      day.totals = {
        cal: day.entries.reduce((a, e) => a + e.macros.cal, 0),
        p:   day.entries.reduce((a, e) => a + e.macros.p,   0),
        c:   day.entries.reduce((a, e) => a + e.macros.c,   0),
        f:   day.entries.reduce((a, e) => a + e.macros.f,   0),
      };
      const t = day.targets;
      day.score = [
        [day.totals.cal, t.cal], [day.totals.p, t.p],
        [day.totals.c,   t.c],   [day.totals.f, t.f],
      ].filter(([v, tgt]) => Math.abs(v / tgt - 1) <= 0.05).length;
      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }
  localStorage.setItem("macro_migration_v3", "done");
}

runMacroMigrationV3();

function runMacroMigrationV4() {
  if (localStorage.getItem("macro_migration_v4") === "done") return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) keys.push(k);
  }
  for (const key of keys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day) continue;
      day.targets = day.isGym
        ? { cal: 2500, p: 180, c: 270, f: 83 }
        : { cal: 2200, p: 180, c: 210, f: 73 };
      const t = day.targets;
      day.score = ["cal", "p", "c", "f"].filter(
        m => Math.abs(day.totals[m] / t[m] - 1) <= 0.10
      ).length;
      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }
  localStorage.setItem("macro_migration_v4", "done");
}

runMacroMigrationV4();

function runMacroMigrationV5() {
  if (localStorage.getItem("macro_migration_v5") === "done") return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) keys.push(k);
  }
  for (const key of keys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day) continue;
      day.targets = day.isGym
        ? { cal: 2500, p: 180, c: 270, f: 83 }
        : { cal: 2200, p: 180, c: 210, f: 73 };
      const t = day.targets;
      day.score = ["cal", "p", "c", "f"].filter(
        m => Math.abs(day.totals[m] / t[m] - 1) <= 0.10
      ).length;
      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }
  localStorage.setItem("macro_migration_v5", "done");
}

runMacroMigrationV5();

function runMacroMigrationV6() {
  if (localStorage.getItem("macro_migration_v6") === "done") return;

  function getStatus(val, target) {
    return Math.abs(val / target - 1) <= 0.10 ? "hit" : "over";
  }

  // month_ keys
  const monthKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("month_")) monthKeys.push(k);
  }
  for (const key of monthKeys) {
    try {
      const entry = JSON.parse(localStorage.getItem(key));
      if (!entry) continue;
      if (entry.targets && (entry.targets.cal === 2850 || entry.targets.cal === 2550)) {
        entry.targets = { cal: 2500, p: 180, c: 270, f: 83 };
      }
      const tCal = entry.targets?.cal ?? 2500;
      const hits = [
        getStatus(entry.avgCal, tCal),
        getStatus(entry.avgP, 180),
        getStatus(entry.avgCal, tCal),
        (entry.avgF >= 40 && entry.avgF <= 83) ? "hit" : "over",
      ];
      entry.score = hits.filter(s => s === "hit").length;
      localStorage.setItem(key, JSON.stringify(entry));
    } catch { /* skip malformed entries */ }
  }

  // day_ keys
  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) dayKeys.push(k);
  }
  for (const key of dayKeys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !day.totals || !day.targets) continue;
      const fatMax = day.isGym ? 83 : 73;
      const hits = [
        getStatus(day.totals.cal, day.targets.cal),
        getStatus(day.totals.p, 180),
        getStatus(day.totals.cal, day.targets.cal),
        (day.totals.f >= 40 && day.totals.f <= fatMax) ? "hit" : "over",
      ];
      day.score = hits.filter(s => s === "hit").length;
      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }

  localStorage.setItem("macro_migration_v6", "done");
}

runMacroMigrationV6();

function runMacroMigrationV7() {
  if (localStorage.getItem("macro_migration_v7") === "done") return;

  function getStatus(val, target) {
    return Math.abs(val / target - 1) <= 0.10 ? "hit" : "over";
  }

  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) dayKeys.push(k);
  }

  for (const key of dayKeys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;

      for (const entry of day.entries) {
        if (entry.food?.name === "Chicken Thigh — Skinless") {
          const mult = entry.qty / 100;
          entry.food.cal = 119; entry.food.p = 16; entry.food.c = 0; entry.food.f = 5.7;
          entry.macros = {
            cal: Math.round(119 * mult * 10) / 10,
            p:   Math.round(16  * mult * 10) / 10,
            c:   0,
            f:   Math.round(5.7 * mult * 10) / 10,
          };
          changed = true;
        } else if (entry.food?.name === "Chicken Thigh — Skin-On") {
          const mult = entry.qty / 100;
          entry.food.cal = 156; entry.food.p = 15; entry.food.c = 0; entry.food.f = 11.5;
          entry.macros = {
            cal: Math.round(156  * mult * 10) / 10,
            p:   Math.round(15   * mult * 10) / 10,
            c:   0,
            f:   Math.round(11.5 * mult * 10) / 10,
          };
          changed = true;
        }
      }

      if (!changed) continue;

      day.totals = {
        cal: day.entries.reduce((a, e) => a + e.macros.cal, 0),
        p:   day.entries.reduce((a, e) => a + e.macros.p,   0),
        c:   day.entries.reduce((a, e) => a + e.macros.c,   0),
        f:   day.entries.reduce((a, e) => a + e.macros.f,   0),
      };

      const fatMax = day.isGym ? 83 : 73;
      day.score = [
        getStatus(day.totals.cal, day.targets.cal),
        getStatus(day.totals.p,   180),
        getStatus(day.totals.cal, day.targets.cal),
        (day.totals.f >= 40 && day.totals.f <= fatMax) ? "hit" : "over",
      ].filter(s => s === "hit").length;

      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }

  localStorage.setItem("macro_migration_v7", "done");
}

runMacroMigrationV7();

function runMacroMigrationV8() {
  if (localStorage.getItem("macro_migration_v8") === "done") return;

  function getStatus(val, target) {
    return Math.abs(val / target - 1) <= 0.10 ? "hit" : "over";
  }

  const NEW_MACROS = {
    "Chicken Drumstick — Skinless": { cal: 91,  p: 18, c: 0, f: 2.8  },
    "Chicken Drumstick — Skin-On":  { cal: 123, p: 13, c: 0, f: 7.7  },
    "Chicken Leg — Skinless":       { cal: 115, p: 15, c: 0, f: 4.4  },
    "Chicken Leg — Skin-On":        { cal: 157, p: 13, c: 0, f: 10.2 },
  };

  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) dayKeys.push(k);
  }

  for (const key of dayKeys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;

      for (const entry of day.entries) {
        const nm = NEW_MACROS[entry.food?.name];
        if (!nm) continue;
        const mult = entry.food.unit === "serving" ? entry.qty : entry.qty / 100;
        entry.food.cal = nm.cal; entry.food.p = nm.p; entry.food.c = nm.c; entry.food.f = nm.f;
        entry.macros = {
          cal: Math.round(nm.cal * mult * 10) / 10,
          p:   Math.round(nm.p   * mult * 10) / 10,
          c:   0,
          f:   Math.round(nm.f   * mult * 10) / 10,
        };
        changed = true;
      }

      if (!changed) continue;

      day.totals = {
        cal: day.entries.reduce((a, e) => a + e.macros.cal, 0),
        p:   day.entries.reduce((a, e) => a + e.macros.p,   0),
        c:   day.entries.reduce((a, e) => a + e.macros.c,   0),
        f:   day.entries.reduce((a, e) => a + e.macros.f,   0),
      };

      const fatMax = day.isGym ? 83 : 73;
      day.score = [
        getStatus(day.totals.cal, day.targets.cal),
        getStatus(day.totals.p,   180),
        getStatus(day.totals.cal, day.targets.cal),
        (day.totals.f >= 40 && day.totals.f <= fatMax) ? "hit" : "over",
      ].filter(s => s === "hit").length;

      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }

  localStorage.setItem("macro_migration_v8", "done");
}

runMacroMigrationV8();

function runMacroMigrationV9() {
  if (localStorage.getItem("macro_migration_v9") === "done") return;

  function getStatus(val, target) {
    return Math.abs(val / target - 1) <= 0.10 ? "hit" : "over";
  }

  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) dayKeys.push(k);
  }

  for (const key of dayKeys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;

      for (const entry of day.entries) {
        if (entry.food?.name !== "Whey Protein") continue;
        const mult = entry.qty;
        entry.food.cal = 104; entry.food.p = 22; entry.food.c = 2; entry.food.f = 1.5;
        entry.macros = {
          cal: Math.round(104 * mult * 10) / 10,
          p:   Math.round(22  * mult * 10) / 10,
          c:   Math.round(2   * mult * 10) / 10,
          f:   Math.round(1.5 * mult * 10) / 10,
        };
        changed = true;
      }

      if (!changed) continue;

      day.totals = {
        cal: day.entries.reduce((a, e) => a + e.macros.cal, 0),
        p:   day.entries.reduce((a, e) => a + e.macros.p,   0),
        c:   day.entries.reduce((a, e) => a + e.macros.c,   0),
        f:   day.entries.reduce((a, e) => a + e.macros.f,   0),
      };

      const fatMax = day.isGym ? 83 : 73;
      day.score = [
        getStatus(day.totals.cal, day.targets.cal),
        getStatus(day.totals.p,   180),
        getStatus(day.totals.cal, day.targets.cal),
        (day.totals.f >= 40 && day.totals.f <= fatMax) ? "hit" : "over",
      ].filter(s => s === "hit").length;

      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }

  localStorage.setItem("macro_migration_v9", "done");
}

runMacroMigrationV9();

function runMacroMigrationV10() {
  if (localStorage.getItem("macro_migration_v10") === "done") return;

  function getStatus(val, target) {
    return Math.abs(val / target - 1) <= 0.10 ? "hit" : "over";
  }

  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) dayKeys.push(k);
  }

  const affectedMonths = new Set();

  for (const key of dayKeys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;

      for (const entry of day.entries) {
        if (entry.food?.name !== "Tortilla Chips — M&S Lightly Salted") continue;
        const mult = entry.qty / 100;
        entry.food.cal = 481; entry.food.p = 5.5; entry.food.c = 62.7; entry.food.f = 21.9;
        entry.macros = {
          cal: Math.round(481  * mult * 10) / 10,
          p:   Math.round(5.5  * mult * 10) / 10,
          c:   Math.round(62.7 * mult * 10) / 10,
          f:   Math.round(21.9 * mult * 10) / 10,
        };
        changed = true;
      }

      if (!changed) continue;

      day.totals = {
        cal: day.entries.reduce((a, e) => a + e.macros.cal, 0),
        p:   day.entries.reduce((a, e) => a + e.macros.p,   0),
        c:   day.entries.reduce((a, e) => a + e.macros.c,   0),
        f:   day.entries.reduce((a, e) => a + e.macros.f,   0),
      };

      const fatMax = day.isGym ? 83 : 73;
      day.score = [
        getStatus(day.totals.cal, day.targets.cal),
        getStatus(day.totals.p,   180),
        getStatus(day.totals.cal, day.targets.cal),
        (day.totals.f >= 40 && day.totals.f <= fatMax) ? "hit" : "over",
      ].filter(s => s === "hit").length;

      localStorage.setItem(key, JSON.stringify(day));
      // key is "day_YYYY-MM-DD" → month is "YYYY-MM"
      affectedMonths.add(key.slice(4, 11));
    } catch { /* skip malformed entries */ }
  }

  // Force month summaries to regenerate from corrected day totals
  for (const ym of affectedMonths) {
    localStorage.removeItem(`month_${ym}`);
  }

  localStorage.setItem("macro_migration_v10", "done");
}

runMacroMigrationV10();

function runMacroMigrationV11() {
  if (localStorage.getItem("macro_migration_v11") === "done") return;

  function getStatus(val, target) {
    return Math.abs(val / target - 1) <= 0.10 ? "hit" : "over";
  }

  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) dayKeys.push(k);
  }

  const affectedMonths = new Set();

  for (const key of dayKeys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;

      for (const entry of day.entries) {
        if (entry.food?.name !== "Chicken Drumstick — Skin-On") continue;
        const mult = entry.qty / 100;
        entry.food.cal = 175; entry.food.p = 19.8; entry.food.c = 0; entry.food.f = 10.5;
        entry.macros = {
          cal: Math.round(175  * mult * 10) / 10,
          p:   Math.round(19.8 * mult * 10) / 10,
          c:   0,
          f:   Math.round(10.5 * mult * 10) / 10,
        };
        changed = true;
      }

      if (!changed) continue;

      day.totals = {
        cal: day.entries.reduce((a, e) => a + e.macros.cal, 0),
        p:   day.entries.reduce((a, e) => a + e.macros.p,   0),
        c:   day.entries.reduce((a, e) => a + e.macros.c,   0),
        f:   day.entries.reduce((a, e) => a + e.macros.f,   0),
      };

      const fatMax = day.isGym ? 83 : 73;
      day.score = [
        getStatus(day.totals.cal, day.targets.cal),
        getStatus(day.totals.p,   180),
        getStatus(day.totals.cal, day.targets.cal),
        (day.totals.f >= 40 && day.totals.f <= fatMax) ? "hit" : "over",
      ].filter(s => s === "hit").length;

      localStorage.setItem(key, JSON.stringify(day));
      // key is "day_YYYY-MM-DD" → month is "YYYY-MM"
      affectedMonths.add(key.slice(4, 11));
    } catch { /* skip malformed entries */ }
  }

  // Force month summaries to regenerate from corrected day totals
  for (const ym of affectedMonths) {
    localStorage.removeItem(`month_${ym}`);
  }

  localStorage.setItem("macro_migration_v11", "done");
}

runMacroMigrationV11();

function runMacroMigrationV12() {
  if (localStorage.getItem("macro_migration_v12") === "done") return;

  const RENAMES = {
    "Egg — cooked (1 egg)":           "Egg",
    "Dark chocolate — 85%":           "Dark Chocolate",
    "Guinness Zero (440ml)":          "Guinness Zero (Can)",
    "Pizza — per slice (~120g)":      "Pizza — Slice",
    "Tortilla Chips — M&S Lightly Salted": "M&S Tortilla Chips",
    "Egg Fried Rice — Microwave":     "Rice",
    "Egg noodles":                    "Noodles",
    "Rice cake (per cake)":           "Nordic Rice Cake",
    "Rye bread — wholegrain (per slice)": "M&S Rye Bread",
    "Tortilla wrap — medium":         "Tortilla Wrap",
    "Assenhaims — chicken meal large":"Assenheims",
    "Nando's Meal":                   "Nando's",
    "Pork loin — lean":               "Pork Loin",
    "Edamame — shelled":              "Edamame",
    "Mayo — Reduced Fat (per squeeze)":"Mayo (Reduced Fat)",
  };

  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) dayKeys.push(k);
  }

  for (const key of dayKeys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;

      for (const entry of day.entries) {
        const newName = RENAMES[entry.food?.name];
        if (!newName) continue;
        entry.food.name = newName;
        changed = true;
      }

      if (!changed) continue;
      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }

  localStorage.setItem("macro_migration_v12", "done");
}

runMacroMigrationV12();

function runMacroMigrationV13() {
  if (localStorage.getItem("macro_migration_v13") === "done") return;

  function getStatus(val, target) {
    return Math.abs(val / target - 1) <= 0.10 ? "hit" : "over";
  }

  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) dayKeys.push(k);
  }

  const affectedMonths = new Set();

  for (const key of dayKeys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;

      for (const entry of day.entries) {
        if (entry.food?.name !== "Whisky (25ml)") continue;
        const mult = entry.qty; // unit: "serving"
        entry.food.name = "Whisky (44ml)";
        entry.food.cal = 97;
        entry.macros = {
          cal: Math.round(97 * mult * 10) / 10,
          p:   0,
          c:   0,
          f:   0,
        };
        changed = true;
      }

      if (!changed) continue;

      day.totals = {
        cal: day.entries.reduce((a, e) => a + e.macros.cal, 0),
        p:   day.entries.reduce((a, e) => a + e.macros.p,   0),
        c:   day.entries.reduce((a, e) => a + e.macros.c,   0),
        f:   day.entries.reduce((a, e) => a + e.macros.f,   0),
      };

      const fatMax = day.isGym ? 83 : 73;
      day.score = [
        getStatus(day.totals.cal, day.targets.cal),
        getStatus(day.totals.p,   180),
        getStatus(day.totals.cal, day.targets.cal),
        (day.totals.f >= 40 && day.totals.f <= fatMax) ? "hit" : "over",
      ].filter(s => s === "hit").length;

      localStorage.setItem(key, JSON.stringify(day));
      affectedMonths.add(key.slice(4, 11));
    } catch { /* skip malformed entries */ }
  }

  for (const ym of affectedMonths) {
    localStorage.removeItem(`month_${ym}`);
  }

  localStorage.setItem("macro_migration_v13", "done");
}

runMacroMigrationV13();

function runMacroMigrationV14() {
  if (localStorage.getItem("macro_migration_v14") === "done") return;

  function getStatus(val, target) {
    return Math.abs(val / target - 1) <= 0.10 ? "hit" : "over";
  }

  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) dayKeys.push(k);
  }

  const affectedMonths = new Set();

  for (const key of dayKeys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;

      for (const entry of day.entries) {
        if (entry.food?.name !== "Mediterranean chicken rice box" &&
            entry.food?.name !== "Mediterranean Chicken Rice Box") continue;
        const mult = entry.qty; // unit: "serving"
        entry.food.name = "Mediterranean Chicken Rice Box";
        entry.food.cal = 700; entry.food.p = 45; entry.food.c = 70; entry.food.f = 25;
        entry.macros = {
          cal: Math.round(700 * mult * 10) / 10,
          p:   Math.round(45  * mult * 10) / 10,
          c:   Math.round(70  * mult * 10) / 10,
          f:   Math.round(25  * mult * 10) / 10,
        };
        changed = true;
      }

      if (!changed) continue;

      day.totals = {
        cal: day.entries.reduce((a, e) => a + e.macros.cal, 0),
        p:   day.entries.reduce((a, e) => a + e.macros.p,   0),
        c:   day.entries.reduce((a, e) => a + e.macros.c,   0),
        f:   day.entries.reduce((a, e) => a + e.macros.f,   0),
      };

      const fatMax = day.isGym ? 83 : 73;
      day.score = [
        getStatus(day.totals.cal, day.targets.cal),
        getStatus(day.totals.p,   180),
        getStatus(day.totals.cal, day.targets.cal),
        (day.totals.f >= 40 && day.totals.f <= fatMax) ? "hit" : "over",
      ].filter(s => s === "hit").length;

      localStorage.setItem(key, JSON.stringify(day));
      affectedMonths.add(key.slice(4, 11));
    } catch { /* skip malformed entries */ }
  }

  for (const ym of affectedMonths) {
    localStorage.removeItem(`month_${ym}`);
  }

  localStorage.setItem("macro_migration_v14", "done");
}

runMacroMigrationV14();

function runMacroMigrationV15() {
  if (localStorage.getItem("macro_migration_v15") === "done") return;

  const RENAMES = {
    "Assenheims":                        "Assenheim's",
    "Beef mince — 20% fat":              "Beef Mince — 20%",
    "Beef mince — 5% fat":              "Beef Mince — 5%",
    "Black beans — canned":             "Black Beans",
    "Chicken breast — skinless":        "Chicken Breast — Skinless",
    "Chickpeas — canned":               "Chickpeas",
    "Cottage cheese — low fat":         "Cottage Cheese",
    "Guinness Zero (Can)":              "Guinness 0.0",
    "Ice cream — per scoop (~100g)":    "Ice Cream",
    "Lamb chops":                        "Lamb Chops",
    "Lamb mince — 20% fat":             "Lamb Mince — 20%",
    "Mediterranean chicken wrap":       "Mediterranean Chicken Wrap",
    "Milk — skimmed":                   "Milk — Skimmed",
    "Peanut butter — natural":          "Peanut Butter - Natural",
    "Pork mince — 5% fat":              "Pork Mince — 5%",
    "Pork sausages":                    "Pork Sausages",
    "Roast & Greens — chicken box large": "Roast & Greens",
    "Sandwich Sandwich — chicken":      "Sandwich Sandwich",
    "Sardines — canned":                "Sardines",
    "Soy sauce — light (per tbsp)":     "Soy Sauce —Light",
    "Spinach — raw":                    "Spinach",
    "Tomatoes — whole":                 "Tomatoes",
    "Tuna — canned":                    "Tuna",
    "Turkey mince — 5% fat":            "Turkey Mince — 5%",
    "White fish fillet":                "White Fish",
    "Fries — medium serving":           "Fries",
    "Rye cracker (per cracker)":        "Rye Cracker",
    "Avocado (1 whole)":                "Avocado",
    "Courgette (1 whole)":              "Courgette",
    "Onion (1 medium)":                 "Onion",
    "Beer — ale (pint)":                "Beer — Ale",
    "Beer — stout (pint)":              "Beer — Stout",
    "Gin (44ml shot)":                  "Gin",
    "Whisky (44ml)":                    "Whisky",
    "Wine — red (175ml glass)":         "Wine — Red",
    "Honey (per tbsp)":                 "Honey",
    "Bread — sourdough (per slice)":    "Bread — Sourdough",
    "Bread — wholemeal (per slice)":    "Bread — Wholemeal",
    "Butter (per 10g)":                 "Butter - Unsalted",
    "Potato chips — standard bag (35g)": "Potato Chips",
    "Red lentils (per 60g dry)":        "Red Lentils",
  };

  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) dayKeys.push(k);
  }

  for (const key of dayKeys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;

      for (const entry of day.entries) {
        const newName = RENAMES[entry.food?.name];
        if (!newName) continue;
        entry.food.name = newName;
        changed = true;
      }

      if (!changed) continue;
      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }

  localStorage.setItem("macro_migration_v15", "done");
}

runMacroMigrationV15();

function runMacroMigrationV16() {
  if (localStorage.getItem("macro_migration_v16") === "done") return;

  function getStatus(val, target) {
    return Math.abs(val / target - 1) <= 0.10 ? "hit" : "over";
  }

  function getFatStatus(fatVal, isGym) {
    const fatMax = isGym ? 85 : 75;
    const fatMin = fatMax * 0.51;
    if (fatVal >= fatMin && fatVal <= fatMax * 1.05) return "hit";
    return "over";
  }

  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) allKeys.push(k);
  }

  for (const key of allKeys) {
    if (key.startsWith("day_")) {
      try {
        const day = JSON.parse(localStorage.getItem(key));
        if (!day || !day.totals || !day.targets) continue;
        day.targets.f = day.isGym ? 85 : 75;
        day.score = [
          getStatus(day.totals.cal, day.targets.cal),
          getStatus(day.totals.p,   180),
          getStatus(day.totals.cal, day.targets.cal),
          getFatStatus(day.totals.f, day.isGym),
        ].filter(s => s === "hit").length;
        localStorage.setItem(key, JSON.stringify(day));
      } catch { /* skip malformed entries */ }
    } else if (key.startsWith("month_")) {
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (!entry || !entry.targets) continue;
        const isGym = entry.targets.cal === 2500;
        entry.targets.f = isGym ? 85 : 75;
        if (entry.avgCal !== undefined) {
          entry.score = [
            getStatus(entry.avgCal, entry.targets.cal),
            getStatus(entry.avgP,   180),
            getStatus(entry.avgCal, entry.targets.cal),
            getFatStatus(entry.avgF, isGym),
          ].filter(s => s === "hit").length;
        }
        localStorage.setItem(key, JSON.stringify(entry));
      } catch { /* skip malformed entries */ }
    }
  }

  localStorage.setItem("macro_migration_v16", "done");
}

runMacroMigrationV16();

function runMacroMigrationV17() {
  if (localStorage.getItem("macro_migration_v17") === "done") return;

  const RENAMES = {
    "Cod — breaded":                        "Cod — Breaded",
    "Bell pepper":                          "Bell Pepper",
    "Kidney beans — canned":               "Kidney Beans",
    "Red cabbage":                          "Red Cabbage",
    "Soy milk — unsweetened":              "Soy Milk — Unsweetened",
    "Yogurt — Greek, 0% fat":              "Yogurt — Greek, 0% Fat",
    "Pasta — regular":                      "Pasta — Regular",
    "Pasta — wholemeal":                    "Pasta — Wholemeal",
    "Bran flakes — M&S":                   "Bran Flakes — M&S",
    "McDonald's sausage & egg McMuffin":   "McDonald's Sausage & Egg McMuffin",
    "Double beef burger":                   "Double Beef Burger",
    "Fish & chips":                         "Fish & Chips",
    "Fried chicken — per piece (KFC avg)": "Fried Chicken",
    "Steak & ale pie":                      "Pie (Pub)",
    "Cheat meal — mild":                    "Cheat Meal — Mild",
    "Cheat meal — moderate":               "Cheat Meal — Moderate",
    "Cheat meal — nuclear":                "Cheat Meal — Nuclear",
  };

  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) dayKeys.push(k);
  }

  for (const key of dayKeys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;

      for (const entry of day.entries) {
        const newName = RENAMES[entry.food?.name];
        if (!newName) continue;
        entry.food.name = newName;
        changed = true;
      }

      if (!changed) continue;
      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }

  localStorage.setItem("macro_migration_v17", "done");
}

runMacroMigrationV17();

function runMacroMigrationV18() {
  if (localStorage.getItem("macro_migration_v18") === "done") return;

  function getStatus(val, target) {
    return Math.abs(val / target - 1) <= 0.10 ? "hit" : "over";
  }

  function getFatStatus(fatVal, isGym) {
    const fatMax = isGym ? 85 : 75;
    const fatMin = fatMax * 0.51;
    if (fatVal >= fatMin && fatVal <= fatMax * 1.05) return "hit";
    return "over";
  }

  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("day_")) dayKeys.push(k);
  }

  for (const key of dayKeys) {
    try {
      const day = JSON.parse(localStorage.getItem(key));
      if (!day || !Array.isArray(day.entries)) continue;
      let changed = false;

      for (const entry of day.entries) {
        if (entry.food?.name !== "Bread — Sourdough") continue;
        const mult = entry.qty;
        entry.food.cal = 100;
        entry.food.p = 4.7;
        entry.food.c = 18.3;
        entry.food.f = 0.63;
        entry.food.servingG = 45;
        entry.macros = {
          cal: Math.round(100  * mult * 10) / 10,
          p:   Math.round(4.7  * mult * 10) / 10,
          c:   Math.round(18.3 * mult * 10) / 10,
          f:   Math.round(0.63 * mult * 10) / 10,
        };
        changed = true;
      }

      if (!changed) continue;

      day.totals = {
        cal: day.entries.reduce((a, e) => a + e.macros.cal, 0),
        p:   day.entries.reduce((a, e) => a + e.macros.p,   0),
        c:   day.entries.reduce((a, e) => a + e.macros.c,   0),
        f:   day.entries.reduce((a, e) => a + e.macros.f,   0),
      };

      day.score = [
        getStatus(day.totals.cal, day.targets.cal),
        getStatus(day.totals.p,   180),
        getStatus(day.totals.cal, day.targets.cal),
        getFatStatus(day.totals.f, day.isGym),
      ].filter(s => s === "hit").length;

      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* skip malformed entries */ }
  }

  localStorage.setItem("macro_migration_v18", "done");
}

runMacroMigrationV18();

function runMacroMigrationV19() {
  if (localStorage.getItem("macro_migration_v19") === "done") return;
  // New food item added — no historical entries to update
  localStorage.setItem("macro_migration_v19", "done");
}

runMacroMigrationV19();

const TARGETS = {
  gym:  { cal: 2500, p: 180, c: 270, f: 85 },
  rest: { cal: 2200, p: 180, c: 210, f: 75 },
};

const FOODS = [
  { cat: "Meat", name: "Beef Mince - 15%", cal: 173, p: 18, c: 0, f: 11, unit: "g" },
  { cat: "Meat", name: "Beef Mince — 20%", cal: 196, p: 17, c: 0, f: 14, unit: "g" },
  { cat: "Meat", name: "Beef Mince — 5%", cal: 128, p: 20, c: 0, f: 5, unit: "g" },
  { cat: "Meat", name: "Chicken Breast — Skinless", cal: 120, p: 23, c: 0, f: 2, unit: "g" },
  { cat: "Meat", name: "Chicken Drumstick — Skin-On", cal: 175, p: 19.8, c: 0, f: 10.5, unit: "g" },
  { cat: "Meat", name: "Chicken Drumstick — Skinless", cal: 91, p: 18, c: 0, f: 2.8, unit: "g" },
  { cat: "Meat", name: "Chicken Leg — Skin-On", cal: 157, p: 13, c: 0, f: 10.2, unit: "g" },
  { cat: "Meat", name: "Chicken Leg — Skinless", cal: 115, p: 15, c: 0, f: 4.4, unit: "g" },
  { cat: "Meat", name: "Chicken Thigh — Skin-On", cal: 156, p: 15, c: 0, f: 11.5, unit: "g" },
  { cat: "Meat", name: "Chicken Thigh — Skinless", cal: 119, p: 16, c: 0, f: 5.7, unit: "g" },
  { cat: "Meat", name: "Duck Breast — Skin-On", cal: 219, p: 16, c: 0.7, f: 17, unit: "g" },
  { cat: "Meat", name: "Lamb Chops", cal: 218, p: 22, c: 0, f: 14, unit: "g" },
  { cat: "Meat", name: "Lamb Mince — 20%", cal: 216, p: 16, c: 0, f: 16.5, unit: "g" },
  { cat: "Meat", name: "Nduja", cal: 450, p: 14, c: 1, f: 42, unit: "g" },
  { cat: "Meat", name: "Pork Loin", cal: 133, p: 25, c: 0, f: 3.5, unit: "g" },
  { cat: "Meat", name: "Pork Mince — 5%", cal: 122, p: 21, c: 0, f: 4, unit: "g" },
  { cat: "Meat", name: "Pork Sausages", cal: 268, p: 14, c: 8, f: 21, unit: "g" },
  { cat: "Meat", name: "Steak — Ribeye", cal: 291, p: 22, c: 0, f: 22, unit: "g" },
  { cat: "Meat", name: "Steak — Regular", cal: 170, p: 26, c: 0, f: 7, unit: "g" },
  { cat: "Meat", name: "Turkey Mince — 5%", cal: 120, p: 21, c: 0, f: 4, unit: "g" },
  { cat: "Seafood", name: "Cod — Breaded", cal: 197, p: 14, c: 14, f: 9, unit: "g" },
  { cat: "Seafood", name: "White Fish", cal: 86, p: 18, c: 0, f: 1.2, unit: "g" },
  { cat: "Seafood", name: "Mackerel", cal: 205, p: 19, c: 0, f: 14, unit: "g" },
  { cat: "Seafood", name: "Prawns", cal: 71, p: 14, c: 0, f: 1, unit: "g" },
  { cat: "Seafood", name: "Salmon", cal: 175, p: 20, c: 0, f: 11, unit: "g" },
  { cat: "Seafood", name: "Sardines", cal: 185, p: 22, c: 0, f: 11, unit: "g" },
  { cat: "Seafood", name: "Trout", cal: 155, p: 22, c: 0, f: 7, unit: "g" },
  { cat: "Seafood", name: "Tuna", cal: 116, p: 25, c: 0, f: 0.8, unit: "g" },
  { cat: "Produce", name: "Avocado", cal: 288, p: 3.6, c: 16, f: 27, unit: "serving", servingG: 180 },
  { cat: "Produce", name: "Bell Pepper", cal: 31, p: 1, c: 6, f: 0.3, unit: "g" },
  { cat: "Produce", name: "Black Beans", cal: 91, p: 6, c: 16, f: 0.4, unit: "g" },
  { cat: "Produce", name: "Blackberries", cal: 43, p: 1.4, c: 10, f: 0.5, unit: "g" },
  { cat: "Produce", name: "Blueberries", cal: 57, p: 0.7, c: 14, f: 0.3, unit: "g" },
  { cat: "Produce", name: "Broccoli", cal: 34, p: 2.8, c: 7, f: 0.4, unit: "g" },
  { cat: "Produce", name: "Butter - Unsalted", cal: 72, p: 0.1, c: 0, f: 8.1, unit: "g" },
  { cat: "Produce", name: "Carrots", cal: 41, p: 0.9, c: 9.6, f: 0.2, unit: "g" },
  { cat: "Produce", name: "Cauliflower", cal: 25, p: 1.9, c: 5, f: 0.3, unit: "g" },
  { cat: "Produce", name: "Chickpeas", cal: 139, p: 8, c: 23, f: 2.6, unit: "g" },
  { cat: "Produce", name: "Courgette", cal: 34, p: 2.4, c: 6.2, f: 0.6, unit: "serving", servingG: 200 },
  { cat: "Produce", name: "Cucumber", cal: 45, p: 2.1, c: 10.8, f: 0.3, unit: "serving", servingG: 300 },
  { cat: "Produce", name: "Edamame", cal: 122, p: 11, c: 10, f: 5, unit: "g" },
  { cat: "Produce", name: "Frozen peas", cal: 77, p: 5, c: 14, f: 0.4, unit: "g" },
  { cat: "Produce", name: "Green Beans", cal: 31, p: 1.8, c: 7, f: 0.1, unit: "g" },
  { cat: "Produce", name: "Kale", cal: 49, p: 4.3, c: 9, f: 0.9, unit: "g" },
  { cat: "Produce", name: "Kidney Beans", cal: 100, p: 7, c: 18, f: 0.5, unit: "g" },
  { cat: "Produce", name: "Mayo (Reduced Fat)", cal: 37, p: 0.1, c: 1.2, f: 3.5, unit: "serving", servingG: 1 },
  { cat: "Produce", name: "Mixed Greens", cal: 17, p: 1.5, c: 3.2, f: 0.2, unit: "g" },
  { cat: "Produce", name: "Onion", cal: 90, p: 2.7, c: 21, f: 0.15, unit: "serving", servingG: 150 },
  { cat: "Produce", name: "Potato", cal: 77, p: 2, c: 17.5, f: 0.1, unit: "g" },
  { cat: "Produce", name: "Red Lentils", cal: 352, p: 23, c: 63, f: 1.2, unit: "g" },
  { cat: "Produce", name: "Red Cabbage", cal: 31, p: 1.4, c: 7, f: 0.2, unit: "g" },
  { cat: "Produce", name: "Spinach", cal: 23, p: 2.9, c: 3.6, f: 0.4, unit: "g" },
  { cat: "Produce", name: "Sweet Potato", cal: 86, p: 1.6, c: 20, f: 0.1, unit: "g" },
  { cat: "Produce", name: "Tofu", cal: 66, p: 6.5, c: 2, f: 3.5, unit: "g" },
  { cat: "Produce", name: "Tomatoes", cal: 18, p: 0.9, c: 3.5, f: 0.2, unit: "g" },
  { cat: "Dairy", name: "Cheese — Cheddar", cal: 403, p: 25, c: 0.1, f: 34, unit: "g" },
  { cat: "Dairy", name: "Cheese — Mozzarella", cal: 280, p: 28, c: 3.1, f: 17, unit: "g" },
  { cat: "Dairy", name: "Cheese — Parmigiano Reggiano", cal: 431, p: 38, c: 0, f: 29, unit: "g" },
  { cat: "Dairy", name: "Cheese — Pecorino Romano", cal: 387, p: 32, c: 0, f: 26, unit: "g" },
  { cat: "Dairy", name: "Cottage Cheese", cal: 77, p: 13, c: 3.5, f: 1, unit: "g" },
  { cat: "Dairy", name: "Egg", cal: 93, p: 7.8, c: 0.7, f: 6.6, unit: "serving", servingG: 60 },
  { cat: "Dairy", name: "Honey", cal: 46, p: 0, c: 12, f: 0, unit: "serving", servingG: 15 },
  { cat: "Dairy", name: "Milk — Skimmed", cal: 35, p: 3.4, c: 5, f: 0.1, unit: "g" },
  { cat: "Dairy", name: "Soy Milk — Unsweetened", cal: 33, p: 3.3, c: 1.8, f: 1.8, unit: "g" },
  { cat: "Dairy", name: "Yogurt — Greek, 0% Fat", cal: 57, p: 10, c: 4, f: 0.3, unit: "g" },
  { cat: "Grains", name: "Bread — Sourdough", cal: 100, p: 4.7, c: 18.3, f: 0.63, unit: "serving", servingG: 45 },
  { cat: "Grains", name: "Bread — Wholemeal", cal: 81, p: 3.5, c: 14, f: 1.1, unit: "serving", servingG: 35 },
  { cat: "Grains", name: "Noodles", cal: 385, p: 13, c: 72, f: 6, unit: "g" },
  { cat: "Grains", name: "Pasta — Regular", cal: 371, p: 13, c: 75, f: 1.5, unit: "g" },
  { cat: "Grains", name: "Pasta — Wholemeal", cal: 348, p: 14, c: 68, f: 2.5, unit: "g" },
  { cat: "Grains", name: "Quinoa", cal: 368, p: 14, c: 64, f: 6, unit: "g" },
  { cat: "Grains", name: "Nordic Rice Cake", cal: 35, p: 0.7, c: 7.3, f: 0.3, unit: "serving", servingG: 9 },
  { cat: "Grains", name: "Bran Flakes — M&S", cal: 359, p: 12, c: 64, f: 2.5, unit: "g" },
  { cat: "Grains", name: "Rice", cal: 156, p: 3.7, c: 29, f: 2.7, unit: "g" },
  { cat: "Grains", name: "Whey Protein", cal: 104, p: 22, c: 2, f: 1.5, unit: "serving", servingG: 1 },
  { cat: "Grains", name: "Tortilla Wrap", cal: 122, p: 3.7, c: 21.7, f: 2.1, unit: "serving", servingG: 41 },
  { cat: "Grains", name: "Rye Cracker", cal: 37, p: 1, c: 7, f: 0.3, unit: "serving", servingG: 10 },
  { cat: "Grains", name: "M&S Rye Bread", cal: 79, p: 2.5, c: 15, f: 0.5, unit: "serving", servingG: 35 },
  { cat: "Condiments", name: "Peanut Butter - Natural", cal: 598, p: 25, c: 20, f: 50, unit: "g" },
  { cat: "Condiments", name: "Soy Sauce —Light", cal: 8, p: 1.2, c: 0.8, f: 0, unit: "serving", servingG: 15 },
  { cat: "Meals", name: "Assenheim's", cal: 850, p: 65, c: 72, f: 28, unit: "serving", servingG: 1 },
  { cat: "Meals", name: "McDonald's Sausage & Egg McMuffin", cal: 430, p: 26, c: 29, f: 34, unit: "serving", servingG: 1 },
  { cat: "Meals", name: "Mediterranean Chicken Rice Box", cal: 700, p: 45, c: 70, f: 25, unit: "serving", servingG: 1 },
  { cat: "Meals", name: "Mediterranean Chicken Wrap", cal: 670, p: 50, c: 44, f: 33, unit: "serving", servingG: 1 },
  { cat: "Meals", name: "Pizza (whole 12\")", cal: 900, p: 48, c: 90, f: 38, unit: "serving", servingG: 1 },
  { cat: "Meals", name: "Roast & Greens", cal: 620, p: 48, c: 38, f: 28, unit: "serving", servingG: 1 },
  { cat: "Meals", name: "Meal — Light", cal: 500, p: 20, c: 60, f: 18, unit: "serving", servingG: 1 },
  { cat: "Meals", name: "Nando's", cal: 949, p: 85, c: 55, f: 44, unit: "serving", servingG: 1 },
  { cat: "Meals", name: "Sandwich Sandwich", cal: 680, p: 38, c: 55, f: 27, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Beer — Ale", cal: 196, p: 1.5, c: 15, f: 0, unit: "serving", servingG: 568 },
  { cat: "Dirty", name: "Beer — Stout", cal: 210, p: 2, c: 18, f: 0, unit: "serving", servingG: 568 },
  { cat: "Dirty", name: "Double Beef Burger", cal: 720, p: 42, c: 38, f: 44, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Fish & Chips", cal: 1240, p: 58, c: 128, f: 52, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Fried Chicken", cal: 320, p: 28, c: 8, f: 19, unit: "serving", servingG: 150 },
  { cat: "Dirty", name: "Gin", cal: 97, p: 0, c: 0, f: 0, unit: "serving", servingG: 44 },
  { cat: "Dirty", name: "Guinness 0.0", cal: 75, p: 1.3, c: 16.7, f: 0, unit: "serving", servingG: 440 },
  { cat: "Dirty", name: "Ice Cream", cal: 207, p: 3.5, c: 24, f: 11, unit: "serving", servingG: 100 },
  { cat: "Dirty", name: "Pizza — Slice", cal: 330, p: 13, c: 40, f: 13, unit: "serving", servingG: 120 },
  { cat: "Dirty", name: "Potato Chips", cal: 537, p: 7, c: 54, f: 34, unit: "g" },
  { cat: "Dirty", name: "Snack", cal: 465, p: 7.6, c: 56.5, f: 20.4, unit: "g" },
  { cat: "Dirty", name: "Strongbow Dark Fruit (440ml can)", cal: 224, p: 0, c: 27.7, f: 0, unit: "serving", servingG: 440 },
  { cat: "Dirty", name: "Pie (Pub)", cal: 1110, p: 34, c: 105, f: 58, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "M&S Tortilla Chips", cal: 481, p: 5.5, c: 62.7, f: 21.9, unit: "g" },
  { cat: "Dirty", name: "Whisky", cal: 97, p: 0, c: 0, f: 0, unit: "serving", servingG: 44 },
  { cat: "Dirty", name: "Wine — Red", cal: 130, p: 0.1, c: 4, f: 0, unit: "serving", servingG: 175 },
  { cat: "Dirty", name: "Cheat Meal — Mild", cal: 1000, p: 30, c: 100, f: 48, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Cheat Meal — Moderate", cal: 1500, p: 35, c: 145, f: 68, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Cheat Meal — Nuclear", cal: 2000, p: 40, c: 195, f: 95, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Fries", cal: 530, p: 6, c: 68, f: 26, unit: "serving", servingG: 200 },
  { cat: "Dirty", name: "Dark Chocolate", cal: 598, p: 7, c: 20, f: 50, unit: "g" },
];

const CAT_EMOJIS = { Meat:"🥩", Seafood:"🐟", Produce:"🥦", Dairy:"🥚", Grains:"🍚", Condiments:"🫙", Meals:"🍽", Dirty:"🍕" };
const CATS = [...new Set(FOODS.map(f => f.cat))];
const C = { p: "#3b82f6", c: "#f59e0b", f: "#10b981" };

function calcMacros(food, qty) {
  const mult = food.unit === "serving" ? qty : qty / 100;
  return {
    cal: Math.round(food.cal * mult * 10) / 10,
    p:   Math.round(food.p   * mult * 10) / 10,
    c:   Math.round(food.c   * mult * 10) / 10,
    f:   Math.round(food.f   * mult * 10) / 10,
  };
}

const TIGHT = 0.10;  // ±10% = green, beyond = red

function getStatus(val, target) {
  const ratio = val / target;
  const dev = Math.abs(ratio - 1);
  if (dev <= 0.10) return "hit";
  return "over";
}

function getFatStatus(fatVal, isGym) {
  const fatMax = isGym ? 85 : 75;
  const fatMin = fatMax * 0.51;
  if (fatVal >= fatMin && fatVal <= fatMax * 1.05) return "hit";
  return "over";
}

const STATUS_COLOR = { hit: "#22c55e", over: "#ef4444" };

function MacroRing({ val, target, label, unit = "g" }) {
  const pct = Math.min(val / target, 1);
  const r = 28, circ = 2 * Math.PI * r;
  const status = getStatus(val, target);
  const ringColor = val === 0 ? "#e5e5e5" : STATUS_COLOR[status];
  const dot = status === "hit" ? "✓" : status === "over" ? "!" : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <svg width={72} height={72}>
          <circle cx={36} cy={36} r={r} fill="none" stroke="#f0f0f0" strokeWidth={6} />
          <circle cx={36} cy={36} r={r} fill="none" stroke={ringColor}
            strokeWidth={6} strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round" transform="rotate(-90 36 36)" />
          <text x={36} y={33} textAnchor="middle" fontSize={11} fontWeight={700} fill={val === 0 ? "#ccc" : ringColor}>{Math.round(val)}</text>
          <text x={36} y={46} textAnchor="middle" fontSize={9} fill="#aaa">/ {target}{unit}</text>
        </svg>
        {dot && (
          <div style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, borderRadius: "50%",
            background: ringColor, color: "#fff", fontSize: 9, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            {dot}
          </div>
        )}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: val === 0 ? "#bbb" : ringColor }}>{label}</span>
    </div>
  );
}

function StackBar({ totals, target }) {
  const pPct = Math.min((totals.p * 4 / target.cal) * 100, 100);
  const cPct = Math.min((totals.c * 4 / target.cal) * 100, 100);
  const fPct = Math.min((totals.f * 9 / target.cal) * 100, 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: 26, color: "#22c55e", lineHeight: 1 }}>
            {Math.round(totals.cal)}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginLeft: 4 }}>/ {target.cal} kcal</span>
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 6, height: 12, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pPct}%`, background: C.p }} />
        <div style={{ position: "absolute", left: `${pPct}%`, top: 0, height: "100%", width: `${cPct}%`, background: C.c }} />
        <div style={{ position: "absolute", left: `${pPct+cPct}%`, top: 0, height: "100%", width: `${fPct}%`, background: C.f }} />
        <div style={{ position: "absolute", left: `${Math.min((1/(1+TIGHT))*100,100)}%`, top: 0, height: "100%", width: 2, background: "rgba(255,255,255,0.4)" }} />
      </div>
    </div>
  );
}

function AddModal({ onAdd, onClose }) {
  const [search, setSearch] = useState("");
  const [selCat, setSelCat] = useState("All");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(0);

  const filtered = useMemo(() => {
    return FOODS.filter(f =>
      (selCat === "All" || f.cat === selCat) &&
      f.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [search, selCat]);

  const preview = selected && qty > 0 ? calcMacros(selected, qty) : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 500,
        height: "85vh",
        display: "flex", flexDirection: "column", padding: "20px 16px 24px",
        boxSizing: "border-box", overflow: "hidden"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Add Food</span>
          <button onClick={onClose} style={{ border: "none", background: "#f0f0f0", borderRadius: 20, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#555" }}>×</button>
        </div>

        <input value={search} onChange={e => { setSearch(e.target.value); setSelected(null); setQty(0); }}
          placeholder="Search food…" autoFocus
          style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 10, outline: "none", width: "100%", boxSizing: "border-box", flexShrink: 0 }} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12, flexShrink: 0 }}>
          <button onClick={() => { setSelCat("All"); setSelected(null); setQty(0); }}
            style={{ padding: "6px 14px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
              background: selCat === "All" ? "#1a1a1a" : "#f0f0f0",
              color: selCat === "All" ? "#fff" : "#555" }}>
            All
          </button>
          {CATS.map(c => (
            <button key={c} onClick={() => { setSelCat(c); setSelected(null); setQty(0); }}
              title={c}
              style={{ padding: "6px 10px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 16,
                background: selCat === c ? "#1a1a1a" : "#f0f0f0" }}>
              {CAT_EMOJIS[c]}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, marginBottom: 12 }}>
          {filtered.map(food => (
            <div key={food.name} onClick={() => { setSelected(food); setQty(0); }}
              style={{ padding: "9px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 2,
                background: selected?.name === food.name ? "#f0f7ff" : "transparent",
                border: selected?.name === food.name ? "1px solid #bfdbfe" : "1px solid transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{food.name}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>
                    {food.unit === "serving" ? `per serving${food.servingG > 1 ? ` (~${food.servingG}g)` : ""}` : "per 100g"}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, color: "#555" }}>{food.cal} kcal</div>
                  <div style={{ color: C.p }}>{food.p}g P</div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ margin: "8px 0", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "16px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>"{search}" isn't in the database</div>
              <div style={{ fontSize: 12, color: "#b45309", lineHeight: 1.5 }}>
                Ask in the chat — type something like:<br />
                <span style={{ fontStyle: "italic" }}>"Add [food name] to the tracker"</span>
              </div>
            </div>
          )}
        </div>

        {selected && (
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 14, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 4 }}>
                  {selected.unit === "serving" ? "Servings" : "Amount (g)"}
                </div>
                <input type="number" value={qty === 0 ? "" : qty} placeholder="0" min={0}
                  step={selected.unit === "serving" ? 0.5 : 10}
                  onChange={e => setQty(parseFloat(e.target.value) || 0)}
                  style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: "8px 12px", fontSize: 15, fontWeight: 700, width: "100%", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ background: "#f8f8f8", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 140 }}>
                {preview ? (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#6366f1" }}>{preview.cal} kcal</div>
                    <div style={{ display: "flex", gap: 8, fontSize: 11, marginTop: 3 }}>
                      <span style={{ color: C.p }}>{preview.p}g P</span>
                      <span style={{ color: "#b45309" }}>{preview.c}g C</span>
                      <span style={{ color: C.f }}>{preview.f}g F</span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "#ccc" }}>Enter amount</div>
                )}
              </div>
            </div>
            <button onClick={() => { if (preview) { onAdd(selected, qty, preview); onClose(); } }}
              disabled={!preview}
              style={{ width: "100%", padding: "12px", background: preview ? "#1a1a1a" : "#e5e5e5",
                color: preview ? "#fff" : "#aaa", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: preview ? "pointer" : "default" }}>
              Add to Log
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ totals, target, isGym, onReset, onEdit, onClearAll }) {
  const items = [
    { label: "Calories", val: Math.round(totals.cal), tgt: target.cal, unit: "kcal", dot: "#6366f1" },
    { label: "Protein",  val: Math.round(totals.p),   tgt: target.p,   unit: "g",    dot: "#3b82f6" },
    { label: "Carbs",    val: Math.round(totals.c),   tgt: target.c,   unit: "g",    dot: "#f59e0b" },
    { label: "Fat",      val: Math.round(totals.f),   tgt: target.f,   unit: "g",    dot: "#10b981" },
  ];
  const score = items.filter(({ label, val, tgt }) =>
    label === "Fat" ? getFatStatus(val, isGym) === "hit" : getStatus(val, tgt) === "hit"
  ).length;

  return (
    <div style={{ margin: "12px 12px 90px" }}>
      <div style={{ background: "#fafaf9", borderBottom: "0.5px solid #e5e5e5", borderRadius: "12px 12px 0 0", padding: "16px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#9a9a9a", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Day Complete</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#1a1a1a", lineHeight: 1 }}>{score}<span style={{ fontSize: 16, color: "#aaa" }}>/4</span></div>
          <div style={{ fontSize: 11, color: "#aaa" }}>targets hit</div>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderTop: "none" }}>
        {items.map(({ label, val, tgt, unit, dot }, i) => {
          const s = label === "Fat" ? getFatStatus(val, isGym) : getStatus(val, tgt);
          const col = STATUS_COLOR[s];
          const pct = Math.min((val / tgt) * 100, 110);
          const diff = val - tgt;
          return (
            <div key={label} style={{ padding: "12px 16px", borderBottom: i < items.length - 1 ? "1px solid #f5f5f5" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: dot }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{val}{unit}</span>
                  <span style={{ fontSize: 11, color: "#bbb" }}>/ {tgt}{unit}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                    background: s === "hit" ? "#f0fdf4" : "#fef2f2",
                    color: col
                  }}>
                    {s === "hit" ? "✓ Hit" : `${diff > 0 ? "+" : ""}${Math.round(diff)}${unit}`}
                  </span>
                </div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 4, height: 7, overflow: "hidden", position: "relative" }}>
                <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: col, borderRadius: 4 }} />
                <div style={{ position: "absolute", left: `${(1/(1+TIGHT))*100}%`, top: 0, height: "100%", width: 1.5, background: "rgba(0,0,0,0.12)" }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, padding: "12px 12px", background: "#fff", borderRadius: "0 0 12px 12px", borderTop: "1px solid #f5f5f5" }}>
        <button onClick={onEdit}
          style={{ flex: 1, padding: "12px", background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Edit log
        </button>
        <button onClick={onClearAll}
          style={{ flex: 1, padding: "12px", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Clear all
        </button>
        <button onClick={onReset}
          style={{ flex: 1, padding: "12px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          New day
        </button>
      </div>
    </div>
  );
}

export default function MacroTracker() {
  const [workingDate, setWorkingDate] = useState(() => {
    const savedKey = localStorage.getItem("working_date");
    if (savedKey) {
      const [y, m, d] = savedKey.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    const today = new Date();
    localStorage.setItem("working_date", formatDateKey(today));
    return today;
  });

  // Load session that matches the working date (null if none or stale)
  const [stored] = useState(() => loadStorage(formatDateKey(workingDate)));

  const [isGym, setIsGym] = useState(stored?.isGym ?? true);
  const [log, setLog] = useState(stored?.log ?? []);
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(stored?.submitted ?? false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Keep working_date in localStorage in sync whenever it changes
  useEffect(() => {
    localStorage.setItem("working_date", formatDateKey(workingDate));
  }, [workingDate]);

  // Sync tracker state when History tab deletes or edits a day matching the current working date
  useEffect(() => {
    function handleTrackerSync(e) {
      const { type, dateStr, updated } = e.detail;
      if (dateStr !== formatDateKey(workingDate)) return;
      if (type === "delete") {
        clearStorage();
        setLog([]);
        setSubmitted(false);
      } else if (type === "edit") {
        setLog(updated.entries || []);
        setSubmitted(true);
      }
    }
    window.addEventListener("tracker-sync", handleTrackerSync);
    return () => window.removeEventListener("tracker-sync", handleTrackerSync);
  }, [workingDate]);

  // Persist session state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: formatDateKey(workingDate), log, isGym, submitted }));
  }, [log, isGym, submitted, workingDate]);

  function switchToDate(newDate) {
    if (log.length > 0 && !submitted) {
      if (!window.confirm("You have unsaved entries that will be lost. Switch date anyway?")) return;
    }
    const newKey = formatDateKey(newDate);
    // Check for a completed submitted day
    const completedRaw = localStorage.getItem(`day_${newKey}`);
    if (completedRaw) {
      try {
        const data = JSON.parse(completedRaw);
        clearStorage();
        setIsGym(data.isGym ?? true);
        setLog(data.entries ?? []);
        setWorkingDate(newDate);
        setSubmitted(true);
        return;
      } catch { /* fall through */ }
    }
    // Check for an in-progress session for this date
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session.date === newKey) {
          setIsGym(session.isGym ?? true);
          setLog(session.log ?? []);
          setWorkingDate(newDate);
          setSubmitted(session.submitted ?? false);
          return;
        }
      }
    } catch { /* fall through */ }
    // No data for this date — start fresh
    clearStorage();
    setIsGym(true);
    setLog([]);
    setSubmitted(false);
    setWorkingDate(newDate);
  }

  const target = TARGETS[isGym ? "gym" : "rest"];
  const totals = {
    cal: log.reduce((a, e) => a + e.macros.cal, 0),
    p:   log.reduce((a, e) => a + e.macros.p, 0),
    c:   log.reduce((a, e) => a + e.macros.c, 0),
    f:   log.reduce((a, e) => a + e.macros.f, 0),
  };

  const isOnToday = formatDateKey(workingDate) === formatDateKey(new Date());

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#f8f8f8", minHeight: "100vh", paddingBottom: 90 }}>

      <div style={{ background: "#1e3a5f", padding: "20px 16px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#666", fontWeight: 600, letterSpacing: 1 }}>EAT</div>
            {showDatePicker ? (
              <input
                type="date"
                value={formatDateKey(workingDate)}
                autoFocus
                onBlur={() => setShowDatePicker(false)}
                onChange={e => {
                  if (!e.target.value) return;
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  switchToDate(new Date(y, m - 1, d));
                  setShowDatePicker(false);
                }}
                style={{ fontSize: 14, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.35)", borderRadius: 6, padding: "4px 8px",
                  marginTop: 4, outline: "none", colorScheme: "dark", width: 150 }}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, cursor: "pointer" }}
                onClick={() => setShowDatePicker(true)}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{formatDateDisplay(workingDate)}</span>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
            )}
            {!isOnToday && !showDatePicker && (
              <button onClick={() => switchToDate(new Date())}
                style={{ marginTop: 5, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 10, padding: "2px 8px", cursor: "pointer" }}>
                → Today
              </button>
            )}
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: 3, gap: 2 }}>
            {[["gym","🏋️ Gym"],["rest","🛋️ Rest"]].map(([key, label]) => {
              const active = (isGym ? "gym" : "rest") === key;
              return (
              <button key={key} onClick={() => setIsGym(key === "gym")}
                style={{ padding: "5px 12px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                  background: active ? "#fbbf24" : "transparent",
                  color: active ? "#1a1a1a" : "rgba(255,255,255,0.6)" }}>
                {label}
              </button>
              );
            })}
          </div>
        </div>
        <StackBar totals={totals} target={target} />
      </div>

      <div style={{ background: "#fff", margin: "12px 12px 0", borderRadius: 12, padding: "16px 8px", display: "flex", justifyContent: "space-around", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <MacroRing val={totals.p} target={target.p} label="Protein" />
        <MacroRing val={totals.c} target={target.c} label="Carbs" />
        <MacroRing val={totals.f} target={target.f} label="Fat" />
      </div>

      {!submitted && (
        <div style={{ margin: "12px 12px 0", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "14px 14px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>Today's Log</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "#aaa" }}>{log.length} {log.length === 1 ? "entry" : "entries"}</span>
              {log.length > 0 && (
                <button onClick={() => setLog([])} style={{ background: "none", border: "none", fontSize: 11, fontWeight: 600, color: "#ef4444", cursor: "pointer", padding: 0 }}>
                  Clear all
                </button>
              )}
            </div>
          </div>
          {log.length === 0 && (
            <div style={{ padding: "28px 16px", textAlign: "center", color: "#ccc", fontSize: 13 }}>No food logged yet — tap + to add</div>
          )}
          {log.map(entry => (
            <div key={entry.id} style={{ padding: "10px 14px", borderTop: "1px solid #f5f5f5", display: "flex", alignItems: "center", flexWrap: "nowrap", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>{entry.food.name}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
                  {entry.food.unit === "serving" ? `${entry.qty} serving${entry.qty !== 1 ? "s" : ""}` : `${entry.qty}g`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, fontSize: 11, alignItems: "center", flexShrink: 0 }}>
                <span style={{ background: "#f0f7ff", color: C.p, padding: "2px 6px", borderRadius: 6, fontWeight: 600, width: "auto", flexShrink: 0 }}>{entry.macros.p}p</span>
                <span style={{ background: "#fffbeb", color: "#b45309", padding: "2px 6px", borderRadius: 6, fontWeight: 600, width: "auto", flexShrink: 0 }}>{entry.macros.c}c</span>
                <span style={{ background: "#f0fdf4", color: "#059669", padding: "2px 6px", borderRadius: 6, fontWeight: 600, width: "auto", flexShrink: 0 }}>{entry.macros.f}f</span>
                <span style={{ color: "#555", fontWeight: 700, fontSize: 12, minWidth: 38, textAlign: "right", flexShrink: 0 }}>{entry.macros.cal}<span style={{ fontSize: 10, fontWeight: 400, color: "#aaa" }}>k</span></span>
              </div>
              <button onClick={() => setLog(log.filter(e => e.id !== entry.id))}
                style={{ border: "none", background: "none", color: "#ddd", cursor: "pointer", fontSize: 18, padding: "0 2px", lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {submitted && (
        <SummaryCard
          totals={totals}
          target={target}
          isGym={isGym}
          onEdit={() => setSubmitted(false)}
          onClearAll={() => { clearStorage(); localStorage.removeItem(`day_${formatDateKey(workingDate)}`); setSubmitted(false); setLog([]); }}
          onReset={() => { clearStorage(); setSubmitted(false); setLog([]); setWorkingDate(prev => advanceDay(prev)); }}
        />
      )}

      {!submitted && (
        <div style={{ position: "fixed", bottom: 24, right: "50%", transform: "translateX(50%)", maxWidth: "calc(500px - 32px)", width: "calc(100% - 32px)", display: "flex", gap: 10 }}>
          <button onClick={() => setShowModal(true)}
            style={{ flex: 1, background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 12, padding: "14px",
              fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Add Food
          </button>
          <button onClick={() => {
              const dateKey = formatDateKey(workingDate);
              const score = [
                Math.abs(totals.cal / target.cal - 1) <= 0.05,
                Math.abs(totals.p   / target.p   - 1) <= 0.05,
                Math.abs(totals.c   / target.c   - 1) <= 0.05,
                getFatStatus(totals.f, isGym) === "hit",
              ].filter(Boolean).length;
              localStorage.setItem(`day_${dateKey}`, JSON.stringify({
                date: dateKey, isGym, targets: target, totals, score, entries: [...log],
              }));
              setSubmitted(true);
            }} disabled={log.length === 0}
            style={{ flex: 1, background: log.length === 0 ? "#e5e5e5" : "#22c55e", color: log.length === 0 ? "#aaa" : "#fff",
              border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700,
              cursor: log.length === 0 ? "default" : "pointer",
              boxShadow: log.length === 0 ? "none" : "0 4px 20px rgba(34,197,94,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {isOnToday ? "✓ Done for Today" : "✓ Submit Day"}
          </button>
        </div>
      )}

      {showModal && (
        <AddModal
          onAdd={(food, qty, macros) => setLog([...log, { id: Date.now(), food, qty, macros }])}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export { FOODS, CATS, CAT_EMOJIS, calcMacros, AddModal };
