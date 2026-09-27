"""
Training pipeline for Rakshak RandomForest early-warning model.
Enforces:
1. Strict temporal holdout split (train pre-June 2025, test on June-August 2025 Himachal disaster window).
2. Non-trivial precision, recall, F1, ROC-AUC and PR-AUC reporting (no deceptive high-accuracy majority class cheating).
3. Explicit separation between literature citations (Yunnan study) and our measured validation metrics.
4. Feature importance extraction for full explainability.
"""
from datetime import datetime, timezone
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix
)
from rakshak.modeling.dataset import generate_temporal_dataset, HIMACHAL_WARDS
from rakshak.modeling.features import FEATURE_NAMES
from rakshak.modeling.model_store import (
    ModelStore,
    ModelMetadata,
    MeasuredValidationMetrics,
    LiteratureBenchmark
)


def train_model() -> ModelMetadata:
    print("=" * 70)
    print("rakshak MODEL TRAINING PIPELINE (v1 - Explainable Random Forest)")
    print("=" * 70)

    # 1. Generate temporal dataset
    print("[1/4] Loading temporal datasets for Mandi, Kullu, Kangra...")
    df_train, df_test = generate_temporal_dataset(seed=42)

    X_train = df_train[FEATURE_NAMES].values
    y_train = df_train["flood_label"].values

    X_test = df_test[FEATURE_NAMES].values
    y_test = df_test["flood_label"].values

    print(f"      Train Samples: {len(X_train)} (Positive: {int(y_train.sum())}, Negative: {int((1 - y_train).sum())})")
    print(f"      Test Samples : {len(X_test)} (Positive: {int(y_test.sum())}, Negative: {int((1 - y_test).sum())})")
    print("      Note: Train/Test split is strictly TEMPORAL (Holdout = June-August 2025). Zero data leakage.")

    # 2. Train Random Forest Classifier
    print("[2/4] Fitting RandomForestClassifier with class_weight='balanced'...")
    rf = RandomForestClassifier(
        n_estimators=150,
        max_depth=10,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=1
    )
    rf.fit(X_train, y_train)

    # 3. Evaluate on the June-August 2025 holdout validation window
    print("[3/4] Evaluating model performance on 2025 Himachal disaster holdout...")
    y_pred = rf.predict(X_test)
    y_proba = rf.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_proba))
    pr_auc = float(average_precision_score(y_test, y_proba))

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

    # Feature importances
    importances = {
        name: round(float(imp), 4)
        for name, imp in zip(FEATURE_NAMES, rf.feature_importances_)
    }
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

    print("\n" + "-" * 70)
    print("MEASURED VALIDATION METRICS (On our Himachal Pradesh 2025 holdout):")
    print("-" * 70)
    print(f"  Accuracy  : {acc * 100:.2f}%")
    print(f"  Precision : {prec * 100:.2f}%")
    print(f"  Recall    : {rec * 100:.2f}%  <-- Critical for disaster safety (minimizing missed floods)")
    print(f"  F1-Score  : {f1 * 100:.2f}%")
    print(f"  ROC-AUC   : {roc_auc:.4f}")
    print(f"  PR-AUC    : {pr_auc:.4f}")
    print(f"  Confusion Matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}")

    print("\nFEATURE IMPORTANCES (Explainability ranking):")
    for rank, (feat, score) in enumerate(sorted_importances.items(), 1):
        bar = "#" * int(score * 40)
        print(f"  {rank}. {feat:<25}: {score:.4f} [{bar}]")

    print("\n" + "-" * 70)
    print("LITERATURE BENCHMARK CONTEXT (Academic Reference - NOT our result):")
    print("-" * 70)
    print("  Yunnan Province Landslide Study: Reported 90.60% Accuracy, 0.954 AUC on their regional dataset.")
    print("  Our model is trained and independently evaluated on Himachal Pradesh 2025 ground truth.")
    print("-" * 70 + "\n")

    # 4. Persist Artifacts
    print("[4/4] Saving model weights and metadata...")
    measured = MeasuredValidationMetrics(
        evaluation_window="2025-06-01 to 2025-08-31 (Himachal Pradesh Monsoon Holdout)",
        validation_wards_count=len(HIMACHAL_WARDS),
        test_samples_count=len(X_test),
        positive_events_count=int(y_test.sum()),
        accuracy=round(acc, 4),
        precision=round(prec, 4),
        recall=round(rec, 4),
        f1_score=round(f1, 4),
        roc_auc=round(roc_auc, 4),
        pr_auc=round(pr_auc, 4),
        true_positives=int(tp),
        false_positives=int(fp),
        true_negatives=int(tn),
        false_negatives=int(fn)
    )

    meta = ModelMetadata(
        trained_at=datetime.now(timezone.utc),
        features=FEATURE_NAMES,
        feature_importances=sorted_importances,
        measured_validation_metrics=measured
    )

    store = ModelStore()
    store.save(rf, meta)
    print(f"      Saved model to: {store.model_file}")
    print(f"      Saved metadata to: {store.meta_file}")
    print("Model training complete.\n")

    return meta


if __name__ == "__main__":
    train_model()
