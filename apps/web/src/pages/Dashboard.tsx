import { useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [zoneId, setZoneId] = useState("");

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Paste a Zone ID to open timeline:</p>

      <input value={zoneId} onChange={(e) => setZoneId(e.target.value)} style={{ width: 360 }} />
      <div style={{ marginTop: 8 }}>
        <Link to={`/zone/${zoneId}`}>Open Zone</Link>
      </div>
    </div>
  );
}
