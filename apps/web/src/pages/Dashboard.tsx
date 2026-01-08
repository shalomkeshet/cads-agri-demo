import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import AppFooter from "../components/AppFooter";

function isLikelyUuid(v: string) {
  return /^[0-9a-f-]{0,36}$/i.test(v.trim());
}

/**
 * ✅ Tooltip bubble (hover + focus + click/tap support)
 *
 * - Desktop: hover works
 * - Mobile: tap the icon to toggle tooltip
 * - Accessibility: works with keyboard focus
 */
function TipBubble({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="tip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="tip-btn"
        aria-label="Help"
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>

      <span
        className={`tip-bubble ${open ? "tip-bubble-open" : ""}`}
        role="tooltip"
      >
        {text}
      </span>
    </span>
  );
}

export default function Dashboard() {
  const [zoneId, setZoneId] = useState("");

  const trimmed = zoneId.trim();

  const canOpen = useMemo(() => {
    if (!trimmed) return false;
    if (!isLikelyUuid(trimmed)) return false;
    return true;
  }, [trimmed]);

  return (
    <div className="dash-root">
      <main className="dash-card">
        {/* ✅ Put CADS-Agri title ABOVE Dashboard (inside Dashboard card) */}
        <div className="dash-app-title">
          <div className="dash-app-title-main">CADS-Agri</div>
          <div className="dash-app-title-sub">
            (Confidence-Based Agricultural Decision System)
          </div>
        </div>

        <div className="dash-card-title">Dashboard</div>
        <p className="dash-card-desc">
          Paste a Zone ID to open the timeline + recommendations view.
        </p>

        <div className="dash-form">
          {/* ✅ Label + Tooltip bubble icon */}
          <div className="dash-label-row">
            <label className="dash-label">Zone ID</label>
            <TipBubble text="A Zone ID uniquely identifies a farm zone. Copy it from Rover Upload → Zone Summary or from your DB seed." />
          </div>

          <input
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            placeholder="e.g. 22222222-2222-2222-2222-222222222222"
            className="dash-input"
            inputMode="text"
          />

          <div className="dash-actions">
            {canOpen ? (
              <Link className="dash-btn" to={`/zone/${trimmed}`}>
                Open Zone
              </Link>
            ) : (
              <button className="dash-btn dash-btn-disabled" disabled>
                Open Zone
              </button>
            )}

            <button
              className="dash-btn dash-btn-secondary"
              onClick={() => setZoneId("")}
              disabled={!trimmed}
              title="Clear"
              type="button"
            >
              Clear
            </button>
          </div>

          {!trimmed ? (
            <div className="dash-hint">
              Tip: copy a Zone ID from Rover Upload page or DB seed.
            </div>
          ) : !isLikelyUuid(trimmed) ? (
            <div className="dash-error">
              Zone ID looks invalid (only numbers, letters, and hyphens
              allowed).
            </div>
          ) : null}
        </div>
        {/* ✅ Footer */}
        <AppFooter />
      </main>
    </div>
  );
}
