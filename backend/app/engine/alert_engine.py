import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable

class AlertEngine:
    def __init__(self):
        self.watchlist = {
            "KA01AB1234": {"description": "High Interest Vehicle - Watchlist Target 1", "priority": "CRITICAL", "active": True},
            "KA02CD5678": {"description": "Stolen Vehicle Report #9012", "priority": "HIGH", "active": True},
            "KA03EF9012": {"description": "Traffic Citation Compliance Order", "priority": "MEDIUM", "active": True}
        }
        self.alerts_history = []
        self.ws_subscribers: List[Callable[[Dict[str, Any]], None]] = []

    def register_subscriber(self, callback: Callable[[Dict[str, Any]], None]):
        self.ws_subscribers.append(callback)

    def add_to_watchlist(self, plate: str, description: str, priority: str = "HIGH") -> Dict[str, Any]:
        entry = {"description": description, "priority": priority.upper(), "active": True, "created_at": datetime.utcnow().isoformat()}
        self.watchlist[plate.upper()] = entry
        return entry

    def remove_from_watchlist(self, plate: str) -> bool:
        if plate.upper() in self.watchlist:
            del self.watchlist[plate.upper()]
            return True
        return False

    def evaluate_and_generate_alerts(
        self,
        plate: Optional[str],
        camera_id: str,
        camera_name: str,
        vehicle_class: str,
        confidence: float,
        anomalies: List[Dict[str, Any]],
        timestamp: datetime
    ) -> List[Dict[str, Any]]:
        """Evaluate observation against watchlist and anomaly findings."""
        generated = []

        # 1. Watchlist Match Check
        if plate and plate.upper() in self.watchlist:
            w_entry = self.watchlist[plate.upper()]
            if w_entry.get("active", True):
                alert = {
                    "id": len(self.alerts_history) + 1,
                    "plate": plate.upper(),
                    "camera_id": camera_id,
                    "camera_name": camera_name,
                    "timestamp": timestamp.isoformat(),
                    "vehicle_class": vehicle_class,
                    "alert_type": "Watchlist Match",
                    "priority": w_entry["priority"],
                    "description": f"ALERT: Watchlist Match detected for plate {plate.upper()} - {w_entry['description']}",
                    "confidence": round(float(confidence), 2),
                    "acknowledged": False
                }
                generated.append(alert)

        # 2. Anomaly Alerts
        for anomaly in anomalies:
            alert = {
                "id": len(self.alerts_history) + len(generated) + 1,
                "plate": plate.upper() if plate else "UNREGISTERED",
                "camera_id": camera_id,
                "camera_name": camera_name,
                "timestamp": timestamp.isoformat(),
                "vehicle_class": vehicle_class,
                "alert_type": anomaly["anomaly_type"],
                "priority": anomaly["priority"],
                "description": f"ANOMALY DETECTED at {camera_name}: {anomaly['description']}",
                "confidence": anomaly["confidence"],
                "acknowledged": False
            }
            generated.append(alert)

        # Store and broadcast generated alerts
        for a in generated:
            self.alerts_history.append(a)
            for sub in self.ws_subscribers:
                try:
                    sub(a)
                except Exception as e:
                    pass

        return generated
