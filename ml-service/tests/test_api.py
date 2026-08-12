"""Basic ML service tests"""
import pytest
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    from app import app
    client = TestClient(app)
    MODELS_LOADED = True
except Exception:
    MODELS_LOADED = False

@pytest.mark.skipif(not MODELS_LOADED, reason="Models not available")
class TestMLService:
    def test_health(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"
        assert "1D-CNN" in r.json()["models"]

    def test_predict_rf(self):
        payload = {
            "data": {"Flow Duration": -0.516, "Flow IAT Mean": -0.327,
                     "Flow IAT Std": -0.418, "Fwd Packet Length Mean": -0.411},
            "model_type": "RF",
            "ip_address": "10.0.0.5",
            "pre_normalized": True,
        }
        r = client.post("/predict", json=payload)
        assert r.status_code == 200
        body = r.json()
        assert body["prediction"] in ["BENIGN", "DoS", "BruteForce", "PortScan", "WebAttack"]
        assert 0 <= body["confidence"] <= 100
        assert body["response_time_ms"] > 0

    def test_predict_invalid_model(self):
        payload = {"data": {}, "model_type": "INVALID"}
        r = client.post("/predict", json=payload)
        assert r.status_code == 422

    def test_root(self):
        r = client.get("/")
        assert r.status_code == 200
        assert "IDS ML Service" in r.json()["message"]
