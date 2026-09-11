from datetime import datetime, timedelta
import pytest
from app.engine.reid_engine import VehicleReIDEngine, levenshtein_similarity, cosine_similarity

def test_levenshtein_similarity():
    assert levenshtein_similarity("KA01AB1234", "KA01AB1234") == 1.0
    assert levenshtein_similarity("KA01AB1234", "KA01AB1235") > 0.85
    assert levenshtein_similarity("KA01AB1234", "MH12DE4321") < 0.40

def test_reid_exact_plate_match():
    reid = VehicleReIDEngine()
    now = datetime.utcnow()
    
    res1 = reid.resolve_identity("CAM-01", "TRACK-001", "car", "KA01AB1234", 0.95, [0.5]*16, now)
    assert res1["is_new"] is True
    v_id = res1["global_vehicle_id"]

    res2 = reid.resolve_identity("CAM-03", "TRACK-015", "car", "KA01AB1234", 0.92, [0.5]*16, now + timedelta(seconds=120))
    assert res2["is_new"] is False
    assert res2["global_vehicle_id"] == v_id
