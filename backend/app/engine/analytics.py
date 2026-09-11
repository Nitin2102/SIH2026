from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple

class TrafficAnalyticsEngine:
    def __init__(self, camera_configs: Dict[str, Dict[str, Any]], road_configs: List[Dict[str, Any]]):
        self.cameras = camera_configs
        self.roads = road_configs
        self.camera_counts = {c_id: 0 for c_id in self.cameras}
        self.camera_speeds = {c_id: [] for c_id in self.cameras}
        self.od_matrix = {} # (origin, dest) -> { count, total_time_sec }
        self.metric_history = {c_id: [] for c_id in self.cameras}

    def record_vehicle_observation(self, camera_id: str, speed_kmh: float, timestamp: datetime):
        """Update live camera counter and speed log."""
        if camera_id in self.camera_counts:
            self.camera_counts[camera_id] += 1
            self.camera_speeds[camera_id].append((timestamp, speed_kmh))

    def record_od_trip(self, origin_cam: str, dest_cam: str, travel_time_sec: float):
        """Record completed origin-destination trip."""
        pair = (origin_cam, dest_cam)
        if pair not in self.od_matrix:
            self.od_matrix[pair] = {"count": 0, "total_time_sec": 0.0}
        self.od_matrix[pair]["count"] += 1
        self.od_matrix[pair]["total_time_sec"] += travel_time_sec

    def compute_current_metrics(self, camera_id: str, active_track_count: int) -> Dict[str, Any]:
        """Compute real-time density, speed, and congestion classification for a camera."""
        cam_info = self.cameras.get(camera_id, {})
        speed_limit = cam_info.get("speed_limit_kmh", 50.0)
        ref_dist_m = cam_info.get("reference_distance_m", 20.0)

        now = datetime.utcnow()
        recent_cutoff = now - timedelta(seconds=60)
        recent_speeds = [s for t, s in self.camera_speeds.get(camera_id, []) if t >= recent_cutoff]

        avg_speed = sum(recent_speeds) / float(len(recent_speeds)) if recent_speeds else speed_limit * 0.85
        
        # Density (veh / km): active_track_count / (ref_distance in km)
        ref_dist_km = ref_dist_m / 1000.0
        density_veh_km = active_track_count / ref_dist_km if ref_dist_km > 0 else 0.0
        
        # Flow (veh / min)
        flow_veh_min = self.camera_counts.get(camera_id, 0) / 5.0 # normalized 5-min window
        
        # Occupancy %
        occupancy_pct = min(100.0, (active_track_count * 5.0 / ref_dist_m) * 100.0)

        # Congestion Classification
        speed_ratio = avg_speed / speed_limit
        if speed_ratio < 0.30 or active_track_count > 15:
            congestion_level = "SEVERE"
        elif speed_ratio < 0.55 or active_track_count > 10:
            congestion_level = "HEAVY"
        elif speed_ratio < 0.80 or active_track_count > 5:
            congestion_level = "MODERATE"
        else:
            congestion_level = "FREE"

        metric = {
            "camera_id": camera_id,
            "timestamp": now,
            "vehicle_count": active_track_count,
            "density_veh_km": round(density_veh_km, 1),
            "flow_veh_min": round(flow_veh_min, 1),
            "avg_speed_kmh": round(avg_speed, 1),
            "congestion_level": congestion_level,
            "occupancy_pct": round(occupancy_pct, 1)
        }

        self.metric_history[camera_id].append(metric)
        return metric

    def get_ranked_bottlenecks(self) -> List[Dict[str, Any]]:
        """Rank cameras by congestion level and low average speed."""
        bottlenecks = []
        for c_id, cam_info in self.cameras.items():
            metrics = self.metric_history.get(c_id, [])
            if not metrics:
                continue
            latest = metrics[-1]
            if latest["congestion_level"] in ["MODERATE", "HEAVY", "SEVERE"]:
                score = (latest["vehicle_count"] * 2.0) + (100.0 - latest["avg_speed_kmh"])
                bottlenecks.append({
                    "camera_id": c_id,
                    "camera_name": cam_info.get("name", c_id),
                    "congestion_level": latest["congestion_level"],
                    "avg_speed_kmh": latest["avg_speed_kmh"],
                    "vehicle_count": latest["vehicle_count"],
                    "bottleneck_score": round(score, 1)
                })

        return sorted(bottlenecks, key=lambda x: x["bottleneck_score"], reverse=True)

    def get_od_matrix_grid(self) -> List[Dict[str, Any]]:
        """Format origin-destination matrix for dashboard visualization."""
        od_list = []
        for (origin, dest), data in self.od_matrix.items():
            avg_time = data["total_time_sec"] / float(data["count"]) if data["count"] > 0 else 0.0
            od_list.append({
                "origin_camera_id": origin,
                "destination_camera_id": dest,
                "count": data["count"],
                "avg_travel_time_sec": round(avg_time, 1)
            })
        return od_list

    def get_heatmap_data(self, mode: str = "density") -> List[Dict[str, Any]]:
        """Generate GIS heatmap points based on selected metric mode."""
        points = []
        for c_id, cam_info in self.cameras.items():
            metrics = self.metric_history.get(c_id, [])
            val = 0.5
            if metrics:
                latest = metrics[-1]
                if mode == "density":
                    val = min(1.0, latest["density_veh_km"] / 100.0)
                elif mode == "congestion":
                    levels = {"FREE": 0.2, "MODERATE": 0.5, "HEAVY": 0.8, "SEVERE": 1.0}
                    val = levels.get(latest["congestion_level"], 0.3)
                elif mode == "speed":
                    val = max(0.1, 1.0 - (latest["avg_speed_kmh"] / cam_info.get("speed_limit_kmh", 60.0)))
                    
            points.append({
                "camera_id": c_id,
                "lat": cam_info["lat"],
                "lng": cam_info["lng"],
                "intensity": round(val, 2)
            })

        return points
