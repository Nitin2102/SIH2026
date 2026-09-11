# Technical Architecture - MetroSight City-Wide ANPR + Vehicle Re-ID & Traffic Intelligence Platform

## System Pipeline Architecture

```
Camera Video Streams (8 Nodes)
             │
             ▼
    Frame Preprocessor
             │
             ▼
    Vehicle Detector (Car, Truck, Bus, Motorcycle)
             │
             ▼
    Multi-Object Tracker (SORT / Track ID Persistence)
             │
             ▼
    License Plate Detector & Crop Enhancer (CLAHE + Denoising)
             │
             ▼
    License Plate OCR & Regional Normalization (KA01AB1234)
             │
             ▼
    Cross-Camera Vehicle Re-Identification (Multi-Signal Composite Score)
             │
             ▼
    Spatio-Temporal Trajectory Engine (Chronological Timeline)
             │
             ├──────────────────────────┐
             ▼                          ▼
   Traffic Analytics Engine     Anomaly & Alert Engine
  (Density, Speed, Congestion, (Travel-time, Route Jump,
   Bottlenecks, OD Matrix)       Watchlist Match)
             │                          │
             └─────────────┬────────────┘
                           ▼
                 SQLite / Postgres Store
                           │
                           ▼
                 FastAPI Backend REST & WS
                           │
                           ▼
          React + TypeScript Command Center Dashboard
```

---

## 1. Module Specifications & Interfaces

### 1. Multi-Camera Stream Manager (`backend/app/engine/camera_stream.py`)
- **Input**: 8 MP4 video files / live frame generator.
- **Output**: 15 FPS synchronized OpenCV BGR frames + MJPEG HTTP video stream bytes.

### 2. Vehicle Detector (`backend/app/engine/detector.py`)
- **Input**: BGR frame array `(640, 480, 3)`.
- **Output**: Structured detections `[{ vehicle_class, confidence, bbox: [x,y,w,h], visual_features: List[float] }]`.

### 3. Multi-Object Tracker (`backend/app/engine/tracker.py`)
- **Input**: Frame detections list + camera ID + timestamp.
- **Output**: Active tracks `[{ track_id: "TRACK-001", camera_id, vehicle_class, bbox, trajectory_points }]`.

### 4. License Plate OCR & Normalization (`backend/app/engine/plate_ocr.py`)
- **Input**: Vehicle crop image array `(h, w, 3)`.
- **Output**: `{ raw_plate: "ka 01 ab 1234", normalized_plate: "KA01AB1234", ocr_confidence: 0.94 }`.

### 5. Cross-Camera Vehicle Re-Identification (`backend/app/engine/reid_engine.py`)
- **Formula**: `identity_score = plate_sim * 0.50 + app_sim * 0.20 + class_sim * 0.15 + route_sim * 0.08 + time_sim * 0.07`
- **Output**: `{ global_vehicle_id: "VEH-000001", identity_score: 0.98, is_new: False }`.

### 6. Trajectory Reconstruction (`backend/app/engine/trajectory.py`)
- **Input**: ReID observation events.
- **Output**: Chronological journey list `[{ camera_id, camera_name, timestamp, lat, lng, direction, speed_kmh, plate }]`.

### 7. Traffic Analytics Engine (`backend/app/engine/analytics.py`)
- **Metrics**:
  - Density (`veh / km`)
  - Flow (`veh / min`)
  - Congestion Level (`FREE`, `MODERATE`, `HEAVY`, `SEVERE`)
  - Origin-Destination Matrix (`(origin, destination) -> trip_count, avg_travel_time`)

### 8. Anomaly & Alert Engine (`backend/app/engine/alert_engine.py`)
- **Evaluates**: Watchlist database matches, rapid travel-time jumps, speed limit violations.
- **Output**: Pushes real-time JSON alert payloads to WebSocket subscribers.
