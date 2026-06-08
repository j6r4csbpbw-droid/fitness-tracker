import { useState } from "react";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_ABBR = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const TIGHT = 0.05;
const LOOSE = 0.10;

function statusColor(val, tgt) {
  const dev = Math.abs(val / tgt - 1);
  if (dev <= TIGHT) return "#22c55e";
  if (dev <= LOOSE) return "#f59e0b";
  return "#ef4444";
}

function statusBg(col) {
  if (col === "#22c55e") return "#f0fdf4";
  if (col === "#f59e0b") return "#fffbeb";
  return "#fef2f2";
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function readDayKeys(year, month) {
  const prefix = `day_${year}-${String(month + 1).padStart(2, "0")}`;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) keys.push(k.slice(4));
  }
  return keys.sort((a, b) => b.localeCompare(a));
}

function readDay(dateStr) {
  try { return JSON.parse(localStorage.getItem(`day_${dateStr}`)); } catch { return null; }
}

function readMonthKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && /^month_\d{4}-\d{2}$/.test(k)) keys.push(k.slice(6));
  }
  return keys.sort((a, b) => b.localeCompare(a));
}

function readMonth(ym) {
  try { return JSON.parse(localStorage.getItem(`month_${ym}`)); } catch { return null; }
}

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${DAY_ABBR[dow]} ${d} ${SHORT_MONTHS[m - 1]}`;
}

function DayDetail({ dateStr, onBack }) {
  const data = readDay(dateStr);
  if (!data) return (
    <div style={{ padding: 32, textAlign: "center", color: "#ccc", fontSize: 13 }}>No data found.</div>
  );
  const { targets, totals, score, isGym } = data;
  const ITEMS = [
    { label: "Calories", val: Math.round(totals.cal), tgt: targets.cal, unit: "kcal" },
    { label: "Protein",  val: Math.round(totals.p),   tgt: targets.p,   unit: "g"    },
    { label: "Carbs",    val: Math.round(totals.c),   tgt: targets.c,   unit: "g"    },
    { label: "Fat",      val: Math.round(totals.f),   tgt: targets.f,   unit: "g"    },
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        <button onClick={onBack}
          style={{ border: "none", background: "none", cursor: "pointer", fontSize: 22, color: "#1a1a1a", padding: "0 6px 0 0", lineHeight: 1 }}>
          ‹
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{fmtDate(dateStr)}</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
          background: isGym ? "#dbeafe" : "#f3f4f6", color: isGym ? "#1d4ed8" : "#6b7280" }}>
          {isGym ? "Gym" : "Rest"}
        </span>
      </div>

      <div style={{ background: "#fafaf9", borderBottom: "0.5px solid #e5e5e5", padding: "16px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#9a9a9a", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Day Summary</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", marginTop: 2 }}>
            {score === 4 ? "🎯 Perfect day" : score >= 3 ? "💪 Strong day" : score >= 2 ? "📊 Decent day" : "📉 Off today"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#1a1a1a", lineHeight: 1 }}>
            {score}<span style={{ fontSize: 16, color: "#aaa" }}>/4</span>
          </div>
          <div style={{ fontSize: 11, color: "#aaa" }}>targets hit</div>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderTop: "none" }}>
        {ITEMS.map(({ label, val, tgt, unit }, i) => {
          const col = statusColor(val, tgt);
          const pct = Math.min((val / tgt) * 100, 100);
          const diff = val - tgt;
          return (
            <div key={label} style={{ padding: "12px 16px", borderBottom: i < ITEMS.length - 1 ? "1px solid #f5f5f5" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{val}{unit}</span>
                  <span style={{ fontSize: 11, color: "#bbb" }}>/ {tgt}{unit}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                    background: statusBg(col), color: col }}>
                    {Math.abs(diff / tgt) <= TIGHT ? "✓ Hit" : `${diff > 0 ? "+" : ""}${Math.round(diff)}${unit}`}
                  </span>
                </div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 4, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayRow({ dateStr, data, onClick }) {
  if (!data) return null;
  const { isGym, targets, totals } = data;
  const calCol = statusColor(Math.round(totals.cal), targets.cal);
  return (
    <div onClick={onClick}
      style={{ padding: "12px 16px", background: "#fff", borderBottom: "1px solid #f5f5f5", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{fmtDate(dateStr)}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
            background: isGym ? "#dbeafe" : "#f3f4f6", color: isGym ? "#1d4ed8" : "#6b7280" }}>
            {isGym ? "Gym" : "Rest"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: calCol }}>
            {Math.round(totals.cal)}/{targets.cal} kcal
          </span>
          {[["P", totals.p, targets.p], ["C", totals.c, targets.c], ["F", totals.f, targets.f]].map(([l, v, t]) => (
            <span key={l} style={{ fontSize: 11, color: "#888" }}>
              {l} {Math.round(v)}/{t}g
            </span>
          ))}
        </div>
      </div>
      <span style={{ fontSize: 18, color: "#ccc", flexShrink: 0 }}>›</span>
    </div>
  );
}

function ThisMonthTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  if (selectedDay) {
    return <DayDetail dateStr={selectedDay} onBack={() => setSelectedDay(null)} />;
  }

  const dim = daysInMonth(year, month);
  const dayKeys = readDayKeys(year, month);
  const isCurrent = year === now.getFullYear() && month === now.getMonth();

  function navigate(dir) {
    let m = month + dir, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", padding: "12px 8px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        <button onClick={() => navigate(-1)}
          style={{ border: "none", background: "none", cursor: "pointer", fontSize: 24, color: "#1a1a1a", padding: "0 12px", lineHeight: 1 }}>
          ‹
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{MONTH_NAMES[month]} {year}</div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{dayKeys.length} / {dim} days logged</div>
        </div>
        <button onClick={() => navigate(1)} disabled={isCurrent}
          style={{ border: "none", background: "none", cursor: isCurrent ? "default" : "pointer", fontSize: 24,
            color: isCurrent ? "#ddd" : "#1a1a1a", padding: "0 12px", lineHeight: 1 }}>
          ›
        </button>
      </div>

      <div>
        {dayKeys.length === 0 && (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "#ccc", fontSize: 13 }}>
            No days logged for {MONTH_NAMES[month]} {year}
          </div>
        )}
        {dayKeys.map(ds => (
          <DayRow key={ds} dateStr={ds} data={readDay(ds)} onClick={() => setSelectedDay(ds)} />
        ))}
      </div>
    </div>
  );
}

function MonthlyTab() {
  const monthKeys = readMonthKeys();

  if (monthKeys.length === 0) {
    return (
      <div style={{ padding: "40px 16px", textAlign: "center", color: "#ccc", fontSize: 13 }}>
        No monthly data yet — completed months appear here
      </div>
    );
  }

  return (
    <div>
      {monthKeys.map(ym => {
        const d = readMonth(ym);
        if (!d) return null;
        const { year, month, daysInMonth: dim, daysLogged, avgCal, avgP, avgC, avgF, targets } = d;
        const calCol = statusColor(avgCal, targets.cal);
        return (
          <div key={ym} style={{ padding: "14px 16px", background: "#fff", borderBottom: "1px solid #f5f5f5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{MONTH_NAMES[month]} {year}</span>
              <span style={{ fontSize: 12, color: "#aaa" }}>{daysLogged}/{dim} days</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: calCol }}>
                {Math.round(avgCal)}/{targets.cal} kcal avg
              </span>
              {[["P", avgP, targets.p], ["C", avgC, targets.c], ["F", avgF, targets.f]].map(([l, v, t]) => (
                <span key={l} style={{ fontSize: 11, color: "#888" }}>
                  {l} {Math.round(v)}/{t}g
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HistoryView() {
  const [subTab, setSubTab] = useState("thisMonth");
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f8f8f8" }}>
      <div style={{ background: "#1e3a5f", padding: "20px 16px 16px" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: 1, marginBottom: 14 }}>
          HISTORY
        </div>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: 3, gap: 2 }}>
          {[["thisMonth", "This Month"], ["monthly", "Monthly"]].map(([key, label]) => (
            <button key={key} onClick={() => setSubTab(key)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 700,
                background: subTab === key ? "#fff" : "transparent",
                color: subTab === key ? "#1a1a1a" : "rgba(255,255,255,0.6)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {subTab === "thisMonth" ? <ThisMonthTab /> : <MonthlyTab />}
    </div>
  );
}
