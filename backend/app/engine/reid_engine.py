import numpy as np
from datetime import datetime
from typing import Dict, List, Any, Optional
import difflib

def levenshtein_similarity(str1: str, str2: str) -> float:
    """Compute normalized similarity ratio between two strings."""
    if not str1 or not str2:
        return 0.0
    if str1 == str2:
        return 1.0
    return difflib.SequenceMatcher(None, str1, str2).ratio()

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Compute cosine similarity between two feature vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    a = np.array(v1)
    b = np.array(v2)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

class VehicleReIDEngine:
    def __init__(
        self,
        weight_plate: float = 0.50,
        weight_appearance: float = 0.20,
        weight_class: float = 0.15,
        weight_route: float = 0.08,
        weight_time: float = 0.07,
        match_threshold: float = 0.65
    ):
        self.w_plate = weight_plate
        self.w_app = weight_appearance
        self.w_class = weight_class
        self.w_route = weight_route
        self.w_time = weight_time
        self.match_threshold = match_threshold

        self.vehicles = {} # global_vehicle_id -> vehicle dict
        self.plate_index = {} # normalized_plate -> global_vehicle_id
        self.next_vehicle_id = 1

    def resolve_identity(
        self,
        camera_id: str,
        track_id: str,
        vehicle_class: str,
        plate: Optional[str],
        ocr_confidence: float,
        visual_features: Optional[List[float]],
        timestamp: datetime,
        topology_graph: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Any]:
        """
        Associate observation with an existing global vehicle ID or generate a new one.
        Returns: { global_vehicle_id, match_score, is_new_identity }
        """
        best_match_id = None
        best_score = 0.0

        # Fast path: Exact normalized plate match
        if plate and plate in self.plate_index:
            exact_id = self.plate_index[plate]
            veh = self.vehicles[exact_id]
            veh["last_seen"] = timestamp
            veh["observation_count"] += 1
            if camera_id not in veh["cameras_visited"]:
                veh["cameras_visited"].append(camera_id)
                
            return {
                "global_vehicle_id": exact_id,
                "identity_score": 0.98,
                "is_new": False,
                "plate": plate
            }

        # Multi-signal scoring against active global vehicle identities
        for v_id, veh in self.vehicles.items():
            # 1. Plate similarity score
            plate_sim = levenshtein_similarity(plate, veh.get("plate", ""))
            
            # 2. Visual appearance feature similarity
            app_sim = cosine_similarity(visual_features, veh.get("visual_features", []))
            
            # 3. Class match
            class_sim = 1.0 if vehicle_class.lower() == veh["vehicle_class"].lower() else 0.0
            
            # 4. Route feasibility check
            last_cam = veh["cameras_visited"][-1] if veh["cameras_visited"] else None
            route_sim = 1.0
            if topology_graph and last_cam:
                connected = topology_graph.get(last_cam, [])
                route_sim = 1.0 if camera_id in connected or camera_id == last_cam else 0.40

            # 5. Time consistency
            elapsed_sec = (timestamp - veh["last_seen"]).total_seconds()
            time_sim = 1.0 if 1.0 <= elapsed_sec <= 300.0 else 0.60

            # Composite Identity Score
            score = (
                plate_sim * self.w_plate +
                app_sim * self.w_app +
                class_sim * self.w_class +
                route_sim * self.w_route +
                time_sim * self.w_time
            )

            if score > best_score and score >= self.match_threshold:
                best_score = score
                best_match_id = v_id

        if best_match_id:
            veh = self.vehicles[best_match_id]
            veh["last_seen"] = timestamp
            veh["observation_count"] += 1
            if plate and not veh.get("plate"):
                veh["plate"] = plate
                self.plate_index[plate] = best_match_id
            if camera_id not in veh["cameras_visited"]:
                veh["cameras_visited"].append(camera_id)

            return {
                "global_vehicle_id": best_match_id,
                "identity_score": round(best_score, 2),
                "is_new": False,
                "plate": veh.get("plate", plate)
            }
        else:
            # Assign new global vehicle ID
            new_id = f"VEH-{self.next_vehicle_id:06d}"
            self.next_vehicle_id += 1

            new_vehicle = {
                "global_vehicle_id": new_id,
                "plate": plate,
                "vehicle_class": vehicle_class,
                "visual_features": visual_features,
                "first_seen": timestamp,
                "last_seen": timestamp,
                "observation_count": 1,
                "cameras_visited": [camera_id]
            }

            self.vehicles[new_id] = new_vehicle
            if plate:
                self.plate_index[plate] = new_id

            return {
                "global_vehicle_id": new_id,
                "identity_score": 1.00,
                "is_new": True,
                "plate": plate
            }
