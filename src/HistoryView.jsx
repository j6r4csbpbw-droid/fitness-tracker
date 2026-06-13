import { useState } from "react";
import { AddModal } from "./MacroTracker.jsx";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_ABBR = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const TIGHT = 0.05;
const LOOSE = 0.10;
const GYM_TARGETS  = { cal: 2850, p: 180, c: 340, f: 94 };
const REST_TARGETS = { cal: 2550, p: 180, c: 255, f: 85 };
const MC = { p: "#3b82f6", c: "#b45309", f: "#059669" };

function statusColor(val, tgt) {
  if (!tgt) return "#22c55e";
  const dev = Math.abs(val / tgt - 1);
  if (dev <= TIGHT) return "#22c55e";
  if (dev <= LOOSE) return "#f59e0b";
  return "#ef4444";
}

function daysInMonthCount(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function loadDayMap(year, month) {
  const prefix = `day_${year}-${String(month + 1).padStart(2, "0")}`;
  const map = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      try { map[k.slice(4)] = JSON.parse(localStorage.getItem(k)); } catch { /* skip */ }
    }
  }
  return map;
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

function exportData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) data[k] = localStorage.getItem(k);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `eat-backup-${new Date().toLocaleDateString("en-CA")}.json`;
  localStorage.setItem("last_export", new Date().toLocaleDateString("en-CA"));
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      for (const [k, v] of Object.entries(data)) {
        localStorage.setItem(k, v);
      }
      window.location.reload();
    } catch {
      alert("Import failed — invalid backup file.");
    }
  };
  reader.readAsText(file);
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

function TargetBlock({ label, targets, borderBottom }) {
  return (
    <div style={{ background: "#e8edf5", borderBottom, padding: "8px 12px 7px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#4a6fa5", letterSpacing: 0.8, marginBottom: 3, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e3a5f" }}>{targets.cal} kcal</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: MC.p }}>P {targets.p}g</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: MC.c }}>C {targets.c}g</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: MC.f }}>F {targets.f}g</span>
      </div>
    </div>
  );
}

function DayRow({ dateStr, data, onEdit, onDelete }) {
  const { isGym, targets, totals } = data;
  const calColor = statusColor(Math.round(totals.cal), targets.cal);
  return (
    <div style={{ padding: "8px 12px", background: "#fff", borderBottom: "0.5px solid #f0f0f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{fmtDate(dateStr)}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
            background: isGym ? "#dbeafe" : "#f3f4f6", color: isGym ? "#1d4ed8" : "#6b7280" }}>
            {isGym ? "Gym" : "Rest"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={onEdit}
            style={{ border: "none", background: "none", cursor: "pointer", padding: "4px 6px", display: "flex", alignItems: "center" }}>
            <PencilIcon />
          </button>
          <button onClick={onDelete}
            style={{ border: "none", background: "none", cursor: "pointer", padding: "4px 6px", display: "flex", alignItems: "center" }}>
            <TrashIcon />
          </button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: calColor }}>
          {Math.round(totals.cal)}/{targets.cal} kcal
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: MC.p }}>P {Math.round(totals.p)}g</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: MC.c }}>C {Math.round(totals.c)}g</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: MC.f }}>F {Math.round(totals.f)}g</span>
      </div>
    </div>
  );
}

