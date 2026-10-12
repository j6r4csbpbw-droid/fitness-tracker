import { useState } from "react";
import { FOODS } from "./MacroTracker.jsx";

const CATEGORY_META = [
  { cat: "Meat",       label: "Meat",       emoji: "🥩", note: "Per 100g raw · macros reflect cooked yield from same raw weight" },
  { cat: "Seafood",    label: "Seafood",     emoji: "🐟", note: "Per 100g raw · macros reflect cooked yield from same raw weight. Canned items per 100g drained." },
  { cat: "Produce",    label: "Produce",     emoji: "🥦", note: "Per 100g. Fresh items are raw weight. Canned and frozen items are as consumed." },
  { cat: "Dairy",      label: "Dairy",       emoji: "🥚", note: "Per 100g as consumed" },
  { cat: "Grains",     label: "Grains",      emoji: "🍚", note: "Rice, pasta, noodles, quinoa, lentils: per 100g dry unless stated. Bread: per slice (~35g). Rice cakes: per cake (~9g)." },
  { cat: "Condiments", label: "Condiments",  emoji: "🫙", note: "Liquid items per tablespoon (15ml). Butter per 10g knob. Peanut butter per 100g." },
  { cat: "Meals",      label: "Meals",       emoji: "🍽️", note: "Per full serving" },
  { cat: "Dirty",      label: "Dirty",       emoji: "🍕", note: "Per unit as described" },
];

const PCT_COLORS = { p: "#3b82f6", c: "#f59e0b", f: "#10b981" };

export default function FoodLibrary() {
  const [active, setActive] = useState("Meat");
  const [sort, setSort] = useState("name");

  const meta = CATEGORY_META.find(m => m.cat === active);
  const items = FOODS.filter(f => f.cat === active);
  const sorted = [...items].sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name) : b[sort] - a[sort]
  );

  const MiniBar = ({ p, c, f }) => {
    const total = p * 4 + c * 4 + f * 9;
    if (total === 0) return <span style={{ fontSize: 11, color: "#ccc" }}>—</span>;
    return (
      <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", width: 60 }}>
        <div style={{ width: `${(p*4/total)*100}%`, background: PCT_COLORS.p }} />
        <div style={{ width: `${(c*4/total)*100}%`, background: PCT_COLORS.c }} />
        <div style={{ width: `${(f*9/total)*100}%`, background: PCT_COLORS.f }} />
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "20px 16px", color: "#1a1a1a" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Food Library</h2>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>See category note for weight and cook basis.</p>

      <div style={{ display: "flex", gap: 14, fontSize: 12, marginBottom: 16 }}>
        {[["#3b82f6", "P = Protein"], ["#f59e0b", "C = Carbs"], ["#10b981", "F = Fat"]].map(([col, lbl]) => (
          <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: col }} />
            <span>{lbl}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
        {CATEGORY_META.map(m => (
          <button key={m.cat} onClick={() => { setActive(m.cat); setSort("name"); }}
            style={{ whiteSpace: "nowrap", padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600,
              background: active === m.cat ? "#1a1a1a" : "#f0f0f0",
              color: active === m.cat ? "#fff" : "#444" }}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>{meta.note}</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#888" }}>Sort:</span>
        {[["name", "Name"], ["p", "Protein"], ["cal", "Calories"], ["c", "Carbs"], ["f", "Fat"]].map(([key, lbl]) => (
          <button key={key} onClick={() => setSort(key)}
            style={{ padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: sort === key ? 700 : 500,
              background: sort === key ? "#3b82f6" : "#f0f0f0",
              color: sort === key ? "#fff" : "#444" }}>
            {lbl}
          </button>
        ))}
      </div>

      <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #eee" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8f8f8" }}>
              {[["left", "#555", "Food"], ["center", "#555", "kcal"], ["center", "#3b82f6", "P"], ["center", "#b45309", "C"], ["center", "#059669", "F"], ["center", "#888", "Split"]].map(([align, color, label]) => (
                <th key={label} style={{ padding: "9px 10px", textAlign: align, fontWeight: 700, fontSize: 12, color, borderBottom: "1px solid #eee" }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, i) => (
              <tr key={item.name} style={{ borderBottom: i < sorted.length - 1 ? "1px solid #f0f0f0" : "none", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                <td style={{ padding: "9px 10px", fontWeight: 500 }}>{item.name}</td>
                <td style={{ padding: "9px 10px", textAlign: "center", color: "#555" }}>{item.cal}</td>
                <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: 600, color: "#3b82f6" }}>{item.p}g</td>
                <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: 600, color: "#b45309" }}>{item.c}g</td>
                <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: 600, color: "#059669" }}>{item.f}g</td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}><MiniBar p={item.p} c={item.c} f={item.f} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>Sources: USDA FoodData Central · McCance & Widdowson (UK food composition tables) · Brand nutritional data where applicable</p>
    </div>
  );
}
