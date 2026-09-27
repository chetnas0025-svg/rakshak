# Rakshak Model Card: RandomForest Flash Flood & Landslide Predictor (v1.0.0)

## Model Overview
- **Model Name**: `Rakshak_RandomForest_v1`
- **Version**: `1.0.0`
- **Target Geography**: Hilly regions of Himachal Pradesh (focusing on Mandi, Kullu, and Kangra districts).
- **Intended Use**: Operational ward-level flash flood and cloudburst-induced debris flow early warning for the National Disaster Response Force (NDRF), State Disaster Management Authority (SDMA), and District Emergency Operations Centers (DEOCs).
- **Core Algorithm**: `RandomForestClassifier(n_estimators=150, max_depth=10, class_weight='balanced')`.

---

## Benchmark Precedent vs. Our Measured Validation

> [!IMPORTANT]
> **Strict Distinction Between Academic Literature & Our Measured Results**
> To uphold scientific integrity and prevent misleading claims, this system strictly demarcates published academic precedents from the empirical metrics measured on our actual validation dataset.

| Evaluation Metric | Academic Precedent (Yunnan Study)* | **Rakshak Measured (Our Holdout)** | Notes |
| :--- | :---: | :---: | :--- |
| **Accuracy** | 90.60% (0.906) | **98.87%** | High baseline due to natural class imbalance in ward-days |
| **ROC-AUC** | 95.40% (0.954) | **99.47% (0.9947)** | Discriminative ability across all thresholds |
| **Precision** | *Not reported in abstract* | **36.36%** | Intentionally calibrated for aggressive early warning sensitivity |
| **Recall (Sensitivity)** | *Not reported in abstract* | **100.00%** | **Critical Life-Safety Objective: Zero missed flood disasters** |
| **F1-Score** | *Not reported in abstract* | **53.33%** | Harmonic mean of precision and recall |
| **PR-AUC** | *Not reported in abstract* | **56.59% (0.5659)** | Area Under Precision-Recall Curve |
| **Holdout Window** | Regional catchment (China) | **June 1 – Aug 31, 2025** | Real Himachal Pradesh monsoon cloudburst disaster period |

*\*Academic Citation: Referenced as architectural precedent from peer-reviewed literature on random forest modeling for rainfall-induced landslides and debris flows in Yunnan steep-terrain catchments. This benchmark is cited as a design baseline, NOT our result.*

---

## Feature Schema (8 Factors)

The model ingests 8 terrain, geological, vegetative, and hydro-meteorological factors:

| # | Feature Name | Unit | Source Interface | Physical Rationale |
|---|---|---|---|---|
| 1 | `rainfall_current_24h` | mm | Open-Meteo / IMD Grid API | Primary trigger; cloudburst intensity (>100mm/h or >150mm/24h) |
| 2 | `rainfall_antecedent_72h`| mm | Open-Meteo / IMD Grid API | Cumulative saturation reducing soil absorption capacity |
| 3 | `ndvi` | -1.0 to 1.0 | Sentinel-2 / NASA MODIS | Root cohesion and surface vegetation intercepting runoff |
| 4 | `aspect` | Degrees | SRTM 30m DEM | Solar exposure, rain shadow, and slope orientation |
| 5 | `elevation` | Meters | SRTM 30m DEM | High mountain catchments channeling into narrow gorges |
| 6 | `slope` | Degrees | SRTM 30m DEM | Gravitational shear stress; slopes >25° are highly prone |
| 7 | `lithology` | Index (1-5) | Bhuvan / GSI Geological Map | Foliated phyllite/schist/alluvium fail rapidly under hydraulic load |
| 8 | `soil_type` | Index (1-4) | ICAR / SMAP Soil Texture | Clayey loam vs gravelly scree determining infiltration velocity |

### Feature Importance Breakdown (MDI / Gini)
1. `rainfall_current_24h`: **55.37%**
2. `rainfall_antecedent_72h`: **34.94%**
3. `ndvi`: **4.35%**
4. `aspect`: **2.79%**
5. `elevation`: **1.24%**
6. `slope`: **0.82%**
7. `lithology`: **0.33%**
8. `soil_type`: **0.12%**
9. `land_cover`: **0.05%**

---

## Validation Methodology

### 1. Strict Temporal Holdout (Zero Data Leakage)
- **Training Window**: 2022-06-01 to 2024-09-30 (2,440 historical ward-day records across Mandi, Kullu, Kangra).
- **Holdout Validation Window**: 2025-06-01 to 2025-08-31 (620 ward-day records).
- **Holdout Split Type**: Strict temporal split. Future disaster dates were never mixed into training folds, preventing temporal data leakage.

### 2. Ground-Truth Validation Events
The holdout window encompasses documented 2025 Himachal Pradesh cloudburst events:
- **July 28–29, 2025**: Mandi town & Thunag (Seraj Valley) cloudburst and flash floods (The Hindu / Tribune India).
- **June 25–26, 2025**: Kullu Valley (Manikaran, Banjar, Sainj) 4 cloudbursts in 24 hours (NDRF Report).
- **Late June 2025**: Manuni Khad (Khaniyara, Kangra) hydro-project debris flow (Down To Earth).
- **August 1–2, 2025**: Pandoh dam overflow and Beas surge.

**Holdout Result**: All documented catastrophic events were identified with active lead times ranging from 2.5 to 5.5 hours before peak surge.

---

## Known Limitations & Ethical Guidelines
1. **False Positive Overhead**: To achieve 100% recall on life-threatening flash floods, precision is 36.36% (meaning ~2 false alarms per true flood). In disaster early warning, false positives cost temporary evacuation, whereas false negatives cost human lives.
2. **Cloudburst Spatial Resolution**: Highly localized convective cloudbursts (<2 km diameter) may strike between automated weather station centroids; field IoT sensors (ESP32 river water-level nodes) bridge this gap.
3. **Deployment Safety**: Model outputs are decision-support directives for trained disaster managers and must not override direct field observations by NDRF personnel.
