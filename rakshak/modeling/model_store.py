"""
Model persistence and metadata store for Rakshak.
Ensures every deployed model artifact tracks training timestamp, temporal holdout window,
exact measured metrics, and explicit literature citations.
"""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
try:
    import joblib
except ImportError:
    joblib = None
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ARTIFACT_DIR = ROOT_DIR / "artifacts"


class LiteratureBenchmark(BaseModel):
    study_name: str = "Yunnan Province Rainfall-Induced Landslide Random Forest Study"
    citation: str = "Cited in academic literature as benchmark precedent for 8-factor terrain-rainfall modeling; NOT our result"
    reported_accuracy: float = 0.906
    reported_roc_auc: float = 0.954
    context: str = "Evaluated on Yunnan regional catchment data; serving as feature schema design guide"


class MeasuredValidationMetrics(BaseModel):
    evaluation_window: str = "2025-06-01 to 2025-08-31 (Himachal Pradesh Monsoon Holdout)"
    validation_wards_count: int
    test_samples_count: int
    positive_events_count: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    pr_auc: float
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int


class ModelMetadata(BaseModel):
    model_name: str = "Rakshak_RandomForest_v1"
    model_version: str = "1.0.0"
    trained_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    algorithm: str = "RandomForestClassifier(n_estimators=150, max_depth=10, class_weight='balanced')"
    features: list = Field(default_factory=list)
    feature_importances: Dict[str, float] = Field(default_factory=dict)
    training_window: str = "2022-06-01 to 2024-09-30 (Historical Himachal Pradesh baseline)"
    literature_benchmark: LiteratureBenchmark = Field(default_factory=LiteratureBenchmark)
    measured_validation_metrics: MeasuredValidationMetrics


class FastRandomForest:
    """Lightweight zero-dependency Random Forest inference engine for serverless deployment."""
    def __init__(self, trees: list):
        self.trees = trees
        import numpy as np
        self.classes_ = np.array([0, 1])

    def predict_proba(self, X):
        import numpy as np
        X = np.asarray(X)
        results = []
        for x in X:
            tree_probs = []
            for t in self.trees:
                node = 0
                cl = t["children_left"]
                cr = t["children_right"]
                feat = t["feature"]
                thresh = t["threshold"]
                p1 = t["prob_1"]
                while cl[node] != -1:
                    if x[feat[node]] <= thresh[node]:
                        node = cl[node]
                    else:
                        node = cr[node]
                tree_probs.append(p1[node])
            p1_mean = sum(tree_probs) / len(tree_probs)
            results.append([1.0 - p1_mean, p1_mean])
        return np.array(results)


class ModelStore:
    def __init__(self, artifact_dir: Path = ARTIFACT_DIR):
        self.artifact_dir = artifact_dir
        self.artifact_dir.mkdir(parents=True, exist_ok=True)
        self.model_file = self.artifact_dir / "rakshak_rf_v1.pkl"
        self.trees_file = self.artifact_dir / "rakshak_rf_v1_trees.json"
        self.meta_file = self.artifact_dir / "model_metadata.json"

    def save(self, model: Any, metadata: ModelMetadata):
        try:
            import joblib
            joblib.dump(model, self.model_file)
        except Exception:
            pass

        # Export lightweight tree structure for zero-scipy serverless inference
        if hasattr(model, "estimators_"):
            trees = []
            for est in model.estimators_:
                t = est.tree_
                values = t.value.squeeze(axis=1)
                probs = (values / values.sum(axis=1, keepdims=True)).tolist()
                trees.append({
                    "children_left": t.children_left.tolist(),
                    "children_right": t.children_right.tolist(),
                    "feature": t.feature.tolist(),
                    "threshold": t.threshold.tolist(),
                    "prob_1": [p[1] for p in probs]
                })
            with open(self.trees_file, "w", encoding="utf-8") as f:
                json.dump(trees, f)

        with open(self.meta_file, "w", encoding="utf-8") as f:
            json.dump(metadata.model_dump(mode="json"), f, indent=2)

    def load_model(self) -> Optional[Any]:
        if self.trees_file.exists():
            try:
                with open(self.trees_file, "r", encoding="utf-8") as f:
                    trees = json.load(f)
                return FastRandomForest(trees)
            except Exception:
                pass

        if self.model_file.exists():
            try:
                import joblib
                return joblib.load(self.model_file)
            except Exception:
                pass
        return None

    def load_metadata(self) -> Optional[Dict[str, Any]]:
        if self.meta_file.exists():
            with open(self.meta_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def is_trained(self) -> bool:
        return (self.trees_file.exists() or self.model_file.exists()) and self.meta_file.exists()
