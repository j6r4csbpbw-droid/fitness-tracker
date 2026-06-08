import { useState, useEffect } from "react";
import MacroTracker from "./MacroTracker.jsx";
import FoodLibrary from "./FoodLibrary.jsx";
import HistoryView from "./HistoryView.jsx";

function performMonthRollup() {
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const dayKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && /^day_\d{4}-\d{2}-\d{2}$/.test(k)) dayKeys.push(k.slice(4));
  }

  const byMonth = {};
  for (const ds of dayKeys) {
    const ym = ds.slice(0, 7);
    if (ym === currentYM) continue;
    if (!byMonth[ym]) byMonth[ym] = [];
    byMonth[ym].push(ds);
  }

  for (const [ym, dates] of Object.entries(byMonth)) {
    const existing = localStorage.getItem(`month_${ym}`);
    if (existing) continue;

    const [y, m] = ym.split("-").map(Number);
    const dim = new Date(y, m, 0).getDate();

    let sumCal = 0, sumP = 0, sumC = 0, sumF = 0, count = 0;
    let gymTargets = null;

    for (const ds of dates) {
      try {
        const d = JSON.parse(localStorage.getItem(`day_${ds}`));
        if (!d) continue;
        sumCal += d.totals.cal;
        sumP   += d.totals.p;
        sumC   += d.totals.c;
        sumF   += d.totals.f;
        count++;
        if (!gymTargets && d.targets) gymTargets = d.targets;
      } catch { /* skip bad entries */ }
    }

    if (count === 0) continue;

    const targets = gymTargets || { cal: 2850, p: 180, c: 340, f: 94 };
    localStorage.setItem(`month_${ym}`, JSON.stringify({
      year: y, month: m - 1, daysInMonth: dim,
      daysLogged: count,
      avgCal: sumCal / count,
      avgP:   sumP   / count,
      avgC:   sumC   / count,
      avgF:   sumF   / count,
      targets,
    }));
  }
}

export default function App() {
  const [view, setView] = useState("tracker");

  useEffect(() => {
    performMonthRollup();
  }, []);

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", minHeight: "100vh", background: "#f8f8f8" }}>
      <nav style={{
        display: "flex", background: "#fff", borderBottom: "1px solid #e5e5e5",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {[["tracker", "📊 Tracker"], ["library", "📚 Library"], ["history", "📅 History"]].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)}
            style={{
              flex: 1, padding: "13px 0", border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 700, background: "transparent",
              color: view === key ? "#1a1a1a" : "#aaa",
              borderBottom: view === key ? "2px solid #1a1a1a" : "2px solid transparent",
            }}>
            {label}
          </button>
        ))}
      </nav>

      {view === "tracker" ? <MacroTracker /> : view === "library" ? <FoodLibrary /> : <HistoryView />}
    </div>
  );
}
