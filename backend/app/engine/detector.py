import cv2
import numpy as np
from typing import List, Dict, Any
from ultralytics import YOLO


class VehicleDetector:
    def __init__(self, confidence_threshold: float = 0.5):
        self.confidence_threshold = confidence_threshold

        # YOLO11 nano - lightweight model suitable for CPU
        self.yolo = YOLO("yolo11n.pt")

        # COCO vehicle classes
        self.vehicle_classes = {
            2: "car",
            3: "motorcycle",
            5: "bus",
            7: "truck",
        }

    def detect_vehicles(
        self,
        frame: np.ndarray,
        camera_id: str,
        frame_id: int
    ) -> List[Dict[str, Any]]:

        detections = []

        # ---------------------------------------------------------
        # 1. YOLO11n VEHICLE DETECTION
        # ---------------------------------------------------------
        try:
            results = self.yolo.predict(
                source=frame,
                conf=self.confidence_threshold,
                verbose=False,
                device="cpu"
            )

            for result in results:
                if result.boxes is None:
                    continue

                for box in result.boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])

                    # Only keep vehicle classes
                    if class_id not in self.vehicle_classes:
                        continue

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

                    # HSV histogram for the existing ReID system
                    hsv_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)

                    hist_h = cv2.calcHist(
                        [hsv_crop],
                        [0],
                        None,
                        [16],
                        [0, 180]
                    )

                    cv2.normalize(hist_h, hist_h)

                    feature_vector = hist_h.flatten().tolist()

                    detections.append({
                        "vehicle_class": self.vehicle_classes[class_id],
                        "confidence": round(confidence, 2),
                        "bbox": [x1, y1, w, h],
                        "camera_id": camera_id,
                        "frame_id": frame_id,
                        "aspect_ratio": round(w / float(h), 2),
                        "visual_features": feature_vector,
                        "crop": crop
                    })

        except Exception as e:
            print(f"[YOLO WARNING] Detection failed: {e}")

        # ---------------------------------------------------------
        # 2. FALLBACK TO EXISTING OPENCV DETECTOR
        # ---------------------------------------------------------
        # Your synthetic demo videos may not be recognized by
        # pretrained YOLO. Therefore we keep the old detector.
        if len(detections) == 0:
            detections = self._opencv_detect(
                frame,
                camera_id,
                frame_id
            )

        return detections

    def _opencv_detect(
        self,
        frame: np.ndarray,
        camera_id: str,
        frame_id: int
    ) -> List[Dict[str, Any]]:

        detections = []

        height, width, _ = frame.shape

        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]

        _, fg_mask = cv2.threshold(
            sat,
            25,
            255,
            cv2.THRESH_BINARY
        )

        _, val_mask = cv2.threshold(
            val,
            200,
            255,
            cv2.THRESH_BINARY
        )

        combined_mask = cv2.bitwise_or(
            fg_mask,
            val_mask
        )

        combined_mask[0:45, :] = 0
        combined_mask[420:480, :] = 0

        contours, _ = cv2.findContours(
            combined_mask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        for cnt in contours:

            area = cv2.contourArea(cnt)

            if area < 1800:
                continue

            x, y, w, h = cv2.boundingRect(cnt)

            aspect_ratio = w / float(h)

            if not (0.8 <= aspect_ratio <= 3.5):
                continue

            if area > 10000 or w > 160:
                v_class = "truck" if aspect_ratio > 1.6 else "bus"

            elif w < 90 and h < 55:
                v_class = "motorcycle"

            else:
                v_class = "car"

            crop = frame[y:y+h, x:x+w]

            hist_h = cv2.calcHist(
                [hsv[y:y+h, x:x+w]],
                [0],
                None,
                [16],
                [0, 180]
            )

            cv2.normalize(hist_h, hist_h)

            feature_vector = hist_h.flatten().tolist()

            confidence = min(
                0.98,
                0.70 + (area / 20000.0) * 0.25
            )

            detections.append({
                "vehicle_class": v_class,
                "confidence": round(float(confidence), 2),
                "bbox": [
                    int(x),
                    int(y),
                    int(w),
                    int(h)
                ],
                "camera_id": camera_id,
                "frame_id": frame_id,
                "aspect_ratio": round(
                    float(aspect_ratio),
                    2
                ),
                "visual_features": feature_vector,
                "crop": crop
            })

        return detections