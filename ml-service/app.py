"""
ML Microservice for IDS — Handles model inference only.
No auth, no DB, no email — those belong to the Node.js backend.
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd
import pickle
import time
import os
import io
import warnings

warnings.filterwarnings("ignore", category=UserWarning)
import tensorflow as tf

app = FastAPI(
    title="IDS ML Service",
    description="Machine Learning inference service for Network Intrusion Detection",
    version="2.0.0",
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ── Load models and artifacts ──────────────────────────────────────
try:
    with open(os.path.join(MODELS_DIR, "scaler.pkl"), "rb") as f:
        scaler = pickle.load(f)
    with open(os.path.join(MODELS_DIR, "label_encoder.pkl"), "rb") as f:
        label_encoder = pickle.load(f)
    with open(os.path.join(MODELS_DIR, "feature_columns.pkl"), "rb") as f:
        feature_columns = pickle.load(f)

    rf_model = pickle.load(open(os.path.join(MODELS_DIR, "rf_model.pkl"), "rb"))

    xgb_path = os.path.join(MODELS_DIR, "xgb_model.pkl")
    xgb_model = pickle.load(open(xgb_path, "rb")) if os.path.exists(xgb_path) else None

    cnn_model = tf.keras.models.load_model(
        os.path.join(MODELS_DIR, "cnn_model.keras"), compile=False
    )

    print(f"✅ Models loaded. Classes: {list(label_encoder.classes_)}")
    print(f"   Features: {len(feature_columns)}, CNN input: {cnn_model.input_shape}")
except Exception as e:
    print(f"❌ Model loading error: {e}")
    raise

# Sliding window features
SW_FEATURES = [
    f for f in [
        "Flow Bytes/s", "Flow IAT Mean", "Flow IAT Std", "Flow Duration",
        "SYN Flag Count", "Fwd Packet Length Mean", "Bwd Packet Length Mean",
        "Avg Packet Size", "Flow Packets/s", "Init Fwd Win Bytes",
        "Init Bwd Win Bytes", "Packet Length Variance",
    ] if f in feature_columns
]


# ── Preprocessing ──────────────────────────────────────────────────
def preprocess(data_dict: dict, pre_normalized: bool = False) -> np.ndarray:
    """Convert input dict to model-ready feature vector with sliding window."""
    df = pd.DataFrame([data_dict])

    # Align columns
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0
    df = df[feature_columns]

    # Scale
    X = df.values.astype(np.float32) if pre_normalized else scaler.transform(df)

    # Sliding window features (single sample: mean=val, std=0, max=val)
    sw_extra = []
    for feat in SW_FEATURES:
        idx = feature_columns.index(feat)
        val = float(X[0, idx])
        sw_extra.extend([val, 0.0, val])

    X_sw = np.concatenate(
        [X, np.array([sw_extra], dtype=np.float32)], axis=1
    ).astype(np.float32)

    return X_sw


def run_inference(X_sw: np.ndarray, model_type: str) -> tuple:
    """Run model inference, return (prediction, confidence, probabilities)."""
    if model_type == "RF":
        prob = rf_model.predict_proba(X_sw)[0]
    elif model_type == "XGB":
        if xgb_model is None:
            raise ValueError("XGBoost model not available")
        prob = xgb_model.predict_proba(X_sw)[0]
    else:  # 1D-CNN
        X_cnn = X_sw.reshape(1, X_sw.shape[1], 1)
        prob = cnn_model.predict(X_cnn, verbose=0)[0]

    idx = int(np.argmax(prob))
    prediction = label_encoder.classes_[idx]
    confidence = float(np.max(prob)) * 100
    probabilities = {
        label_encoder.classes_[i]: round(float(prob[i]) * 100, 2)
        for i in range(len(label_encoder.classes_))
    }
    return prediction, confidence, probabilities


# ── Request/Response Models ────────────────────────────────────────
class PredictRequest(BaseModel):
    data: dict
    model_type: str = Field(default="1D-CNN", pattern="^(1D-CNN|RF|XGB)$")
    ip_address: str = "127.0.0.1"
    pre_normalized: bool = False


class PredictResponse(BaseModel):
    prediction: str
    confidence: float
    response_time_ms: float
    probabilities: dict
    model_type: str


# ── Endpoints ──────────────────────────────────────────────────────
@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    start = time.time()
    try:
        X_sw = preprocess(req.data, req.pre_normalized)
        prediction, confidence, probabilities = run_inference(X_sw, req.model_type)
        elapsed = round((time.time() - start) * 1000, 2)

        return PredictResponse(
            prediction=prediction,
            confidence=round(confidence, 2),
            response_time_ms=elapsed,
            probabilities=probabilities,
            model_type=req.model_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch-analysis")
async def batch_analysis(file: UploadFile = File(...), model_type: str = "1D-CNN"):
    try:
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))

        # Detect label column
        label_cols = ["Label", "label", "Class", "class", "LABEL"]
        true_labels = None
        for lc in label_cols:
            if lc in df.columns:
                true_labels = df[lc].tolist()
                df = df.drop(columns=[lc])
                break

        results = []
        for _, row in df.iterrows():
            try:
                X_sw = preprocess(row.to_dict(), False)
                pred, conf, probs = run_inference(X_sw, model_type)
                results.append({"prediction": pred, "confidence": conf})
            except Exception:
                results.append({"prediction": "ERROR", "confidence": 0})

        # Class distribution
        dist = {}
        for r in results:
            dist[r["prediction"]] = dist.get(r["prediction"], 0) + 1

        correct = 0
        if true_labels:
            correct = sum(
                1 for i, r in enumerate(results)
                if i < len(true_labels) and r["prediction"] == str(true_labels[i])
            )

        return {
            "total_rows": len(results),
            "class_distribution": dist,
            "correct_predictions": correct if true_labels else None,
            "accuracy": round(correct / len(results) * 100, 2) if true_labels else None,
            "results": results[:200],
            "model_type": model_type,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/explain")
async def explain(req: PredictRequest):
    try:
        import shap

        X_sw = preprocess(req.data, req.pre_normalized)
        X_cnn = X_sw.reshape(1, X_sw.shape[1], 1)

        background = np.zeros((50, X_sw.shape[1], 1), dtype=np.float32)
        explainer = shap.DeepExplainer(cnn_model, background)
        shap_values = explainer.shap_values(X_cnn)

        prob = cnn_model.predict(X_cnn, verbose=0)[0]
        pred_idx = int(np.argmax(prob))
        pred_class = label_encoder.classes_[pred_idx]

        shap_clean = np.array(shap_values).squeeze()
        if shap_clean.ndim == 3:
            shap_clean = shap_clean[0]

        # Feature names
        sw_names = []
        for f in SW_FEATURES:
            sw_names.extend([f"SW_mean_{f}", f"SW_std_{f}", f"SW_max_{f}"])
        all_names = list(feature_columns) + sw_names

        class_shap = shap_clean[:, pred_idx]
        top_idx = np.argsort(np.abs(class_shap))[-12:][::-1]

        explanations = []
        for i in top_idx:
            name = all_names[i] if i < len(all_names) else f"Feature_{i}"
            explanations.append({
                "feature": name,
                "shap_value": round(float(class_shap[i]), 6),
                "direction": "positive" if class_shap[i] > 0 else "negative",
            })

        return {
            "prediction": pred_class,
            "confidence": round(float(np.max(prob)) * 100, 2),
            "explanations": explanations,
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/health")
def health():
    models = ["1D-CNN", "RF"]
    if xgb_model is not None:
        models.append("XGB")
    return {
        "status": "healthy",
        "models": models,
        "classes": list(label_encoder.classes_),
        "feature_count": len(feature_columns),
    }


@app.get("/")
def root():
    return {"message": "IDS ML Service v2.0", "docs": "/docs"}
