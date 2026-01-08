# CADS-Agri  
**(Confidence-Based Agricultural Decision System)**

CADS-Agri is a confidence-driven agricultural decision support demo that simulates a rover-based crop monitoring workflow. Users upload rover scan images to a selected zone, the system generates a **DCI (Decision Confidence Index)** score, and produces confidence-based recommendations. Farmers can then **Approve / Reject / Execute** the latest recommendation, simulating real-world decision tracking.

---

## Demo Workflow (Detect → Verify → Decide)

1. **Select a Zone**
2. **Upload Rover Scan Image**
3. System generates:
   - **DCI Score** (0–100)
   - **Recommendation type** (Inspect / Irrigate / Pest Check)
   - **Explanation summary**
4. Farmer decides:
   - ✅ **Approve**
   - ❌ **Reject**
   - 🚜 **Execute** *(only after approval)*
5. Timeline + Zone Summary update automatically.

---

## Features

✅ Zone Summary dashboard with Stress/OK highlights  
✅ Latest zone recommendation preview (DCI + status)  
✅ Upload scan image to Vercel Blob  
✅ Auto-generate recommendation + DCI score  
✅ Timeline view (scans + recommendation history)  
✅ Approve / Reject / Execute workflow with DB tracking  
✅ Responsive UX (mobile + tablet + desktop)  
✅ Dark/Light theme support  

---

## Tech Stack

### Frontend
- **React + TypeScript**
- **Vite**
- **React Router DOM**
- **CSS** (responsive + dark/light theme via `prefers-color-scheme`)

### Backend (API)
- **Vercel Serverless Functions** (`@vercel/node`)
- API Routes under: `apps/web/api/*`

### Storage
- **Vercel Blob Storage**
- Used for rover scan image uploads via `@vercel/blob/client`

### Database
- **PostgreSQL**
- **Drizzle ORM**
- **Drizzle Kit** (migrations)

---

## Project Structure (Monorepo)

```txt
apps/web
  ├── src
  │   ├── pages
  │   │   ├── RoverUpload.tsx
  │   │   └── Dashboard.tsx
  │   └── components
  │       ├── AppTitle.tsx
  │       └── AppFooter.tsx
  └── api
      ├── zones
      ├── recommendations
      └── rover

packages/db
  ├── schema.ts
  └── migrations
```
---

## Key API Endpoints

### Zones
- `GET /api/zones/list`
- `GET /api/zones/summary`
- `GET /api/zones/timeline?zoneId=UUID`
- `POST /api/zones/create`
- `POST /api/zones/update`
- `POST /api/zones/archive`
- `POST /api/zones/unarchive`

### Rover Upload
- `POST /api/rover/request-upload`
- `POST /api/rover/upload-complete`

### Recommendations
- `POST /api/recommendations/run`
- `POST /api/recommendations/decision`

---

## DCI (Decision Confidence Index)

DCI is a confidence score between **0 and 100** indicating the reliability of the latest recommendation based on the rover scan.

- Higher DCI → stronger confidence in detected stress indicators  
- Lower DCI → requires verification (more scans or manual inspection)

---

## Local Development

### 1) Install dependencies
```bash
npm install

```
### 2) Run locally with Vercel Dev (recommended)
```bash
vercel dev
```

### The app will run at:
- `http://localhost:3000` (or the next available port)


### Database Setup & Migrations

This project uses Drizzle ORM + PostgreSQL.

Generate migration

```bash
npx drizzle-kit generate
```

Ensure your DATABASE_URL is set in environment variables.

### Demo Disclaimer

## Demo Disclaimer:
In this remote demonstration, pre-captured crop stress images are used in place of live rover input to simulate the Detect–Verify pipeline; these images represent rover-captured visuals on the same network and are used to showcase DCI computation and confidence-based recommendations.


### Credits & Copyright

Developed by Shalom Keshet ©
All rights reserved.

RedHook Team — Presented at E-21, E-Cell, IIT Madras – 2026

## Screenshots
- Zone Summary + DCI Badges  
- Rover Upload + Timeline  
- Recommendation Decision (Approve/Reject/Execute)



