from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple


class AnomalyEngine:
    def __init__(
        self,
        topology_graph: Dict[str, List[str]],
        min_travel_times_sec: Dict[Tuple[str, str], float]
    ):
        self.topology = topology_graph
        self.min_travel_times = min_travel_times_sec
        self.last_observation = {}

    def evaluate_observation(
        self,
        global_vehicle_id: str,
        plate: Optional[str],
        camera_id: str,
        timestamp: datetime,
        speed_kmh: float,
        speed_limit_kmh: float
    ) -> List[Dict[str, Any]]:
        """Evaluate observation for route, travel-time, and speed anomalies."""

        anomalies = []

        # 1. Excessive Speed Anomaly
        if speed_kmh > (speed_limit_kmh * 1.45):
            anomalies.append({
                "anomaly_type": "Speed Anomaly",
                "priority": "MEDIUM",
                "description": (
                    f"Vehicle speed {speed_kmh:.1f} km/h significantly "
                    f"exceeded speed limit {speed_limit_kmh:.0f} km/h."
                ),
                "confidence": 0.92
            })

        # Check against previous observation
        if global_vehicle_id in self.last_observation:
            prev_cam, prev_time, prev_speed = (
                self.last_observation[global_vehicle_id]
            )

            elapsed_sec = (
                timestamp - prev_time
            ).total_seconds()

            if prev_cam != camera_id:

                # 2. Travel-Time Anomaly
                min_time = self.min_travel_times.get(
                    (prev_cam, camera_id),
                    12.0
                )

                if elapsed_sec < (min_time * 0.40):
                    anomalies.append({
                        "anomaly_type": "Travel-time Anomaly",
                        "priority": "HIGH",
                        "description": (
                            f"Impossible rapid traversal between "
                            f"{prev_cam} and {camera_id} "
                            f"({elapsed_sec:.1f}s vs expected min "
                            f"{min_time:.1f}s)."
                        ),
                        "confidence": 0.95
                    })

                # 3. Disconnected Route Anomaly
                connected = self.topology.get(
                    prev_cam,
                    []
                )

                reverse_connected = self.topology.get(
                    camera_id,
                    []
                )

                if (
                    camera_id not in connected
                    and prev_cam not in reverse_connected
                ):
                    anomalies.append({
                        "anomaly_type": "Route Anomaly",
                        "priority": "MEDIUM",
                        "description": (
                            f"Vehicle jumped across non-connected "
                            f"road topology from {prev_cam} "
                            f"to {camera_id}."
                        ),
                        "confidence": 0.88
                    })

        # Store latest observation
        self.last_observation[global_vehicle_id] = (
            camera_id,
            timestamp,
            speed_kmh
        )

        return anomalies