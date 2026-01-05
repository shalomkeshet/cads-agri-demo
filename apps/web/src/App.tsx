import { Routes, Route, Navigate, Link } from "react-router-dom";
import RoverUpload from "./pages/RoverUpload";
import Dashboard from "./pages/Dashboard";
import ZoneDetail from "./pages/ZoneDetail";

export default function App() {
  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/rover-upload">Rover Upload</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/rover-upload" replace />} />
        <Route path="/rover-upload" element={<RoverUpload />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/zone/:id" element={<ZoneDetail />} />
      </Routes>
    </div>
  );
}
