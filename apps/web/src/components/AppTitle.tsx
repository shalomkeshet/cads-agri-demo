import "./AppTitle.css";

export default function AppTitle() {
  return (
    <header className="app-title-wrap">
      {/* ✅ row 1: logo + main title centered together */}
      <div className="app-title-top">
        <img
          src="/cads-agri-icon.svg"
          alt="CADS-Agri logo"
          className="app-title-logo"
        />

        <div className="app-title-main">CADS-Agri</div>
      </div>

      {/* ✅ row 2: subtitle centered under the entire group */}
      <div className="app-title-sub">
        (Confidence-Based Agricultural Decision System)
      </div>
    </header>
  );
}
