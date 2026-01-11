import { useEffect, useMemo, useState } from "react";
import { upload as blobUpload } from "@vercel/blob/client";
import { ErrorBoundary } from "../components/ErrorBoundary";
import AppTitle from "../components/AppTitle";
import "./RoverUpload.css";
import AppFooter from "../components/AppFooter";

type Zone = {
  id: string;
  name: string;
  cropType: string;
  archivedAt: string | null;
  createdAt: string;
};

type Observation = {
  id: string;
  zoneId: string;
  type: string;
  imageUrl: string | null;
  capturedAt: string;
  uploadedAt: string;
};

type Recommendation = {
  id: string;
  zoneId: string;
  recommendationType: string;
  dciScore: number;
  explanationSummary: string;
  createdAt: string;

  // ✅ new fields (decision tracking)
  decisionStatus?: "pending" | "approved" | "rejected" | "executed";
  decisionBy?: string | null;
  decisionNote?: string | null;
  decisionAt?: string | null;
  executedAt?: string | null;
};

type TimelineResponse = {
  observations: Observation[];
  recommendations: Recommendation[];
};

type ZoneSummaryRow = {
  id: string;
  name: string;
  cropType: string;
  archivedAt: string | null;
  createdAt: string;
  zoneStatus: "ok" | "stressed" | "unknown";
  latestRecommendation: Recommendation | null;
};

type ZoneSummaryResponse = {
  zones: ZoneSummaryRow[];
};

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

function badgeStyle(bg: string, color = "#111827") {
  return {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 12,
    background: bg,
    border: "1px solid #e5e7eb",
    color, // ✅ ensures text readable even on dark theme
  } as const;
}

function recTheme(type: string) {
  const t = type.toLowerCase();
  if (t === "inspect") {
    return {
      border: "1px solid #dbeafe",
      background: "#eff6ff",
      badge: "#dbeafe",
      label: "Inspect",
    };
  }
  if (t === "pest_check") {
    return {
      border: "1px solid #fde68a",
      background: "#fffbeb",
      badge: "#fde68a",
      label: "Pest Check",
    };
  }
  if (t === "irrigate") {
    return {
      border: "1px solid #bbf7d0",
      background: "#ecfdf5",
      badge: "#bbf7d0",
      label: "Irrigate",
    };
  }
  return {
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    badge: "#e5e7eb",
    label: type,
  };
}

function zoneChipTheme(status: "ok" | "stressed" | "unknown") {
  if (status === "stressed") {
    return {
      border: "1px solid #fecaca",
      bg: "#fef2f2",
      badgeBg: "#fee2e2",
      text: "#991b1b",
      label: "Stressed",
    };
  }
  if (status === "ok") {
    return {
      border: "1px solid #bbf7d0",
      bg: "#ecfdf5",
      badgeBg: "#bbf7d0",
      text: "#065f46",
      label: "OK",
    };
  }
  return {
    border: "1px solid #e5e7eb",
    bg: "#f9fafb",
    badgeBg: "#e5e7eb",
    text: "#374151",
    label: "Unknown",
  };
}

