import pytest
from datetime import datetime
from app.engine.analytics import TrafficAnalyticsEngine

def test_traffic_analytics_congestion():
    cams = {
        "CAM-01": {"name": "North Gate", "speed_limit_kmh": 60, "reference_distance_m": 25, "lat": 12.98, "lng": 77.59}
    }
    roads = []
    engine = TrafficAnalyticsEngine(cams, roads)
    
    # Low track count -> FREE
    m1 = engine.compute_current_metrics("CAM-01", 2)
    assert m1["congestion_level"] in ["FREE", "MODERATE"]

    # High track count -> SEVERE
    m2 = engine.compute_current_metrics("CAM-01", 25)
    assert m2["congestion_level"] in ["HEAVY", "SEVERE"]
