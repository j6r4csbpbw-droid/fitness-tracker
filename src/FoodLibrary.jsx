import { useState } from "react";

const categories = [
  {
    id: "meat", label: "Meat", emoji: "🥩",
    note: "Per 100g raw · macros reflect cooked yield from same raw weight",
    items: [
      { name: "Chicken breast — skinless", cal: 151, p: 28, c: 0, f: 3.5 },
      { name: "Chicken thigh — skinless", cal: 161, p: 24, c: 0, f: 7 },
      { name: "Chicken thigh — skin-on", cal: 209, p: 22, c: 0, f: 14 },
      { name: "Chicken drumstick — skinless", cal: 148, p: 24, c: 0, f: 5.5 },
      { name: "Chicken drumstick — skin-on", cal: 192, p: 22, c: 0, f: 12 },
      { name: "Turkey mince — 5% fat", cal: 120, p: 21, c: 0, f: 4 },
      { name: "Beef mince — 5% fat", cal: 128, p: 20, c: 0, f: 5 },
      { name: "Beef mince — 20% fat", cal: 196, p: 17, c: 0, f: 14 },
      { name: "Sirloin steak", cal: 193, p: 25, c: 0, f: 10 },
      { name: "Rump steak", cal: 166, p: 26, c: 0, f: 6.5 },
      { name: "Pork loin — lean", cal: 133, p: 25, c: 0, f: 3.5 },
      { name: "Pork mince — 5% fat", cal: 122, p: 21, c: 0, f: 4 },
      { name: "Pork sausages", cal: 268, p: 14, c: 8, f: 21 },
      { name: "Lamb chops", cal: 218, p: 22, c: 0, f: 14 },
      { name: "Lamb mince — 20% fat", cal: 216, p: 16, c: 0, f: 16.5 },
    ]
  },
  {
    id: "seafood", label: "Seafood", emoji: "🐟",
    note: "Per 100g raw · macros reflect cooked yield from same raw weight. Canned items per 100g drained.",
    items: [
      { name: "Cod", cal: 83, p: 18, c: 0, f: 0.9 },
      { name: "Cod — breaded", cal: 197, p: 14, c: 14, f: 9 },
      { name: "Haddock", cal: 87, p: 19, c: 0, f: 0.8 },
      { name: "Mackerel", cal: 189, p: 20, c: 0, f: 12 },
      { name: "Prawns", cal: 85, p: 18, c: 0, f: 1 },
      { name: "Salmon", cal: 182, p: 22, c: 0, f: 10 },
      { name: "Sardines — canned", cal: 185, p: 22, c: 0, f: 11 },
      { name: "Sea bass", cal: 93, p: 18, c: 0, f: 2 },
      { name: "Trout", cal: 155, p: 22, c: 0, f: 7 },
      { name: "Tuna — canned", cal: 189, p: 27, c: 0, f: 9 },
    ]
  },
  {
    id: "produce", label: "Produce", emoji: "🥦",
    note: "Per 100g. Fresh items are raw weight. Canned and frozen items are as consumed.",
    items: [
      { name: "Avocado", cal: 160, p: 2, c: 9, f: 15 },
      { name: "Bell pepper", cal: 31, p: 1, c: 6, f: 0.3 },
      { name: "Black beans — canned", cal: 91, p: 6, c: 16, f: 0.4 },
      { name: "Blackberries", cal: 43, p: 1.4, c: 10, f: 0.5 },
      { name: "Blueberries", cal: 57, p: 0.7, c: 14, f: 0.3 },
      { name: "Broccoli", cal: 34, p: 2.8, c: 7, f: 0.4 },
      { name: "Cauliflower", cal: 25, p: 1.9, c: 5, f: 0.3 },
      { name: "Chickpeas — canned", cal: 139, p: 8, c: 23, f: 2.6 },
      { name: "Courgette", cal: 17, p: 1.2, c: 3.1, f: 0.3 },
      { name: "Cucumber", cal: 15, p: 0.7, c: 3.6, f: 0.1 },
      { name: "Edamame — shelled", cal: 122, p: 11, c: 10, f: 5 },
      { name: "Frozen peas", cal: 77, p: 5, c: 14, f: 0.4 },
      { name: "Kale", cal: 49, p: 4.3, c: 9, f: 0.9 },
      { name: "Kidney beans — canned", cal: 100, p: 7, c: 18, f: 0.5 },
      { name: "Red lentils (per 60g dry)", cal: 211, p: 14, c: 38, f: 0.7 },
      { name: "Potato", cal: 77, p: 2, c: 17, f: 0.1 },
      { name: "Spinach — raw", cal: 23, p: 2.9, c: 3.6, f: 0.4 },
      { name: "Sweet potato", cal: 86, p: 1.6, c: 20, f: 0.1 },
      { name: "Tomatoes — canned", cal: 16, p: 1, c: 3, f: 0.2 },
      { name: "Tomatoes — whole", cal: 18, p: 0.9, c: 3.5, f: 0.2 },
    ]
  },
  {
    id: "dairy", label: "Dairy", emoji: "🥚",
    note: "Per 100g as consumed",
    items: [
      { name: "Egg — cooked", cal: 155, p: 13, c: 1.1, f: 11 },
      { name: "Yogurt — Greek, 0% fat", cal: 57, p: 10, c: 4, f: 0.3 },
      { name: "Cottage cheese — low fat", cal: 77, p: 13, c: 3.5, f: 1 },
      { name: "Cheese — Cheddar", cal: 403, p: 25, c: 0.1, f: 34 },
      { name: "Cheese — Mozzarella", cal: 280, p: 28, c: 3.1, f: 17 },
      { name: "Cheese — Parmigiano Reggiano", cal: 431, p: 38, c: 0, f: 29 },
      { name: "Cheese — Pecorino Romano", cal: 387, p: 32, c: 0, f: 26 },
      { name: "Soy milk — unsweetened", cal: 33, p: 3.3, c: 1.8, f: 1.8 },
    ]
  },
  {
    id: "grains", label: "Grains", emoji: "🍚",
    note: "Rice, pasta, noodles, quinoa, lentils: per 100g dry unless stated. Bread: per slice (~35g). Rice cakes: per cake (~9g).",
    items: [
      { name: "White rice", cal: 365, p: 7, c: 80, f: 0.7 },
      { name: "Pasta — regular", cal: 371, p: 13, c: 75, f: 1.5 },
      { name: "Pasta — wholemeal", cal: 348, p: 14, c: 68, f: 2.5 },
      { name: "Egg noodles", cal: 385, p: 13, c: 72, f: 6 },
      { name: "Quinoa (per 60g dry)", cal: 221, p: 8, c: 38, f: 3.5 },
      { name: "Bread — sourdough (per slice)", cal: 90, p: 3, c: 17, f: 0.7 },
      { name: "Bread — wholemeal (per slice)", cal: 81, p: 3.5, c: 14, f: 1.1 },
      { name: "Rice cake (per cake)", cal: 35, p: 0.7, c: 7.3, f: 0.3 },
    ]
  },
  {
    id: "condiments", label: "Condiments", emoji: "🫙",
    note: "Liquid items per tablespoon (15ml). Butter per 10g knob. Peanut butter per 100g.",
    items: [
      { name: "Olive oil (per tbsp)", cal: 119, p: 0, c: 0, f: 13.5 },
      { name: "Sesame oil (per tbsp)", cal: 119, p: 0, c: 0, f: 13.5 },
      { name: "Soy sauce — light (per tbsp)", cal: 8, p: 1.2, c: 0.8, f: 0 },
      { name: "Hot sauce (per tbsp)", cal: 2, p: 0.1, c: 0.2, f: 0.1 },
      { name: "Honey (per tbsp)", cal: 46, p: 0, c: 12, f: 0 },
      { name: "Nando's marinade (per tbsp)", cal: 14, p: 0.2, c: 2.7, f: 0.2 },
      { name: "Butter (per 10g)", cal: 72, p: 0.1, c: 0, f: 8.1 },
      { name: "Peanut butter — natural", cal: 598, p: 25, c: 20, f: 50 },
    ]
  },
  {
    id: "meals", label: "Meals", emoji: "🍽️",
    note: "Per full serving",
    items: [
      { name: "Assenhaims — chicken meal large", cal: 850, p: 65, c: 72, f: 28 },
      { name: "Mediterranean chicken wrap", cal: 480, p: 32, c: 42, f: 18 },
      { name: "Pizza Union — pepperoni (whole 12\")", cal: 980, p: 42, c: 100, f: 42 },
      { name: "Roast & Greens — chicken box large", cal: 620, p: 48, c: 38, f: 28 },
    ]
  },
  {
    id: "dirty", label: "Dirty", emoji: "🍕",
    note: "Per unit as described",
    items: [
      { name: "Pizza — per slice (~120g)", cal: 330, p: 13, c: 40, f: 13 },
      { name: "Fish & chips", cal: 1240, p: 58, c: 128, f: 52 },
      { name: "Double beef burger", cal: 720, p: 42, c: 38, f: 44 },
      { name: "Steak & ale pie", cal: 1110, p: 34, c: 105, f: 58 },
      { name: "Fried chicken — per piece (~150g)", cal: 435, p: 33, c: 18, f: 26 },
      { name: "Potato chips — standard bag (35g)", cal: 188, p: 2.5, c: 19, f: 12 },
      { name: "Ice cream — per scoop (~100g)", cal: 207, p: 3.5, c: 24, f: 11 },
      { name: "Beer — stout (pint)", cal: 210, p: 2, c: 18, f: 0 },
      { name: "Beer — ale (pint)", cal: 196, p: 1.5, c: 15, f: 0 },
      { name: "Whisky (25ml)", cal: 55, p: 0, c: 0, f: 0 },
      { name: "Wine — red (175ml glass)", cal: 130, p: 0.1, c: 4, f: 0 },
      { name: "Gin (44ml shot)", cal: 97, p: 0, c: 0, f: 0 },
    ]
  },
];

const PCT_COLORS = { p: "#3b82f6", c: "#f59e0b", f: "#10b981" };

export default function FoodLibrary() {
  const [active, setActive] = useState("meat");
  const [sort, setSort] = useState("name");

  const cat = categories.find(c => c.id === active);
  const sorted = [...cat.items].sort((a, b) =>
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
        {categories.map(c => (
          <button key={c.id} onClick={() => { setActive(c.id); setSort("name"); }}
            style={{ whiteSpace: "nowrap", padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600,
              background: active === c.id ? "#1a1a1a" : "#f0f0f0",
              color: active === c.id ? "#fff" : "#444" }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>{cat.note}</p>

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
