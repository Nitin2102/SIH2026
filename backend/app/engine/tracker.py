import numpy as np
from datetime import datetime
from typing import List, Dict, Any

def compute_iou(box1: List[int], box2: List[int]) -> float:
    """Compute Intersection over Union (IoU) between two bounding boxes [x, y, w, h]."""
    x1, y1, w1, h1 = box1
    x2, y2, w2, h2 = box2

    xi1 = max(x1, x2)
    yi1 = max(y1, y2)
    xi2 = min(x1 + w1, x2 + w2)
    yi2 = min(y1 + h1, y2 + h2)

    inter_w = max(0, xi2 - xi1)
    inter_h = max(0, yi2 - yi1)
    inter_area = inter_w * inter_h

    box1_area = w1 * h1
    box2_area = w2 * h2
    union_area = box1_area + box2_area - inter_area

    if union_area <= 0:
        return 0.0
    return inter_area / float(union_area)

class MultiObjectTracker:
    def __init__(self, iou_threshold: float = 0.3, max_lost_frames: int = 15):
        self.iou_threshold = iou_threshold
        self.max_lost_frames = max_lost_frames
        self.tracks = {} # track_id -> track dict
        self.next_track_num = 1

    def update(self, detections: List[Dict[str, Any]], camera_id: str, timestamp: datetime) -> List[Dict[str, Any]]:
        """Update active tracks with new frame detections."""
        updated_tracks = []
        unmatched_detections = list(range(len(detections)))
        
        # Increment lost frame count for existing tracks
        for t_id, track in self.tracks.items():
            track["lost_frames"] += 1

        # Match existing active tracks with new detections using IoU
        for t_id, track in list(self.tracks.items()):
            best_iou = 0.0
            best_det_idx = -1

            for d_idx in unmatched_detections:
                det = detections[d_idx]
                iou = compute_iou(track["bbox"], det["bbox"])
                if iou > best_iou and iou >= self.iou_threshold:
                    best_iou = iou
                    best_det_idx = d_idx

            if best_det_idx >= 0:
                det = detections[best_det_idx]
                unmatched_detections.remove(best_det_idx)
                
                # Update track info
                track["bbox"] = det["bbox"]
                track["last_seen"] = timestamp
                track["lost_frames"] = 0
                track["confidence"] = max(track["confidence"], det["confidence"])
                track["trajectory_points"].append((det["bbox"][0] + det["bbox"][2]//2, det["bbox"][1] + det["bbox"][3]//2))
                track["visual_features"] = det.get("visual_features", track.get("visual_features"))
                track["crop"] = det.get("crop", track.get("crop"))
                
                updated_tracks.append(track)

        # Create new tracks for unmatched detections
        for d_idx in unmatched_detections:
            det = detections[d_idx]
            track_id = f"TRACK-{self.next_track_num:03d}"
            self.next_track_num += 1
            
            new_track = {
                "track_id": track_id,
                "camera_id": camera_id,
                "vehicle_class": det["vehicle_class"],
                "confidence": det["confidence"],
                "bbox": det["bbox"],
                "first_seen": timestamp,
                "last_seen": timestamp,
                "lost_frames": 0,
                "trajectory_points": [(det["bbox"][0] + det["bbox"][2]//2, det["bbox"][1] + det["bbox"][3]//2)],
                "visual_features": det.get("visual_features"),
                "crop": det.get("crop")
            }
            self.tracks[track_id] = new_track
            updated_tracks.append(new_track)

        # Clean up stale lost tracks
        for t_id, track in list(self.tracks.items()):
            if track["lost_frames"] > self.max_lost_frames:
                del self.tracks[t_id]

        return updated_tracks
