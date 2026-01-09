import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Observation = {
  id: string;
  imageUrl: string | null;
  uploadedAt: string;
};

type Recommendation = {
  id: string;
  recommendationType: string;
  dciScore: number;
  explanationSummary: string;
  createdAt: string;
};

export default function ZoneDetail() {
  const { id } = useParams();
  const zoneId = id!;
  const [observations, setObservations] = useState<Observation[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [status, setStatus] = useState("");

  async function load() {
    setStatus("Loading...");
    const res = await fetch(`/api/zones/timeline?zoneId=${zoneId}`);
    if (!res.ok) return setStatus("Failed to load timeline");
    const data = await res.json();
    setObservations(data.observations);
    setRecommendations(data.recommendations);
    setStatus("");
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  return (
    <div>
      <h2>Zone Timeline</h2>
      <p>
        <b>Zone ID:</b> {zoneId}
      </p>
      <button onClick={load}>Refresh</button>
      <p>{status}</p>

      <h3>Latest Observations</h3>
      {observations.map((o) => (
        <div
          key={o.id}
          style={{ border: "1px solid #ddd", padding: 10, marginBottom: 10 }}
        >
          <div>
            <b>Uploaded:</b> {new Date(o.uploadedAt).toLocaleString()}
          </div>
          {o.imageUrl && (
            <img src={o.imageUrl} style={{ maxWidth: 400, marginTop: 8 }} />
          )}
        </div>
      ))}

      <h3>Recommendations</h3>
      {recommendations.map((r) => (
        <div
          key={r.id}
          style={{ border: "1px solid #ddd", padding: 10, marginBottom: 10 }}
        >
          <div>
            <b>Type:</b> {r.recommendationType}
          </div>
          <div>
            <b>DCI:</b> {r.dciScore}
          </div>
          <div>
            <b>Why:</b> {r.explanationSummary}
          </div>
          <div style={{ opacity: 0.7 }}>
            <b>Created:</b> {new Date(r.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
