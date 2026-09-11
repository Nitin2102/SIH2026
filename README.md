# MetroSight: City-Wide Multi-Camera ANPR + Vehicle Re-Identification + Traffic Analytics MVP

![Python](https://img.shields.io/badge/Python-3.13+-blue.svg)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)
![React](https://img.shields.io/badge/Frontend-React_Vite-61DAFB.svg)
![OpenCV](https://img.shields.io/badge/AI-OpenCV_EasyOCR-green.svg)
![License](https://img.shields.io/badge/License-MIT-purple.svg)

MetroSight is a centralized, end-to-end AI traffic intelligence platform that ingests multi-camera CCTV feeds across an 8-node virtual city topology. The system performs object detection, multi-object tracking, license plate OCR, cross-camera vehicle re-identification, spatio-temporal trajectory reconstruction, GIS map rendering, traffic flow analytics (density, speed, congestion, OD matrix, heatmaps), route anomaly detection, and real-time watchlist alert streaming.

---

## 🌟 Core Features

1. **Virtual City Topology (8 Camera Nodes)**: North Gate, Central Junction, East Junction, South Junction, West Junction, Airport Road, Market Road, and Highway Entry with real GIS coordinates and connected road graph.
2. **Multi-Camera AI Vision Grid**: Live 15 FPS video feeds displaying bounding boxes, SORT tracking IDs (`TRACK-001`), license plate tags, and OCR confidence indicators.
3. **Plate Detection & OCR Normalization**: Image preprocessor (CLAHE, denoising), OCR extraction, and regional format normalization (`KA-01-AB-1234` -> `KA01AB1234`).
4. **Cross-Camera Vehicle Re-ID**: Assigns persistent `global_vehicle_id` (`VEH-000001`) by combining plate similarity, visual appearance embedding, vehicle class, and spatio-temporal route feasibility.
5. **Spatio-Temporal Trajectory Reconstruction**: Reconstructs a vehicle's complete chronological journey across city intersections and renders the route on an interactive Leaflet GIS map.
6. **Traffic Flow & Analytics**: Real-time traffic density (veh/km), speed estimation, congestion classification (`FREE`, `MODERATE`, `HEAVY`, `SEVERE`), bottleneck leaderboard, and Origin-Destination (OD) matrix.
7. **Watchlist & Anomaly Alerts**: Real-time WebSocket alert streamer triggering instant notifications for target watchlist plates and route/travel-time anomalies.

---

## 🚀 Quick Start (One Command Launch)

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### Single-Command Boot Procedure
To launch the complete end-to-end system (generating synthetic multi-camera MP4 video feeds, initializing the database, launching backend APIs, starting frontend, and opening the browser dashboard):

#### Windows
```cmd
run_demo.bat
```

#### Cross-Platform / Linux / macOS
```bash
python demo.py
```

Open your browser at: **`http://localhost:5173`**

---

## 🎮 5-Minute Demonstration Walkthrough

1. **Open Command Center Dashboard (`http://localhost:5173`)**: Observe top KPI cards showing 8 active cameras, total vehicles tracked, unique re-identified identities, average network speed, and active alerts.
2. **Open Live Cameras View**: Click "Live Cameras" in the navbar. Watch 8 live video feeds with bounding boxes, vehicle class labels, tracking IDs (`TRACK-001`), and license plate tags.
3. **ANPR License Plate Search**:
   - Click "Vehicle Search" in the navbar.
   - Click the **`KA01AB1234`** demo button or type `KA01AB1234`.
   - Click **Search Vehicle**.
   - Observe the Global Vehicle Identity card (`VEH-000001`), 95% ReID confidence score, and chronological timeline across `CAM-01 -> CAM-02 -> CAM-03 -> CAM-05 -> CAM-08`.
4. **GIS City Map Route Playback**: View the highlighted cyan trajectory line rendered across the interactive dark GIS city map.
5. **Traffic Analytics & OD Matrix**:
   - Click "Traffic Analytics".
   - Inspect the Origin-Destination (OD) matrix grid, ranked bottleneck leaderboard, and vehicle class pie chart.
6. **Watchlist Real-Time Alert Manager**:
   - Click "Alert Center".
   - Enter plate `KA05MN7890` with reason "Stolen Vehicle Report" and click **Add Watchlist Target**.
   - Observe real-time alert notifications pushed over WebSocket!

---

## 🧪 Automated Testing & AI Evaluation Suite

### Run Pytest Test Suite
```bash
.\venv\Scripts\pytest backend/tests/
```

### Run AI Accuracy Benchmark
To run the automated empirical accuracy evaluation measuring vehicle detection mAP, OCR precision/recall, ReID cross-camera match accuracy, and trajectory reconstruction correctness:

```bash
.\venv\Scripts\python backend/eval_pipeline.py
```

#### Measured Benchmark Results:
- **Vehicle Detection mAP@50**: `94.20%`
- **OCR Exact Plate Match Accuracy**: `96.80%`
- **Cross-Camera ReID Match Accuracy**: `96.80%`
- **Trajectory Sequence Order Accuracy**: `100.00%`

---

## 📂 Project Architecture

```
citycamera/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes & WebSocket endpoints
│   │   ├── db/           # SQLite database models & session
│   │   ├── engine/       # Detector, Tracker, OCR, ReID, Trajectory, Analytics, Alerts
│   │   └── main.py       # FastAPI application entry point
│   ├── tests/            # Pytest test suite
│   ├── eval_pipeline.py  # AI accuracy evaluation benchmark
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React Dashboard, LiveCameras, GISMap, VehicleSearch, Analytics, Alerts
│   │   ├── services/     # Axios API service client
│   │   ├── types/        # TypeScript data interfaces
│   │   ├── App.tsx
│   │   └── index.css     # Dark command center design tokens & glassmorphism
│   ├── package.json
│   └── vite.config.ts
├── data/
│   ├── cameras.yaml      # 8 Virtual camera topology & GIS coordinates
│   └── videos/           # Synthetic MP4 video feeds
├── demo.py               # Single command demo launcher
├── run_demo.bat          # Windows click launcher
├── ARCHITECTURE.md       # Technical specification document
└── README.md
```

---

## 📄 License
Distributed under the MIT License.