function EditDayModal({ dateStr, dayData, onSave, onClose }) {
  const [entries, setEntries] = useState(dayData.entries || []);
  const [isGym, setIsGym] = useState(dayData.isGym ?? true);
  const [showAddFood, setShowAddFood] = useState(false);

  const totals = {
    cal: entries.reduce((a, e) => a + e.macros.cal, 0),
    p:   entries.reduce((a, e) => a + e.macros.p, 0),
    c:   entries.reduce((a, e) => a + e.macros.c, 0),
    f:   entries.reduce((a, e) => a + e.macros.f, 0),
  };

  function handleSave() {
    const tgt = isGym ? GYM_TARGETS : REST_TARGETS;
    const score = [
      [totals.cal, tgt.cal], [totals.p, tgt.p], [totals.c, tgt.c], [totals.f, tgt.f],
    ].filter(([v, t]) => Math.abs(v / t - 1) <= TIGHT).length;
    const updated = { ...dayData, isGym, targets: tgt, totals, score, entries };
    localStorage.setItem(`day_${dateStr}`, JSON.stringify(updated));
    onSave(updated);
    onClose();
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 98,
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 500,
          height: "85vh", display: "flex", flexDirection: "column", padding: "20px 16px 24px",
          boxSizing: "border-box", overflow: "hidden" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>Edit {fmtDate(dateStr)}</div>
              <div style={{ display: "flex", background: "#f0f0f0", borderRadius: 16, padding: 2, gap: 1, marginTop: 6 }}>
                {[["gym", "🏋️ Gym"], ["rest", "🛋️ Rest"]].map(([key, label]) => (
                  <button key={key} onClick={() => setIsGym(key === "gym")}
                    style={{ padding: "4px 10px", borderRadius: 13, border: "none", cursor: "pointer",
                      fontSize: 11, fontWeight: 600,
                      background: (isGym ? "gym" : "rest") === key ? "#1a1a1a" : "transparent",
                      color: (isGym ? "gym" : "rest") === key ? "#fff" : "#888" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={onClose}
              style={{ border: "none", background: "#f0f0f0", borderRadius: 20, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#555" }}>
              ×
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 12, padding: "8px 10px", background: "#f8f8f8", borderRadius: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: statusColor(Math.round(totals.cal), (isGym ? GYM_TARGETS : REST_TARGETS).cal) }}>
              {Math.round(totals.cal)} kcal
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: MC.p }}>P {Math.round(totals.p)}g</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: MC.c }}>C {Math.round(totals.c)}g</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: MC.f }}>F {Math.round(totals.f)}g</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", minHeight: 0, marginBottom: 12 }}>
            {entries.length === 0 && (
              <div style={{ textAlign: "center", color: "#ccc", fontSize: 13, padding: "24px 0" }}>
                No entries — tap "+ Add Food" below
              </div>
            )}
            {entries.map((e, i) => (
              <div key={e.id ?? i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 10px", borderRadius: 8, marginBottom: 2, background: "#fafafa", border: "1px solid #f0f0f0" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{e.food.name}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>
                    {e.food.unit === "serving"
                      ? `${e.qty} serving${e.qty !== 1 ? "s" : ""}`
                      : `${e.qty}g`}
                    {" · "}{e.macros.cal} kcal
                  </div>
                </div>
                <button onClick={() => setEntries(entries.filter((_, j) => j !== i))}
                  style={{ border: "none", background: "none", cursor: "pointer", padding: "4px 6px", display: "flex", alignItems: "center" }}>
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={() => setShowAddFood(true)}
              style={{ flex: 1, padding: "12px", background: "#f0f0f0", color: "#333", border: "none",
                borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Add Food
            </button>
            <button onClick={handleSave}
              style={{ flex: 1, padding: "12px", background: "#1a1a1a", color: "#fff", border: "none",
                borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
      {showAddFood && (
        <AddModal
          onAdd={(food, qty, macros) => setEntries(prev => [...prev, { id: Date.now(), food, qty, macros }])}
          onClose={() => setShowAddFood(false)}
        />
      )}
    </>
  );
}

function ThisMonthTab() {
  const now = new Date();
  const [year, setYear]       = useState(now.getFullYear());
  const [month, setMonth]     = useState(now.getMonth());
  const [dayMap, setDayMap]   = useState(() => loadDayMap(now.getFullYear(), now.getMonth()));
  const [editingDay, setEditingDay] = useState(null);

  const isCurrent = year === now.getFullYear() && month === now.getMonth();
  const dim = daysInMonthCount(year, month);
  const sortedDates = Object.keys(dayMap).sort((a, b) => b.localeCompare(a));

  function navigate(dir) {
    let m = month + dir, y = year;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    setMonth(m); setYear(y);
    setDayMap(loadDayMap(y, m));
  }

  function handleDelete(dateStr) {
    localStorage.removeItem(`day_${dateStr}`);
    setDayMap(prev => { const next = { ...prev }; delete next[dateStr]; return next; });
    window.dispatchEvent(new CustomEvent("tracker-sync", { detail: { type: "delete", dateStr } }));
  }

  function handleSave(dateStr, updated) {
    setDayMap(prev => ({ ...prev, [dateStr]: updated }));
    window.dispatchEvent(new CustomEvent("tracker-sync", { detail: { type: "edit", dateStr, updated } }));
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
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{sortedDates.length} / {dim} days logged</div>
        </div>
        <button onClick={() => navigate(1)} disabled={isCurrent}
          style={{ border: "none", background: "none", cursor: isCurrent ? "default" : "pointer", fontSize: 24,
            color: isCurrent ? "#ddd" : "#1a1a1a", padding: "0 12px", lineHeight: 1 }}>
          ›
        </button>
      </div>

      <TargetBlock label="TARGET (GYM)"  targets={GYM_TARGETS}  borderBottom="0.5px solid #d0d8e8" />
      <TargetBlock label="TARGET (REST)" targets={REST_TARGETS} borderBottom="2px solid #c7d7f0" />

      {sortedDates.length === 0 ? (
        <div style={{ padding: "40px 16px", textAlign: "center", color: "#ccc", fontSize: 13 }}>
          No days logged for {MONTH_NAMES[month]} {year}
        </div>
      ) : (
        sortedDates.map(ds => (
          <DayRow
            key={ds}
            dateStr={ds}
            data={dayMap[ds]}
            onEdit={() => setEditingDay(ds)}
            onDelete={() => handleDelete(ds)}
          />
        ))
      )}

      {editingDay && (
        <EditDayModal
          dateStr={editingDay}
          dayData={dayMap[editingDay]}
          onSave={(updated) => handleSave(editingDay, updated)}
          onClose={() => setEditingDay(null)}
        />
      )}
    </div>
  );
}

function MonthlyTab() {
  const monthKeys = readMonthKeys();

  return (
    <div>
      <TargetBlock label="TARGET (GYM — DAILY REF)" targets={GYM_TARGETS} borderBottom="2px solid #c7d7f0" />

      {monthKeys.length === 0 ? (
        <div style={{ padding: "40px 16px", textAlign: "center", color: "#ccc", fontSize: 13 }}>
          No monthly data yet — completed months appear here
        </div>
      ) : (
        monthKeys.map(ym => {
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
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: calCol }}>
                  {Math.round(avgCal)}/{targets.cal} kcal avg
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: MC.p }}>P {Math.round(avgP)}g</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: MC.c }}>C {Math.round(avgC)}g</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: MC.f }}>F {Math.round(avgF)}g</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default function HistoryView() {
  const [subTab, setSubTab] = useState("thisMonth");
  const [lastExport, setLastExport] = useState(() => localStorage.getItem("last_export"));
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
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textAlign: "center", marginTop: 8 }}>
          {lastExport ? `Last backup: ${lastExport}` : "No backup saved yet"}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button onClick={() => { exportData(); setLastExport(new Date().toLocaleDateString("en-CA")); }}
            style={{ flex: 1, padding: "7px 0", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
            ↓ Export backup
          </button>
          <label style={{ flex: 1, padding: "7px 0", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)",
            textAlign: "center", display: "block" }}>
            ↑ Import backup
            <input type="file" accept=".json"
              onChange={e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ""; }}
              style={{ display: "none" }} />
          </label>
        </div>
      </div>
      {subTab === "thisMonth" ? <ThisMonthTab /> : <MonthlyTab />}
    </div>
  );
}
