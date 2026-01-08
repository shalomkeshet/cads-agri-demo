import "./AppFooter.css";

export default function AppFooter() {
  return (
    <footer className="app-footer">
      {/* ✅ Top Disclaimer block */}
      <div className="app-footer-disclaimer">
        <div className="app-footer-title">Demo Disclaimer:</div>
        <div className="app-footer-text">
          In this remote demonstration, pre-captured crop stress images are used
          in place of live rover input to simulate the Detect–Verify pipeline
          and showcase DCI computation and confidence-based recommendations.
        </div>
      </div>

      {/* ✅ Bottom aligned row-by-row credits */}
      <div className="app-footer-credits">
        <div className="app-footer-credits-left">
          <div className="app-footer-credits-line">
            Developed by Shalom Keshet
          </div>
          <div className="app-footer-credits-line">All rights reserved.</div>
        </div>

        <div className="app-footer-credits-right">
          <div className="app-footer-credits-line">RedHook Team</div>
          <div className="app-footer-credits-line">
            Presented at E-21, E-Cell, IIT Madras.
          </div>
        </div>
      </div>
    </footer>
  );
}
