import { useState } from "react";
import MacroTracker from "./MacroTracker.jsx";
import FoodLibrary from "./FoodLibrary.jsx";

export default function App() {
  const [view, setView] = useState("tracker");

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", minHeight: "100vh", background: "#f8f8f8" }}>
      <nav style={{
        display: "flex", background: "#fff", borderBottom: "1px solid #e5e5e5",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {[["tracker", "📊 Tracker"], ["library", "📚 Library"]].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)}
            style={{
              flex: 1, padding: "13px 0", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, background: "transparent",
              color: view === key ? "#1a1a1a" : "#aaa",
              borderBottom: view === key ? "2px solid #1a1a1a" : "2px solid transparent",
            }}>
            {label}
          </button>
        ))}
      </nav>

      {view === "tracker" ? <MacroTracker /> : <FoodLibrary />}
    </div>
  );
}
