import cv2
import numpy as np
from typing import List, Dict, Any, Tuple

class VehicleDetector:
    def __init__(self, confidence_threshold: float = 0.5):
        self.confidence_threshold = confidence_threshold

    def detect_vehicles(self, frame: np.ndarray, camera_id: str, frame_id: int) -> List[Dict[str, Any]]:
        """
        Detect vehicles in frame. Returns structured list of detections.
        Each detection contains:
        vehicle_class, confidence, bounding_box [x, y, w, h], camera_id, frame_id, visual_features
        """
        detections = []
        height, width, _ = frame.shape
        
        # Convert to HSV to identify vehicle bodies (excluding road and roadside)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Mask out asphalt road background (gray/black background with low saturation)
        # Non-road objects typically have higher saturation or distinct brightness
        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]
        
        # Threshold for foreground object candidate blobs
        _, fg_mask = cv2.threshold(sat, 25, 255, cv2.THRESH_BINARY)
        # Also catch non-gray vehicles like white/bright silver plates/cars
        _, val_mask = cv2.threshold(val, 200, 255, cv2.THRESH_BINARY)
        combined_mask = cv2.bitwise_or(fg_mask, val_mask)
        
        # Mask top title bar & bottom margin
        combined_mask[0:45, :] = 0
        combined_mask[420:480, :] = 0

        # Find contours
        contours, _ = cv2.findContours(combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for i, cnt in enumerate(contours):
            area = cv2.contourArea(cnt)
            if area < 1800: # Filter small noise
                continue
                
            x, y, w, h = cv2.boundingRect(cnt)
            aspect_ratio = w / float(h)
            
            # Filter unrealistically shaped blobs
            if not (0.8 <= aspect_ratio <= 3.5):
                continue
                
            # Classify based on bounding box dimension and aspect ratio
            if area > 10000 or w > 160:
                v_class = "truck" if aspect_ratio > 1.6 else "bus"
            elif w < 90 and h < 55:
                v_class = "motorcycle"
            else:
                v_class = "car"
                
            # Extract color histogram feature vector for ReID
            crop = frame[y:y+h, x:x+w]
            hist_h = cv2.calcHist([hsv[y:y+h, x:x+w]], [0], None, [16], [0, 180])
            cv2.normalize(hist_h, hist_h)
            feature_vector = hist_h.flatten().tolist()
            
            confidence = min(0.98, 0.70 + (area / 20000.0) * 0.25)
            
            detections.append({
                "vehicle_class": v_class,
                "confidence": round(float(confidence), 2),
                "bbox": [int(x), int(y), int(w), int(h)],
                "camera_id": camera_id,
                "frame_id": frame_id,
                "aspect_ratio": round(float(aspect_ratio), 2),
                "visual_features": feature_vector,
                "crop": crop
            })

        return detections
