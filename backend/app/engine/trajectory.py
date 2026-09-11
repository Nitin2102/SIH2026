from datetime import datetime
from typing import List, Dict, Any, Optional

class TrajectoryEngine:
    def __init__(self):
        self.trajectories = {} # global_vehicle_id -> list of event dicts

    def add_event(
        self,
        global_vehicle_id: str,
        camera_id: str,
        camera_name: str,
        timestamp: datetime,
        lat: float,
        lng: float,
        direction: str,
        vehicle_class: str,
        speed_kmh: float,
        confidence: float,
        plate: Optional[str] = None
    ) -> Dict[str, Any]:
        """Record trajectory observation event."""
        if global_vehicle_id not in self.trajectories:
            self.trajectories[global_vehicle_id] = []

        event = {
            "global_vehicle_id": global_vehicle_id,
            "camera_id": camera_id,
            "camera_name": camera_name,
            "timestamp": timestamp,
            "lat": lat,
            "lng": lng,
            "direction": direction,
            "vehicle_class": vehicle_class,
            "speed_kmh": round(float(speed_kmh), 1),
            "confidence": round(float(confidence), 2),
            "plate": plate
        }

        # Deduplicate consecutive identical camera events within short time window (<3 sec)
        events = self.trajectories[global_vehicle_id]
        if events and events[-1]["camera_id"] == camera_id:
            time_delta = (timestamp - events[-1]["timestamp"]).total_seconds()
            if time_delta < 3.0:
                events[-1]["speed_kmh"] = max(events[-1]["speed_kmh"], round(float(speed_kmh), 1))
                events[-1]["timestamp"] = timestamp
                return events[-1]

        events.append(event)
        return event

    def get_trajectory(self, global_vehicle_id: str) -> List[Dict[str, Any]]:
        """Return chronologically sorted trajectory events for a vehicle."""
        events = self.trajectories.get(global_vehicle_id, [])
        return sorted(events, key=lambda x: x["timestamp"])

    def get_journey_summary(self, global_vehicle_id: str) -> Dict[str, Any]:
        """Compute journey metrics (first seen, last seen, camera sequence, duration)."""
        events = self.get_trajectory(global_vehicle_id)
        if not events:
            return {}

        first_seen = events[0]["timestamp"]
        last_seen = events[-1]["timestamp"]
        duration_sec = (last_seen - first_seen).total_seconds()

        visited_cameras = []
        for e in events:
            if not visited_cameras or visited_cameras[-1]["camera_id"] != e["camera_id"]:
                visited_cameras.append({
                    "camera_id": e["camera_id"],
                    "camera_name": e["camera_name"],
                    "timestamp": e["timestamp"],
                    "speed_kmh": e["speed_kmh"]
                })

        avg_speed = sum(e["speed_kmh"] for e in events) / float(len(events))

        return {
            "global_vehicle_id": global_vehicle_id,
            "plate": events[0].get("plate"),
            "vehicle_class": events[0]["vehicle_class"],
            "first_seen": first_seen,
            "last_seen": last_seen,
            "duration_sec": round(duration_sec, 1),
            "total_observations": len(events),
            "cameras_visited": visited_cameras,
            "avg_speed_kmh": round(avg_speed, 1),
            "events": events
        }
