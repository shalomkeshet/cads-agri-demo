import { useState } from "react";

export default function RoverUpload() {
  const [passcode, setPasscode] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

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
    setStatus("Login success ✅");
  }

  async function upload() {
    if (!file) return setStatus("Choose a file first");
    if (!zoneId) return setStatus("Enter zoneId");

    setStatus("Requesting upload URL...");
    const r1 = await fetch("/api/rover/request-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "image/jpeg",
      }),
    });

    if (!r1.ok) return setStatus("Upload URL request failed");
    const { uploadUrl, blobUrl } = await r1.json();

    setStatus("Uploading image...");
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "image/jpeg" },
      body: file,
    });

    if (!putRes.ok) return setStatus("Image upload failed");

    setStatus("Saving observation...");
    const r2 = await fetch("/api/rover/upload-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zoneId, blobUrl }),
    });

    if (!r2.ok) return setStatus("Observation save failed");

    setStatus("Generating recommendation...");
    const r3 = await fetch("/api/recommendations/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zoneId }),
    });

    if (!r3.ok) return setStatus("Recommendation run failed");

    setStatus("Done ✅ Upload + DCI generated!");
  }

  return (
    <div>
      <h2>Rover Upload (Demo)</h2>

      <div style={{ marginTop: 12 }}>
        <label>Demo passcode:</label>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <input value={passcode} onChange={(e) => setPasscode(e.target.value)} />
          <button onClick={login}>Login</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Zone ID:</label>
        <div style={{ marginTop: 6 }}>
          <input value={zoneId} onChange={(e) => setZoneId(e.target.value)} placeholder="paste zone uuid here" />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Scan Image:</label>
        <div style={{ marginTop: 6 }}>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={upload}>Upload Scan + Generate Recommendation</button>
      </div>

      <p style={{ marginTop: 12 }}>{status}</p>
    </div>
  );
}
