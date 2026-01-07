import { useState } from "react";
import { upload as blobUpload } from "@vercel/blob/client";

export default function RoverUpload() {
  const [passcode, setPasscode] = useState("");
  const [zoneId, setZoneId] = useState("22222222-2222-2222-2222-222222222222");
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

  async function uploadScanAndGenerate() {
    if (!file) return setStatus("Choose a file first");
    if (!zoneId) return setStatus("Enter zoneId");
  
    try {
      setStatus("Uploading image to Blob...");
  
      const pathname = `rover-scans/${Date.now()}-${file.name}`;
  
      // ✅ This automatically calls /api/rover/request-upload behind the scenes
      const blob = await blobUpload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/rover/request-upload",
      });
  
      const blobUrl = blob.url;
  
      // 3) Save observation in DB
      setStatus("Saving observation...");
      const r2 = await fetch("/api/rover/upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId, blobUrl }),
      });
  
      if (!r2.ok) {
        setStatus("Observation save failed");
        return;
      }
  
      // 4) Run recommendation generation
      setStatus("Generating recommendation...");
      const r3 = await fetch("/api/recommendations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId }),
      });
  
      if (!r3.ok) {
        setStatus("Recommendation run failed");
        return;
      }
  
      setStatus("Done ✅ Upload + DCI generated!");
    } catch (err) {
      console.error(err);
      setStatus((err as Error).message || "Upload failed");
    }
  }  

  return (
    <div>
      <h2>Rover Upload (Demo)</h2>

      <div style={{ marginTop: 12 }}>
        <label>Demo passcode:</label>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <input
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
          <button onClick={login}>Login</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Zone ID:</label>
        <div style={{ marginTop: 6 }}>
          <input
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            placeholder="22222222-2222-2222-2222-222222222222"
          />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Scan Image:</label>
        <div style={{ marginTop: 6 }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={uploadScanAndGenerate}>
          Upload Scan + Generate Recommendation
        </button>
      </div>

      <p style={{ marginTop: 12 }}>{status}</p>
    </div>
  );
}
