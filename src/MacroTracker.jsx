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

const TARGETS = {
  gym:  { cal: 2500, p: 180, c: 270, f: 83 },
  rest: { cal: 2200, p: 180, c: 210, f: 73 },
};

const FOODS = [
  { cat: "Meat", name: "Beef mince — 20% fat", cal: 196, p: 17, c: 0, f: 14, unit: "g" },
  { cat: "Meat", name: "Beef mince — 5% fat", cal: 128, p: 20, c: 0, f: 5, unit: "g" },
  { cat: "Meat", name: "Chicken breast — skinless", cal: 120, p: 23, c: 0, f: 2, unit: "g" },
  { cat: "Meat", name: "Chicken drumstick — skin-on", cal: 175, p: 19, c: 0, f: 11, unit: "g" },
  { cat: "Meat", name: "Chicken drumstick — skinless", cal: 130, p: 21, c: 0, f: 4, unit: "g" },
  { cat: "Meat", name: "Chicken leg — skin-on", cal: 215, p: 18, c: 0, f: 14, unit: "g" },
  { cat: "Meat", name: "Chicken leg — skinless", cal: 158, p: 20, c: 0, f: 6, unit: "g" },
  { cat: "Meat", name: "Chicken thigh — skin-on", cal: 190, p: 18, c: 0, f: 14, unit: "g" },
  { cat: "Meat", name: "Chicken thigh — skinless", cal: 145, p: 19, c: 0, f: 7, unit: "g" },
  { cat: "Meat", name: "Lamb chops", cal: 218, p: 22, c: 0, f: 14, unit: "g" },
  { cat: "Meat", name: "Lamb mince — 20% fat", cal: 216, p: 16, c: 0, f: 16.5, unit: "g" },
  { cat: "Meat", name: "Pork loin — lean", cal: 133, p: 25, c: 0, f: 3.5, unit: "g" },
  { cat: "Meat", name: "Pork mince — 5% fat", cal: 122, p: 21, c: 0, f: 4, unit: "g" },
  { cat: "Meat", name: "Pork sausages", cal: 268, p: 14, c: 8, f: 21, unit: "g" },
  { cat: "Meat", name: "Rump steak", cal: 166, p: 26, c: 0, f: 6.5, unit: "g" },
  { cat: "Meat", name: "Sirloin steak", cal: 193, p: 25, c: 0, f: 10, unit: "g" },
  { cat: "Meat", name: "Turkey mince — 5% fat", cal: 120, p: 21, c: 0, f: 4, unit: "g" },
  { cat: "Seafood", name: "Cod", cal: 83, p: 18, c: 0, f: 0.9, unit: "g" },
  { cat: "Seafood", name: "Cod — breaded", cal: 197, p: 14, c: 14, f: 9, unit: "g" },
  { cat: "Seafood", name: "Haddock", cal: 87, p: 19, c: 0, f: 0.8, unit: "g" },
  { cat: "Seafood", name: "Mackerel", cal: 205, p: 19, c: 0, f: 14, unit: "g" },
  { cat: "Seafood", name: "Prawns", cal: 71, p: 14, c: 0, f: 1, unit: "g" },
  { cat: "Seafood", name: "Salmon", cal: 175, p: 20, c: 0, f: 11, unit: "g" },
  { cat: "Seafood", name: "Sardines — canned", cal: 185, p: 22, c: 0, f: 11, unit: "g" },
  { cat: "Seafood", name: "Sea bass", cal: 93, p: 18, c: 0, f: 2, unit: "g" },
  { cat: "Seafood", name: "Trout", cal: 155, p: 22, c: 0, f: 7, unit: "g" },
  { cat: "Seafood", name: "Tuna — canned", cal: 116, p: 25, c: 0, f: 0.8, unit: "g" },
  { cat: "Produce", name: "Avocado (1 whole)", cal: 288, p: 3.6, c: 16.2, f: 27, unit: "serving", servingG: 180 },
  { cat: "Produce", name: "Bell pepper", cal: 31, p: 1, c: 6, f: 0.3, unit: "g" },
  { cat: "Produce", name: "Black beans — canned", cal: 91, p: 6, c: 16, f: 0.4, unit: "g" },
  { cat: "Produce", name: "Blackberries", cal: 43, p: 1.4, c: 10, f: 0.5, unit: "g" },
  { cat: "Produce", name: "Blueberries", cal: 57, p: 0.7, c: 14, f: 0.3, unit: "g" },
  { cat: "Produce", name: "Broccoli", cal: 34, p: 2.8, c: 7, f: 0.4, unit: "g" },
  { cat: "Produce", name: "Cauliflower", cal: 25, p: 1.9, c: 5, f: 0.3, unit: "g" },
  { cat: "Produce", name: "Chickpeas — canned", cal: 139, p: 8, c: 23, f: 2.6, unit: "g" },
  { cat: "Produce", name: "Courgette (1 whole)", cal: 34, p: 2.4, c: 6.2, f: 0.6, unit: "serving", servingG: 200 },
  { cat: "Produce", name: "Cucumber", cal: 15, p: 0.7, c: 3.6, f: 0.1, unit: "g" },
  { cat: "Produce", name: "Edamame — shelled", cal: 122, p: 11, c: 10, f: 5, unit: "g" },
  { cat: "Produce", name: "Frozen peas", cal: 77, p: 5, c: 14, f: 0.4, unit: "g" },
  { cat: "Produce", name: "Green beans", cal: 31, p: 1.8, c: 7, f: 0.1, unit: "g" },
  { cat: "Produce", name: "Kale", cal: 49, p: 4.3, c: 9, f: 0.9, unit: "g" },
  { cat: "Produce", name: "Kidney beans — canned", cal: 100, p: 7, c: 18, f: 0.5, unit: "g" },
  { cat: "Produce", name: "Onion (1 medium)", cal: 60, p: 1.8, c: 14, f: 0.1, unit: "serving", servingG: 150 },
  { cat: "Produce", name: "Potato (1 medium)", cal: 116, p: 3, c: 25.5, f: 0.15, unit: "serving", servingG: 150 },
  { cat: "Produce", name: "Red lentils (per 60g dry)", cal: 211, p: 14, c: 38, f: 0.7, unit: "serving", servingG: 60 },
  { cat: "Produce", name: "Spinach — raw", cal: 23, p: 2.9, c: 3.6, f: 0.4, unit: "g" },
  { cat: "Produce", name: "Sweet potato (1 medium)", cal: 112, p: 2.1, c: 26, f: 0.13, unit: "serving", servingG: 130 },
  { cat: "Produce", name: "Tomatoes — canned", cal: 16, p: 1, c: 3, f: 0.2, unit: "g" },
  { cat: "Produce", name: "Tomatoes — whole", cal: 18, p: 0.9, c: 3.5, f: 0.2, unit: "g" },
  { cat: "Dairy", name: "Cheese — Cheddar", cal: 403, p: 25, c: 0.1, f: 34, unit: "g" },
  { cat: "Dairy", name: "Cheese — Mozzarella", cal: 280, p: 28, c: 3.1, f: 17, unit: "g" },
  { cat: "Dairy", name: "Cheese — Parmigiano Reggiano", cal: 431, p: 38, c: 0, f: 29, unit: "g" },
  { cat: "Dairy", name: "Cheese — Pecorino Romano", cal: 387, p: 32, c: 0, f: 26, unit: "g" },
  { cat: "Dairy", name: "Cottage cheese — low fat", cal: 77, p: 13, c: 3.5, f: 1, unit: "g" },
  { cat: "Dairy", name: "Egg — cooked (1 egg)", cal: 93, p: 7.8, c: 0.7, f: 6.6, unit: "serving", servingG: 60 },
  { cat: "Dairy", name: "Milk — skimmed", cal: 35, p: 3.4, c: 5, f: 0.1, unit: "g" },
  { cat: "Dairy", name: "Soy milk — unsweetened", cal: 33, p: 3.3, c: 1.8, f: 1.8, unit: "g" },
  { cat: "Dairy", name: "Yogurt — Greek, 0% fat", cal: 57, p: 10, c: 4, f: 0.3, unit: "g" },
  { cat: "Grains", name: "Bread — sourdough (per slice)", cal: 90, p: 3, c: 17, f: 0.7, unit: "serving", servingG: 35 },
  { cat: "Grains", name: "Bread — wholemeal (per slice)", cal: 81, p: 3.5, c: 14, f: 1.1, unit: "serving", servingG: 35 },
  { cat: "Grains", name: "Egg noodles", cal: 385, p: 13, c: 72, f: 6, unit: "g" },
  { cat: "Grains", name: "Pasta — regular", cal: 371, p: 13, c: 75, f: 1.5, unit: "g" },
  { cat: "Grains", name: "Pasta — wholemeal", cal: 348, p: 14, c: 68, f: 2.5, unit: "g" },
  { cat: "Grains", name: "Quinoa", cal: 368, p: 14, c: 64, f: 6, unit: "g" },
  { cat: "Grains", name: "Rice cake (per cake)", cal: 35, p: 0.7, c: 7.3, f: 0.3, unit: "serving", servingG: 9 },
  { cat: "Grains", name: "Bran flakes — M&S", cal: 359, p: 12, c: 64, f: 2.5, unit: "g" },
  { cat: "Grains", name: "White rice", cal: 365, p: 7, c: 80, f: 0.7, unit: "g" },
  { cat: "Grains", name: "Whey protein (per 25g scoop)", cal: 95, p: 20, c: 2, f: 1.5, unit: "serving", servingG: 25 },
  { cat: "Grains", name: "Tortilla wrap — medium", cal: 138, p: 3.5, c: 24, f: 3, unit: "serving", servingG: 45 },
  { cat: "Grains", name: "Rye cracker (per cracker)", cal: 37, p: 1, c: 7, f: 0.3, unit: "serving", servingG: 10 },
  { cat: "Grains", name: "Rye bread — wholegrain (per slice)", cal: 79, p: 2.5, c: 15, f: 0.5, unit: "serving", servingG: 35 },
  { cat: "Condiments", name: "Butter (per 10g)", cal: 72, p: 0.1, c: 0, f: 8.1, unit: "serving", servingG: 10 },
  { cat: "Condiments", name: "Honey (per tbsp)", cal: 46, p: 0, c: 12, f: 0, unit: "serving", servingG: 15 },
  { cat: "Condiments", name: "Hot sauce (per tbsp)", cal: 2, p: 0.1, c: 0.2, f: 0.1, unit: "serving", servingG: 15 },
  { cat: "Condiments", name: "Nando's marinade (per tbsp)", cal: 14, p: 0.2, c: 2.7, f: 0.2, unit: "serving", servingG: 15 },
  { cat: "Condiments", name: "Olive oil (per tbsp)", cal: 119, p: 0, c: 0, f: 13.5, unit: "serving", servingG: 15 },
  { cat: "Condiments", name: "Peanut butter — natural", cal: 598, p: 25, c: 20, f: 50, unit: "g" },
  { cat: "Condiments", name: "Sesame oil (per tbsp)", cal: 119, p: 0, c: 0, f: 13.5, unit: "serving", servingG: 15 },
  { cat: "Condiments", name: "Soy sauce — light (per tbsp)", cal: 8, p: 1.2, c: 0.8, f: 0, unit: "serving", servingG: 15 },
  { cat: "Meals", name: "Assenhaims — chicken meal large", cal: 850, p: 65, c: 72, f: 28, unit: "serving", servingG: 1 },
  { cat: "Meals", name: "Mediterranean chicken rice box", cal: 510, p: 47, c: 60, f: 8, unit: "serving", servingG: 1 },
  { cat: "Meals", name: "Mediterranean chicken wrap", cal: 480, p: 32, c: 42, f: 18, unit: "serving", servingG: 1 },
  { cat: "Meals", name: "Pizza Union — pepperoni (whole 12\")", cal: 980, p: 42, c: 100, f: 42, unit: "serving", servingG: 1 },
  { cat: "Meals", name: "Roast & Greens — chicken box large", cal: 620, p: 48, c: 38, f: 28, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Beer — ale (pint)", cal: 196, p: 1.5, c: 15, f: 0, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Beer — stout (pint)", cal: 210, p: 2, c: 18, f: 0, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Double beef burger", cal: 720, p: 42, c: 38, f: 44, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Fish & chips", cal: 1240, p: 58, c: 128, f: 52, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Fried chicken — per piece (~150g)", cal: 435, p: 33, c: 18, f: 26, unit: "serving", servingG: 150 },
  { cat: "Dirty", name: "Gin (44ml shot)", cal: 97, p: 0, c: 0, f: 0, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Ice cream — per scoop (~100g)", cal: 207, p: 3.5, c: 24, f: 11, unit: "serving", servingG: 100 },
  { cat: "Dirty", name: "Pizza — per slice (~120g)", cal: 330, p: 13, c: 40, f: 13, unit: "serving", servingG: 120 },
  { cat: "Dirty", name: "Potato chips — standard bag (35g)", cal: 188, p: 2.5, c: 19, f: 12, unit: "serving", servingG: 35 },
  { cat: "Dirty", name: "Steak & ale pie", cal: 1110, p: 34, c: 105, f: 58, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Whisky (25ml)", cal: 55, p: 0, c: 0, f: 0, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Wine — red (175ml glass)", cal: 130, p: 0.1, c: 4, f: 0, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Cheat meal — mild", cal: 1000, p: 30, c: 100, f: 48, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Cheat meal — moderate", cal: 1500, p: 35, c: 145, f: 68, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Cheat meal — nuclear", cal: 2000, p: 40, c: 195, f: 95, unit: "serving", servingG: 1 },
  { cat: "Dirty", name: "Fries — medium serving", cal: 530, p: 6, c: 68, f: 26, unit: "serving", servingG: 200 },
  { cat: "Dirty", name: "Dark chocolate — 85%", cal: 598, p: 7, c: 20, f: 50, unit: "g" },
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

const TIGHT = 0.05;  // ±5% = green
const LOOSE = 0.10;  // ±10% = yellow, beyond = red

function getStatus(val, target) {
  const ratio = val / target;
  const dev = Math.abs(ratio - 1);
  if (dev <= TIGHT) return "hit";
  if (dev <= LOOSE) return "warn";
  return "over";
}

const STATUS_COLOR = { hit: "#22c55e", warn: "#f59e0b", over: "#ef4444" };

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
  const used = Math.min((totals.cal / target.cal) * 100, 100);
  const calStatus = getStatus(totals.cal, target.cal);
  const barColor = totals.cal === 0 ? "#555" : STATUS_COLOR[calStatus];
  const rem = target.cal - totals.cal;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: 26, color: "#22c55e", lineHeight: 1 }}>
            {Math.round(totals.cal)}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginLeft: 4 }}>/ {target.cal} kcal</span>
        </div>
        <span style={{ color: "#22c55e", fontWeight: 600, fontSize: 12 }}>
          {totals.cal === 0 ? `${target.cal} remaining` :
           calStatus === "hit" ? "✓ On target" :
           calStatus === "over" ? `+${Math.round(totals.cal - target.cal)} over` :
           `${Math.round(rem)} remaining`}
        </span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 6, height: 12, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pPct}%`, background: C.p }} />
        <div style={{ position: "absolute", left: `${pPct}%`, top: 0, height: "100%", width: `${cPct}%`, background: C.c }} />
        <div style={{ position: "absolute", left: `${pPct+cPct}%`, top: 0, height: "100%", width: `${fPct}%`, background: C.f }} />
        <div style={{ position: "absolute", left: `${Math.min((1/(1+TIGHT))*100,100)}%`, top: 0, height: "100%", width: 2, background: "rgba(255,255,255,0.4)" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
        {[["P", totals.p, target.p], ["C", totals.c, target.c], ["F", totals.f, target.f]].map(([l, val, tgt]) => (
          <span key={l} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "4px 11px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {l} {Math.round(val)}<span style={{ fontWeight: 400, opacity: 0.6 }}>/{tgt}g</span>
          </span>
        ))}
        <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{Math.round(used)}%</span>
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

function SummaryCard({ totals, target, onReset, onEdit, onClearAll }) {
  const items = [
    { label: "Calories", val: Math.round(totals.cal), tgt: target.cal, unit: "kcal", dot: "#6366f1" },
    { label: "Protein",  val: Math.round(totals.p),   tgt: target.p,   unit: "g",    dot: "#3b82f6" },
    { label: "Carbs",    val: Math.round(totals.c),   tgt: target.c,   unit: "g",    dot: "#f59e0b" },
    { label: "Fat",      val: Math.round(totals.f),   tgt: target.f,   unit: "g",    dot: "#10b981" },
  ];
  const score = items.filter(i => getStatus(i.val, i.tgt) === "hit").length;

  return (
    <div style={{ margin: "12px 12px 90px" }}>
      <div style={{ background: "#fafaf9", borderBottom: "0.5px solid #e5e5e5", borderRadius: "12px 12px 0 0", padding: "16px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#9a9a9a", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Day Complete</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", marginTop: 2 }}>
            {score === 4 ? "🎯 Perfect day" : score >= 3 ? "💪 Strong day" : score >= 2 ? "📊 Decent day" : "📉 Off today"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#1a1a1a", lineHeight: 1 }}>{score}<span style={{ fontSize: 16, color: "#aaa" }}>/4</span></div>
          <div style={{ fontSize: 11, color: "#aaa" }}>targets hit</div>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderTop: "none" }}>
        {items.map(({ label, val, tgt, unit, dot }, i) => {
          const s = getStatus(val, tgt);
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
                    background: s === "hit" ? "#f0fdf4" : s === "warn" ? "#fffbeb" : "#fef2f2",
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
            <div key={entry.id} style={{ padding: "10px 14px", borderTop: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.food.name}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
                  {entry.food.unit === "serving" ? `${entry.qty} serving${entry.qty !== 1 ? "s" : ""}` : `${entry.qty}g`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, fontSize: 11, alignItems: "center", flexShrink: 0 }}>
                <span style={{ background: "#f0f7ff", color: C.p, padding: "2px 6px", borderRadius: 6, fontWeight: 600 }}>{entry.macros.p}p</span>
                <span style={{ background: "#fffbeb", color: "#b45309", padding: "2px 6px", borderRadius: 6, fontWeight: 600 }}>{entry.macros.c}c</span>
                <span style={{ background: "#f0fdf4", color: "#059669", padding: "2px 6px", borderRadius: 6, fontWeight: 600 }}>{entry.macros.f}f</span>
                <span style={{ color: "#555", fontWeight: 700, fontSize: 12, minWidth: 42, textAlign: "right" }}>{entry.macros.cal}<span style={{ fontSize: 10, fontWeight: 400, color: "#aaa" }}>k</span></span>
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
              const score = [totals.cal, totals.p, totals.c, totals.f]
                .filter((v, i) => Math.abs(v / [target.cal, target.p, target.c, target.f][i] - 1) <= 0.05).length;
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
