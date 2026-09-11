from datetime import datetime
from typing import List, Dict, Any

import cv2
import numpy as np
from ultralytics import YOLO


class ByteTrackVehicleTracker:
    """
    YOLO11n + ByteTrack vehicle tracker.

    Keeps the same basic track structure expected by
    OCR, ReID and the rest of the existing pipeline.
    """

    def __init__(
        self,
        model_path: str = "yolo11n.pt",
        confidence_threshold: float = 0.25
    ):
        self.model = YOLO(model_path)
        self.confidence_threshold = confidence_threshold

        # COCO vehicle classes
        self.vehicle_classes = {
            2: "car",
            3: "motorcycle",
            5: "bus",
            7: "truck",
        }

        self.track_data = {}

    def update(
        self,
        frame: np.ndarray,
        camera_id: str,
        frame_id: int,
        timestamp: datetime
    ) -> List[Dict[str, Any]]:

        tracks = []

        try:
            results = self.model.track(
                source=frame,
                conf=self.confidence_threshold,
                persist=True,
                tracker="bytetrack.yaml",
                verbose=False,
                device="cpu"
            )

            if not results:
                return tracks

            result = results[0]

            if result.boxes is None:
                return tracks

            for box in result.boxes:

                if box.id is None:
                    continue

                class_id = int(box.cls[0])

                if class_id not in self.vehicle_classes:
                    continue

                confidence = float(box.conf[0])
                track_number = int(box.id[0])

                x1, y1, x2, y2 = box.xyxy[0].tolist()

                x1 = max(0, int(x1))
                y1 = max(0, int(y1))
                x2 = min(frame.shape[1], int(x2))
                y2 = min(frame.shape[0], int(y2))

                w = x2 - x1
                h = y2 - y1

                if w <= 0 or h <= 0:
                    continue

                crop = frame[y1:y2, x1:x2]

                # Visual feature for existing ReID engine
                hsv_crop = cv2.cvtColor(
                    crop,
                    cv2.COLOR_BGR2HSV
                )

                hist_h = cv2.calcHist(
                    [hsv_crop],
                    [0],
                    None,
                    [16],
                    [0, 180]
                )

                cv2.normalize(hist_h, hist_h)

                feature_vector = hist_h.flatten().tolist()

                track_id = f"BT-{camera_id}-{track_number:03d}"

                if track_id not in self.track_data:
                    self.track_data[track_id] = {
                        "trajectory_points": []
                    }

                center = (
                    x1 + w // 2,
                    y1 + h // 2
                )

                self.track_data[track_id][
                    "trajectory_points"
                ].append(center)

                # Keep trajectory history manageable
                if len(
                    self.track_data[track_id]["trajectory_points"]
                ) > 100:
                    self.track_data[track_id][
                        "trajectory_points"
                    ] = self.track_data[track_id][
                        "trajectory_points"
                    ][-100:]

                if "first_seen" not in self.track_data[track_id]:
                    self.track_data[track_id]["first_seen"] = timestamp

                self.track_data[track_id]["last_seen"] = timestamp

                tracks.append({
                    "track_id": track_id,
                    "camera_id": camera_id,
                    "vehicle_class": self.vehicle_classes[class_id],
                    "confidence": round(confidence, 2),
                    "bbox": [x1, y1, w, h],
                    "first_seen": self.track_data[track_id]["first_seen"],
                    "last_seen": timestamp,
                    "lost_frames": 0,
                    "trajectory_points": self.track_data[track_id][
                        "trajectory_points"
                    ],
                    "visual_features": feature_vector,
                    "crop": crop
                })

        except Exception as e:
            print(f"[BYTETRACK WARNING] {e}")

        return tracks
    