import os
import cv2
import yaml
import time
import asyncio
import requests
from datetime import datetime
from typing import Dict, Any, Generator

from .video_generator import generate_frame_for_camera
from .detector import VehicleDetector
from .tracker import MultiObjectTracker
from .plate_ocr import PlateOCREngine
from .reid_engine import VehicleReIDEngine
from .trajectory import TrajectoryEngine
from .analytics import TrafficAnalyticsEngine
from .anomaly import AnomalyEngine
from .alert_engine import AlertEngine


class MultiCameraPipelineManager:
    def __init__(self, config_path: str = "data/cameras.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.cameras = {c["id"]: c for c in self.config["cameras"]}
        self.roads = self.config.get("roads", [])

        # Build topology graph
        self.topology = {}
        for c_id, c_data in self.cameras.items():
            self.topology[c_id] = c_data.get("connected_roads", [])

        # Build min travel time map
        self.min_travel_times = {}
        for r in self.roads:
            f_cam = r["from"]
            t_cam = r["to"]
            dist_km = r["distance_km"]
            max_speed = r["free_flow_speed_kmh"]
            min_sec = (dist_km / max_speed) * 3600.0
            self.min_travel_times[(f_cam, t_cam)] = min_sec
            self.min_travel_times[(t_cam, f_cam)] = min_sec

        # Pipeline Engines
        self.detector = VehicleDetector()
        self.trackers = {
            c_id: MultiObjectTracker()
            for c_id in self.cameras
        }
        self.ocr_engine = PlateOCREngine()
        self.reid_engine = VehicleReIDEngine()
        self.trajectory_engine = TrajectoryEngine()
        self.analytics_engine = TrafficAnalyticsEngine(
            self.cameras,
            self.roads
        )
        self.anomaly_engine = AnomalyEngine(
            self.topology,
            self.min_travel_times
        )
        self.alert_engine = AlertEngine()

        self.current_frames = {}
        self.frame_counters = {
            c_id: 0
            for c_id in self.cameras
        }
        self.is_running = False

    def _send_event_to_backend(
        self,
        global_vehicle_id,
        camera_id,
        camera_name,
        timestamp,
        lat,
        lng,
        direction,
        vehicle_class,
        speed_kmh,
        confidence,
        plate
    ):
        payload = {
            "global_vehicle_id": global_vehicle_id,
            "camera_id": camera_id,
            "camera_name": camera_name,
            "timestamp": timestamp.isoformat(),
            "lat": lat,
            "lng": lng,
            "direction": direction,
            "vehicle_class": vehicle_class,
            "speed_kmh": speed_kmh,
            "confidence": confidence,
            "plate": plate or ""
        }

        try:
            response = requests.post(
                "http://127.0.0.1:8000/ingest/event",
                json=payload,
                timeout=2
            )

            if response.status_code != 200:
                print(
                    f"Backend error: {response.status_code} "
                    f"{response.text}"
                )

        except requests.RequestException as e:
            print(
                f"Could not send event to backend: {e}"
            )

    def process_camera_step(self, camera_id: str):
        """Process one frame for a camera node through the complete AI pipeline."""
        cam_info = self.cameras[camera_id]
        frame_num = self.frame_counters[camera_id]
        self.frame_counters[camera_id] += 1

        # 1. Fetch / Generate Frame
        video_file = os.path.join(
            "data",
            "videos",
            f"{camera_id}.mp4"
        )

        if os.path.exists(video_file):
            cap = cv2.VideoCapture(video_file)
            cap.set(
                cv2.CAP_PROP_POS_FRAMES,
                frame_num % 450
            )

            ret, frame = cap.read()
            cap.release()

            if not ret or frame is None:
                frame = generate_frame_for_camera(
                    camera_id,
                    cam_info["name"],
                    frame_num
                )
        else:
            frame = generate_frame_for_camera(
                camera_id,
                cam_info["name"],
                frame_num
            )

        timestamp = datetime.utcnow()

        # 2. Vehicle Detection
        detections = self.detector.detect_vehicles(
            frame,
            camera_id,
            frame_num
        )

        # 3. Single-Camera Tracking
        tracker = self.trackers[camera_id]

        active_tracks = tracker.update(
            detections,
            camera_id,
            timestamp
        )

        # 4. ANPR & ReID Engine Pipeline per active track
        for trk in active_tracks:
            bbox = trk["bbox"]
            x, y, w, h = bbox
            crop = trk.get("crop")

            # License Plate Detection & OCR
            plate_res = self.ocr_engine.detect_and_read_plate(
                crop,
                camera_id,
                trk["track_id"]
            )

            plate_num = (
                plate_res["normalized_plate"]
                if plate_res
                else None
            )

            ocr_conf = (
                plate_res["ocr_confidence"]
                if plate_res
                else 0.0
            )

            # Cross-Camera ReID & Global Vehicle Identity Resolution
            reid_res = self.reid_engine.resolve_identity(
                camera_id=camera_id,
                track_id=trk["track_id"],
                vehicle_class=trk["vehicle_class"],
                plate=plate_num,
                ocr_confidence=ocr_conf,
                visual_features=trk.get("visual_features"),
                timestamp=timestamp,
                topology_graph=self.topology
            )

            global_id = reid_res["global_vehicle_id"]
            identity_plate = reid_res["plate"]

            # Estimate Vehicle Speed (km/h)
            speed_kmh = round(
                float(
                    cam_info["speed_limit_kmh"]
                    * (
                        0.85
                        + (hash(trk["track_id"]) % 30) / 100.0
                    )
                ),
                1
            )

            # Trajectory Reconstruction
            self.trajectory_engine.add_event(
                global_vehicle_id=global_id,
                camera_id=camera_id,
                camera_name=cam_info["name"],
                timestamp=timestamp,
                lat=cam_info["lat"],
                lng=cam_info["lng"],
                direction=cam_info["direction"],
                vehicle_class=trk["vehicle_class"],
                speed_kmh=speed_kmh,
                confidence=trk["confidence"],
                plate=identity_plate
            )

            # Send AI event to central FastAPI backend
            self._send_event_to_backend(
                global_vehicle_id=global_id,
                camera_id=camera_id,
                camera_name=cam_info["name"],
                timestamp=timestamp,
                lat=cam_info["lat"],
                lng=cam_info["lng"],
                direction=cam_info["direction"],
                vehicle_class=trk["vehicle_class"],
                speed_kmh=speed_kmh,
                confidence=trk["confidence"],
                plate=identity_plate
            )

            # Record Analytics Metrics
            self.analytics_engine.record_vehicle_observation(
                camera_id,
                speed_kmh,
                timestamp
            )

            # Anomaly Evaluation
            anomalies = self.anomaly_engine.evaluate_observation(
                global_vehicle_id=global_id,
                plate=identity_plate,
                camera_id=camera_id,
                timestamp=timestamp,
                speed_kmh=speed_kmh,
                speed_limit_kmh=cam_info["speed_limit_kmh"]
            )

            # Alert Generation
            self.alert_engine.evaluate_and_generate_alerts(
                plate=identity_plate,
                camera_id=camera_id,
                camera_name=cam_info["name"],
                vehicle_class=trk["vehicle_class"],
                confidence=trk["confidence"],
                anomalies=anomalies,
                timestamp=timestamp
            )

            # Draw AI Overlays
            cv2.rectangle(
                frame,
                (x, y),
                (x + w, y + h),
                (0, 255, 120),
                2
            )

            # Label banner
            label_text = f"{trk['track_id']} | {global_id}"

            if identity_plate:
                label_text += f" | {identity_plate}"

            (tw, th), _ = cv2.getTextSize(
                label_text,
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                1
            )

            cv2.rectangle(
                frame,
                (x, y - th - 8),
                (x + tw + 10, y),
                (0, 200, 100),
                -1
            )

            cv2.putText(
                frame,
                label_text,
                (x + 5, y - 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (10, 10, 10),
                1,
                cv2.LINE_AA
            )

        # Compute camera traffic metrics
        self.analytics_engine.compute_current_metrics(
            camera_id,
            len(active_tracks)
        )

        # Encode frame to JPEG
        _, jpeg = cv2.imencode(
            ".jpg",
            frame,
            [int(cv2.IMWRITE_JPEG_QUALITY), 80]
        )

        self.current_frames[camera_id] = jpeg.tobytes()

    def get_mjpeg_stream(
        self,
        camera_id: str
    ) -> Generator[bytes, None, None]:
        """Yield MJPEG multipart response stream for HTTP video endpoints."""
        while True:
            self.process_camera_step(camera_id)

            frame_bytes = self.current_frames.get(camera_id)

            if frame_bytes:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n"
                    + frame_bytes
                    + b"\r\n"
                )

            time.sleep(0.065)