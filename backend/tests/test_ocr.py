import pytest
from app.engine.plate_ocr import normalize_plate

def test_normalize_plate_variations():
    assert normalize_plate("ka 01 ab 1234") == "KA01AB1234"
    assert normalize_plate("KA-01-AB-1234") == "KA01AB1234"
    assert normalize_plate("ka.01.ab.1234") == "KA01AB1234"
    assert normalize_plate("MH12DE4321") == "MH12DE4321"

def test_normalize_invalid_plate():
    assert normalize_plate("XYZ") is None
    assert normalize_plate("") is None