function Sparkline({
  values,
  width = 420,
  height = 64,
  stroke = "#111827",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (!values.length) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);

  const range = max - min || 1;
  const padding = 6;

  const points = values.map((v, i) => {
    const x =
      padding + (i * (width - padding * 2)) / Math.max(1, values.length - 1);

    const y = padding + ((max - v) * (height - padding * 2)) / range;

    return { x, y, v };
  });

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#e5e7eb"
      />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2.5" />
      {points.map((p, idx) => (
        <circle
          key={idx}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="#ffffff"
          stroke={stroke}
          strokeWidth={2}
        >
          <title>DCI: {p.v}</title>
        </circle>
      ))}
      <text
        x={last.x + 8}
        y={last.y + 4}
        fontSize="12"
        fill="#111827"
        style={{ fontWeight: 700 }}
      >
        {last.v}
      </text>
    </svg>
  );
}

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        position: "relative",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}

      {/* ✅ Tooltip icon */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: "#f3f4f6",
          border: "1px solid #e5e7eb",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#374151",
          fontWeight: 800,
          lineHeight: 1,
          cursor: "pointer",
          padding: 0,
        }}
        aria-label={text}
      >
        i
      </button>

      {/* ✅ Tooltip bubble */}
      {open ? (
        <div
          style={{
            position: "absolute",
            top: "120%",
            left: 0,
            minWidth: 220,
            maxWidth: 320,
            padding: "10px 12px",
            background: "#111827",
            color: "#ffffff",
            fontSize: 12,
            borderRadius: 10,
            zIndex: 9999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {text}

          {/* small arrow */}
          <div
            style={{
              position: "absolute",
              top: -6,
              left: 14,
              width: 12,
              height: 12,
              background: "#111827",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      ) : null}
    </span>
  );
}

/**
 * ✅ Exported page: ErrorBoundary wrapper
 */
export default function RoverUploadPage() {
  return (
    <ErrorBoundary title="Rover Upload crashed">
      <RoverUpload />
    </ErrorBoundary>
  );
}

/**
 * ✅ Actual page code stays here
 */
function RoverUpload() {
  const [passcode, setPasscode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  // Timeline
  const [timelineStatus, setTimelineStatus] = useState("");
  const [timeline, setTimeline] = useState<TimelineResponse>({
    observations: [],
    recommendations: [],
  });
  const [showMoreTimeline, setShowMoreTimeline] = useState(false);

  // ✅ Zone summary header
  const [zoneSummaryStatus, setZoneSummaryStatus] = useState("");
  const [zoneSummary, setZoneSummary] = useState<ZoneSummaryRow[]>([]);

  // ✅ Decision block state
  const [decisionBy, setDecisionBy] = useState("Farmer");
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionBusy, setDecisionBusy] = useState(false);

  // Create zone form
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneCropType, setNewZoneCropType] = useState("");

  // Inline edit state
  // const [editingId, setEditingId] = useState<string | null>(null);
  // const [editName, setEditName] = useState("");
  // const [editCropType, setEditCropType] = useState("");

  const activeZones = useMemo(
    () => zones.filter((z) => !z.archivedAt),
    [zones]
  );

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === zoneId) || null,
    [zones, zoneId]
  );

  // ✅ latestRec used across dashboard
  const latestRec = timeline.recommendations?.[0] || null;

  // ✅ DCI trend chart values
  const dciTrend = useMemo(() => {
    const vals = (timeline.recommendations || [])
      .slice(0, 12)
      .map((r) => r.dciScore)
      .reverse();
    return vals;
  }, [timeline.recommendations]);

  // const obsToShow = showMoreTimeline
  //   ? timeline.observations.slice(0, 20)
  //   : timeline.observations.slice(0, 5);

  const recsToShow = showMoreTimeline
    ? timeline.recommendations.slice(0, 20)
    : timeline.recommendations.slice(0, 5);

  const galleryObs = showMoreTimeline
    ? timeline.observations.slice(0, 12)
    : timeline.observations.slice(0, 6);

  // ✅ Derived status for decision block
  const latestDecisionStatus = (latestRec?.decisionStatus || "pending") as
    | "pending"
    | "approved"
    | "rejected"
    | "executed";

  const canApprove = latestRec && latestDecisionStatus === "pending";
  const canReject = latestRec && latestDecisionStatus === "pending";
  const canExecute = latestRec && latestDecisionStatus === "approved";

  async function loadZones(opts?: { keepSelection?: boolean }) {
    const url = includeArchived
      ? "/api/zones/list?includeArchived=1"
      : "/api/zones/list";

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load zones");

    const data = (await res.json()) as Zone[];
    setZones(data);

    const keepSelection = opts?.keepSelection ?? true;

    if (!keepSelection || !zoneId) {
      const firstActive = data.find((z) => !z.archivedAt);
      if (firstActive) setZoneId(firstActive.id);
      else setZoneId("");
      return;
    }

    const stillExists = data.some(
      (z) => z.id === zoneId && (!z.archivedAt || includeArchived)
    );

    if (!stillExists) {
      const firstActive = data.find((z) => !z.archivedAt);
      if (firstActive) setZoneId(firstActive.id);
      else setZoneId("");
    }
  }

  async function loadZoneSummary() {
    if (!isLoggedIn) return;

    setZoneSummaryStatus("Loading zone summary...");
    try {
      const url = includeArchived
        ? "/api/zones/summary?includeArchived=1"
        : "/api/zones/summary";

      const res = await fetch(url);
      if (!res.ok) {
        setZoneSummary([]);
        setZoneSummaryStatus("Failed to load zone summary");
        return;
      }

      const data = (await res.json()) as ZoneSummaryResponse;
      setZoneSummary(data.zones || []);
      setZoneSummaryStatus("");
    } catch (err) {
      console.error(err);
      setZoneSummary([]);
      setZoneSummaryStatus("Failed to load zone summary");
    }
  }

  async function loadTimelineForZone(id: string) {
    if (!id) return;

    setTimelineStatus("Loading timeline...");
    try {
      const res = await fetch(`/api/zones/timeline?zoneId=${id}`);
      if (!res.ok) {
        setTimeline({ observations: [], recommendations: [] });
        setTimelineStatus("Failed to load timeline");
        return;
      }

      const data = (await res.json()) as TimelineResponse;
      setTimeline({
        observations: data.observations || [],
        recommendations: data.recommendations || [],
      });

      setTimelineStatus("");
    } catch (err) {
      console.error(err);
      setTimeline({ observations: [], recommendations: [] });
      setTimelineStatus("Failed to load timeline");
    }
  }

  async function refreshTimeline() {
    if (!isLoggedIn) return setStatus("Login first");
    if (!zoneId) return setStatus("Select a zone");
    await loadTimelineForZone(zoneId);
    await loadZoneSummary();
  }

  async function login() {
    setStatus("Logging in...");
    const res = await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });

    if (!res.ok) {
      setStatus("Invalid passcode");
      return;
    }

    setIsLoggedIn(true);
    setStatus("Login success ✅ Loading zones...");
    try {
      await loadZones({ keepSelection: false });
      await loadZoneSummary();
      setStatus("Zones loaded ✅");
    } catch (err) {
      console.error(err);
      setStatus("Login OK but failed to load zones");
    }
  }

  // Reload zones + summary when includeArchived changes
  useEffect(() => {
    if (!isLoggedIn) return;

    loadZones().catch((e) => {
      console.error(e);
      setStatus("Failed to reload zones");
    });

    loadZoneSummary().catch((e) => {
      console.error(e);
      setZoneSummaryStatus("Failed to reload zone summary");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived, isLoggedIn]);

  // Auto-load timeline when zone changes
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!zoneId) return;
    loadTimelineForZone(zoneId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId, isLoggedIn]);

  async function createZone() {
    if (!isLoggedIn) return setStatus("Login first");

    const name = newZoneName.trim();
    const cropType = newZoneCropType.trim();

    if (!name) return setStatus("Zone name required");
    if (!cropType) return setStatus("Crop type required");

    setStatus("Creating zone...");
    const res = await fetch("/api/zones/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, cropType }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setStatus(json?.error || "Zone create failed");
      return;
    }

    setNewZoneName("");
    setNewZoneCropType("");

    await loadZones({ keepSelection: false });
    await loadZoneSummary();

    if (json?.id) {
      setZoneId(json.id);
      await loadTimelineForZone(json.id);
    }

    setStatus("Zone created ✅");
  }

  // function startEdit(z: Zone) {
  //   setEditingId(z.id);
  //   setEditName(z.name);
  //   setEditCropType(z.cropType);
  // }

  // function cancelEdit() {
  //   setEditingId(null);
  //   setEditName("");
  //   setEditCropType("");
  // }

  // async function saveEdit(id: string) {
  //   if (!isLoggedIn) return setStatus("Login first");

  //   const name = editName.trim();
  //   const cropType = editCropType.trim();

  //   if (!name) return setStatus("Zone name required");
  //   if (!cropType) return setStatus("Crop type required");

  //   setStatus("Saving changes...");
  //   const res = await fetch("/api/zones/update", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ id, name, cropType }),
  //   });

  //   const json = await res.json().catch(() => null);

  //   if (!res.ok) {
  //     setStatus(json?.error || "Zone update failed");
  //     return;
  //   }

  //   cancelEdit();
  //   await loadZones();
  //   await loadZoneSummary();
  //   setStatus("Updated ✅");
  // }

  // async function archiveZone(z: Zone) {
  //   if (!isLoggedIn) return setStatus("Login first");

  //   const ok = window.confirm(`Archive "${z.name}"? You can unarchive later.`);
  //   if (!ok) return;

  //   setStatus("Archiving...");
  //   const res = await fetch("/api/zones/archive", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ id: z.id }),
  //   });

  //   const json = await res.json().catch(() => null);

  //   if (!res.ok) {
  //     setStatus(json?.error || "Archive failed");
  //     return;
  //   }

  //   await loadZones();
  //   await loadZoneSummary();
  //   setStatus("Zone archived ✅");
  // }

  // async function unarchiveZone(z: Zone) {
  //   if (!isLoggedIn) return setStatus("Login first");

  //   setStatus("Unarchiving...");
  //   const res = await fetch("/api/zones/unarchive", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ id: z.id }),
  //   });

  //   const json = await res.json().catch(() => null);

  //   if (!res.ok) {
  //     setStatus(json?.error || "Unarchive failed");
  //     return;
  //   }

  //   await loadZones();
  //   await loadZoneSummary();
  //   setStatus("Zone unarchived ✅");
  // }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied ✅");
    } catch {
      setStatus("Copy failed (browser blocked clipboard)");
    }
  }

  async function uploadScanAndGenerate() {
    if (!file) return setStatus("Choose a file first");
    if (!isLoggedIn) return setStatus("Login first");
    if (!zoneId) return setStatus("Select a zone");

    try {
      setStatus("Uploading image to Blob...");

      const pathname = `rover-scans/${Date.now()}-${file.name}`;
      const blob = await blobUpload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/rover?action=request-upload",
      });

      const blobUrl = blob.url;

      setStatus("Saving observation...");
      const r2 = await fetch("/api/rover?action=upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId, blobUrl }),
      });

      if (!r2.ok) {
        setStatus("Observation save failed");
        return;
      }

      setStatus("Generating recommendation...");
      const r3 = await fetch("/api/recommendations?action=run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId }),
      });

      if (!r3.ok) {
        setStatus("Recommendation run failed");
        return;
      }

      setStatus("Refreshing timeline...");
      await loadTimelineForZone(zoneId);
      await loadZoneSummary();

      setStatus("Done ✅ Upload + DCI generated!");
    } catch (err) {
      console.error(err);
      setStatus((err as Error).message || "Upload failed");
    }
  }

  async function sendDecision(action: "approve" | "reject" | "execute") {
    if (!latestRec?.id) return setStatus("No recommendation selected");
    if (decisionBusy) return;

    setDecisionBusy(true);
    setStatus(`${action.toUpperCase()}...`);

    try {
      const res = await fetch("/api/recommendations?action=decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: latestRec.id,
          action,
          decisionBy,
          decisionNote,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus(json?.error || "Decision failed");
        setDecisionBusy(false);
        return;
      }

      setStatus(`✅ ${action.toUpperCase()} saved`);
      setDecisionNote("");

      // ✅ refresh timeline + summary
      await loadTimelineForZone(zoneId);
      await loadZoneSummary();
    } catch (err) {
      console.error(err);
      setStatus("Decision failed");
    } finally {
      setDecisionBusy(false);
    }
  }

  return (
    // <div
    //   className="rover-root"
    //   style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}
    // >
    <div className="rover-root">
      <div className="roverWrap">
        {/* ✅ Global App Title */}
        <AppTitle />

        <h2 style={{ textAlign: "center" }}>Rover Upload (Demo)</h2>

        {/* rest of your existing code unchanged */}

        {/* ✅ Zone Summary Header */}
        {/* <div
        style={{
          marginTop: 12,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "#fff",
        }}
      > */}
        <div className="rover-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <Tip text="Zone Summary shows the latest DCI + status for each zone. Click a zone to open its timeline and recommendations.">
                <div style={{ fontWeight: 700 }}>Zone Summary</div>
              </Tip>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                {zoneSummaryStatus
                  ? zoneSummaryStatus
                  : isLoggedIn
                  ? "Click a zone to open timeline & recommendations."
                  : "Login to load zones."}
              </div>
            </div>

            {/* Selected zone badge */}
            {selectedZone ? (
              <div style={{ alignSelf: "flex-start" }}>
                <span className="rover-pill">
                  Zone: <b>{selectedZone?.name ?? "—"}</b>
                </span>
              </div>
            ) : null}
          </div>

          {/* Zone chips row */}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {!isLoggedIn ? (
              <div style={{ fontSize: 14, color: "#6b7280" }}>
                Login to view zones.
              </div>
            ) : zoneSummary.length === 0 ? (
              <div style={{ fontSize: 14, color: "#6b7280" }}>No zones.</div>
            ) : (
              zoneSummary.map((z) => {
                const theme = zoneChipTheme(z.zoneStatus);
                const dci = z.latestRecommendation?.dciScore ?? null;

                const isSelected = zoneId === z.id;

                return (
                  <button
                    key={z.id}
                    onClick={() => setZoneId(z.id)}
                    style={{
                      border: theme.border,
                      background: theme.bg,
                      borderRadius: 12,
                      padding: "10px 12px",
                      minWidth: 210,
                      cursor: "pointer",
                      textAlign: "left",
                      position: "relative",
                      boxShadow: isSelected ? "0 0 0 2px #111827" : "none",
                    }}
                    title="Click to open this zone"
                  >
                    {/* top-right DCI badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        padding: "3px 8px",
                        borderRadius: 999,
                        fontSize: 12,
                        background: theme.badgeBg,
                        border: "1px solid #e5e7eb",
                        color: theme.text,
                        fontWeight: 800,
                      }}
                    >
                      {dci === null ? "—" : `DCI ${dci}`}
                    </div>

                    <div style={{ fontWeight: 800, color: theme.text }}>
                      {z.name}
                    </div>
                    <div
                      style={{ fontSize: 13, color: "#374151", marginTop: 4 }}
                    >
                      {z.cropType}
                    </div>

                    <div
                      style={{ marginTop: 8, fontSize: 12, color: theme.text }}
                    >
                      Status: <b>{theme.label}</b>
                      {z.latestRecommendation?.decisionStatus ? (
                        <>
                          {" "}
                          • Decision:{" "}
                          <b>{z.latestRecommendation.decisionStatus}</b>
                        </>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Login */}
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <label style={{ fontWeight: 600 }}>Demo passcode:</label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{ padding: 8, flex: 1 }}
              placeholder="Enter passcode"
            />
            <button onClick={login} style={{ padding: "8px 12px" }}>
              Login
            </button>
          </div>
        </div>

        {/* Zone selection */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Tip text="Select the farm zone where the rover scanned the crops. Recommendations will be shown for this zone.">
                <div style={{ fontWeight: 600 }}>Zone</div>
              </Tip>
              {selectedZone ? (
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                  Selected: <b>{selectedZone.name}</b> — {selectedZone.cropType}
                </div>
              ) : null}
            </div>

            <Tip text="Archived zones are hidden by default. Enable this to view zones that were archived earlier.">
              <label
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                  disabled={!isLoggedIn}
                />
                Show archived zones
              </label>
            </Tip>
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              style={{ padding: 8, minWidth: 360 }}
              disabled={!isLoggedIn || !activeZones.length}
            >
              <option value="" disabled>
                {!isLoggedIn
                  ? "Login to load zones"
                  : activeZones.length
                  ? "Select a zone..."
                  : "No active zones (create one below)"}
              </option>

              {activeZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} — {z.cropType}
                </option>
              ))}
            </select>

            <button
              title="Reload latest scans and recommendations for this zone"
              onClick={refreshTimeline}
              disabled={!isLoggedIn || !zoneId}
              style={{ padding: "8px 12px" }}
            >
              Refresh timeline
            </button>

            <button
              onClick={() => setShowMoreTimeline((v) => !v)}
              disabled={!isLoggedIn || !zoneId}
              style={{ padding: "8px 12px" }}
              title="Show last 20 vs last 5"
            >
              {showMoreTimeline ? "Show less" : "Show more"}
            </button>
          </div>
        </div>

        {/* Upload section */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <Tip text="Upload a rover scan image. The system will analyze it and generate a recommendation for this zone.">
            <label style={{ fontWeight: 600 }}>Scan Image</label>
          </Tip>
          <div style={{ marginTop: 8 }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              title="Uploads the scan image and generates a new recommendation (DCI) for this zone"
              onClick={uploadScanAndGenerate}
              style={{ padding: "8px 12px" }}
            >
              Upload Scan + Generate Recommendation
            </button>
          </div>
        </div>

        {/* Timeline panel */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0 }}>Timeline</h3>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {timelineStatus
                ? timelineStatus
                : zoneId
                ? "Up to date"
                : "Select a zone"}
            </div>
          </div>

          {!isLoggedIn ? (
            <p style={{ marginTop: 10 }}>Login to view timeline.</p>
          ) : !zoneId ? (
            <p style={{ marginTop: 10 }}>
              Select a zone to view scans and recommendations.
            </p>
          ) : timeline.observations.length === 0 &&
            timeline.recommendations.length === 0 ? (
            <p style={{ marginTop: 10 }}>
              No scans or recommendations yet for this zone.
            </p>
          ) : (
            <>
              {/* ✅ C) DCI Trend Chart */}
              <div style={{ marginTop: 12 }}>
                <Tip text="DCI Trend shows how recommendation confidence is changing over time for this zone.">
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    DCI Trend
                  </div>
                </Tip>

                {dciTrend.length < 2 ? (
                  <div style={{ fontSize: 14, color: "#6b7280" }}>
                    Not enough recommendations yet to show trend.
                  </div>
                ) : (
                  <div
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 12,
                      padding: 12,
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 420 }}>
                      <Sparkline values={dciTrend} />
                    </div>

                    <div
                      style={{ fontSize: 13, color: "#374151", minWidth: 220 }}
                    >
                      <div>
                        Latest DCI:{" "}
                        <b style={{ fontSize: 18 }}>
                          {latestRec?.dciScore ?? "—"}
                        </b>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        Range: <b>{Math.min(...dciTrend)}</b> –{" "}
                        <b>{Math.max(...dciTrend)}</b>
                      </div>

                      <div style={{ marginTop: 8, color: "#6b7280" }}>
                        Based on last {dciTrend.length} recommendations
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Approve / Reject / Execute block */}
              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <Tip text="This section lets the farmer approve, reject, or execute the latest recommendation generated for the selected zone. Execute is enabled only after approval.">
                      <div style={{ fontWeight: 700 }}>
                        Recommendation Decision
                      </div>
                    </Tip>
                    <div
                      style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}
                    >
                      Latest recommendation status:{" "}
                      <b>{latestDecisionStatus}</b>
                    </div>
                  </div>

                  <div>
                    <span style={badgeStyle("#f9fafb", "#111827")}>
                      Zone: <b>{selectedZone?.name ?? "—"}</b>
                    </span>
                  </div>
                </div>

                {!latestRec ? (
                  <div
                    style={{ marginTop: 10, fontSize: 14, color: "#6b7280" }}
                  >
                    No recommendation yet for this zone.
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        marginTop: 10,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                      }}
                    >
                      <input
                        value={decisionBy}
                        onChange={(e) => setDecisionBy(e.target.value)}
                        placeholder="Decision by (e.g. Farmer)"
                        style={{
                          padding: 10,
                          border: "1px solid #ddd",
                          borderRadius: 8,
                        }}
                      />
                      <input
                        value={decisionNote}
                        onChange={(e) => setDecisionNote(e.target.value)}
                        placeholder="Decision note (optional)"
                        style={{
                          padding: 10,
                          border: "1px solid #ddd",
                          borderRadius: 8,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        disabled={!canApprove || decisionBusy}
                        onClick={() => sendDecision("approve")}
                        style={{
                          padding: "10px 14px",
                          background: canApprove ? "#ecfdf5" : "#f3f4f6",
                          border: "1px solid #bbf7d0",
                          borderRadius: 10,
                          cursor: canApprove ? "pointer" : "not-allowed",
                          fontWeight: 700,
                        }}
                        title={
                          !canApprove
                            ? "Only available when status is pending"
                            : "Approve recommendation"
                        }
                      >
                        ✅ Approve
                      </button>

                      <button
                        disabled={!canReject || decisionBusy}
                        onClick={() => sendDecision("reject")}
                        style={{
                          padding: "10px 14px",
                          background: canReject ? "#fef2f2" : "#f3f4f6",
                          border: "1px solid #fecaca",
                          borderRadius: 10,
                          cursor: canReject ? "pointer" : "not-allowed",
                          fontWeight: 700,
                        }}
                        title={
                          !canReject
                            ? "Only available when status is pending"
                            : "Reject recommendation"
                        }
                      >
                        ❌ Reject
                      </button>

                      <button
                        disabled={!canExecute || decisionBusy}
                        onClick={() => sendDecision("execute")}
                        style={{
                          padding: "10px 14px",
                          background: canExecute ? "#eff6ff" : "#f3f4f6",
                          border: "1px solid #bfdbfe",
                          borderRadius: 10,
                          cursor: canExecute ? "pointer" : "not-allowed",
                          fontWeight: 700,
                        }}
                        title={
                          !canExecute
                            ? "Execute is only allowed after APPROVE"
                            : "Execute recommendation"
                        }
                      >
                        🚜 Execute
                      </button>
                    </div>

                    <div
                      style={{ marginTop: 10, fontSize: 13, color: "#6b7280" }}
                    >
                      Tip: Execute button becomes active only when
                      recommendation is approved.
                    </div>
                  </>
                )}
              </div>

              {/* ✅ A) Scan gallery grid */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  Scan Gallery
                </div>

                {galleryObs.filter((o) => !!o.imageUrl).length === 0 ? (
                  <div style={{ fontSize: 14, color: "#6b7280" }}>
                    No scan images yet.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                      gap: 10,
                    }}
                  >
                    {galleryObs
                      .filter((o) => !!o.imageUrl)
                      .map((o) => (
                        <div
                          key={o.id}
                          style={{
                            border: "1px solid #eee",
                            borderRadius: 10,
                            overflow: "hidden",
                            background: "#fff",
                          }}
                        >
                          <button
                            onClick={() => window.open(o.imageUrl!, "_blank")}
                            style={{
                              border: "none",
                              padding: 0,
                              margin: 0,
                              width: "100%",
                              cursor: "pointer",
                              background: "transparent",
                            }}
                            title="Open full image"
                          >
                            <img
                              src={o.imageUrl!}
                              alt="Scan thumb"
                              style={{
                                width: "100%",
                                height: 90,
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </button>

                          <div style={{ padding: 8 }}>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>
                              {formatDate(o.uploadedAt)}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                marginTop: 6,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                style={{ padding: "5px 8px", fontSize: 12 }}
                                onClick={() => copyToClipboard(o.imageUrl!)}
                              >
                                Copy URL
                              </button>
                              <button
                                style={{ padding: "5px 8px", fontSize: 12 }}
                                onClick={() =>
                                  copyToClipboard(JSON.stringify(o, null, 2))
                                }
                              >
                                Copy JSON
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* ✅ B) Recommendation cards */}
              <div style={{ marginTop: 16 }}>
                <Tip text="These are AI-generated recommendations for this zone. Each includes the type of action, DCI confidence score, and summary explanation.">
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    Recommendations
                  </div>
                </Tip>

                {recsToShow.length === 0 ? (
                  <div style={{ fontSize: 14, color: "#6b7280" }}>
                    No recommendations yet.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    {recsToShow.map((r) => {
                      const theme = recTheme(r.recommendationType);

                      return (
                        <div
                          key={r.id}
                          style={{
                            border: theme.border,
                            background: theme.background,
                            borderRadius: 12,
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={badgeStyle(theme.badge)}>
                                Type: <b>{theme.label}</b>
                              </span>
                              <span style={badgeStyle("#ffffff")}>
                                DCI: <b>{r.dciScore}</b>
                              </span>

                              {/* decision badge */}
                              <span style={badgeStyle("#f3f4f6")}>
                                Status: <b>{r.decisionStatus || "pending"}</b>
                              </span>
                            </div>

                            <button
                              style={{ padding: "6px 10px", fontSize: 12 }}
                              onClick={() =>
                                copyToClipboard(JSON.stringify(r, null, 2))
                              }
                              title="Copy recommendation JSON"
                            >
                              Copy JSON
                            </button>
                          </div>

                          <p style={{ marginTop: 10, marginBottom: 0 }}>
                            {r.explanationSummary}
                          </p>

                          <div
                            style={{
                              marginTop: 10,
                              fontSize: 12,
                              color: "#6b7280",
                            }}
                          >
                            Created: <b>{formatDate(r.createdAt)}</b>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Create zone */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <Tip text="Create a new zone for your farm (example: Zone 5). Zones help organize rover scans and recommendations by crop area.">
            <h3 style={{ margin: 0, marginBottom: 8 }}>Add Zone</h3>
          </Tip>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              placeholder="Zone name (e.g. Zone 5)"
              style={{ padding: 8, minWidth: 240 }}
              disabled={!isLoggedIn}
            />
            <input
              value={newZoneCropType}
              onChange={(e) => setNewZoneCropType(e.target.value)}
              placeholder="Crop type (e.g. Tomato)"
              style={{ padding: 8, minWidth: 240 }}
              disabled={!isLoggedIn}
            />
            <button
              onClick={createZone}
              style={{ padding: "8px 12px" }}
              disabled={!isLoggedIn}
            >
              Add Zone
            </button>
          </div>
        </div>

        {/* Status */}
        <p className="rover-status">{status || "Ready"}</p>
        {/* ✅ Footer */}
        <AppFooter />
      </div>
    </div>
  );
}
