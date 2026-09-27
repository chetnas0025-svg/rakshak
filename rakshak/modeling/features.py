"""
Feature engineering and schema definition for Rakshak.
Implements the 8-factor feature schema established in benchmarked flash-flood & landslide literature.
"""
from typing import List, Dict, Any
from pydantic import BaseModel, Field

# Academic literature reference feature names
FEATURE_NAMES = [
    "elevation",
    "slope",
    "aspect",
    "lithology",
    "land_cover",
    "ndvi",
    "soil_type",
    "rainfall_antecedent_72h",
    "rainfall_current_24h"
]

LITHOLOGY_MAP = {
    1: "Granite / Gneiss (Hard crystalline rock - Low Fragility)",
    2: "Sandstone / Quartzite (Medium Hardness)",
    3: "Limestone / Dolomite (Karst susceptible)",
    4: "Phyllite / Schist / Slate (Foliated, structurally weak)",
    5: "Unconsolidated Alluvium / Debris / Moraine (Highly Fragile)"
}

LAND_COVER_MAP = {
    1: "Dense Mountain Forest (High root cohesion)",
    2: "Scrubland / Alpine Pasture",
    3: "Terraced Agriculture / Orchard",
    4: "Built-up / Urban Settlement (Impermeable)",
    5: "Barren / Escarpment / Exposed Soil (Zero cohesion)"
}

SOIL_TYPE_MAP = {
    1: "Gravelly Sandy Loam (High Infiltration)",
    2: "Silty Loam (Moderate Infiltration)",
    3: "Clayey Loam (Low Infiltration, High Runoff)",
    4: "Thin Lithosol / Scree (Immediate Runoff)"
}


class FeatureVector(BaseModel):
    elevation: float = Field(..., description="Terrain elevation above sea level in meters")
    slope: float = Field(..., description="Slope angle in degrees (0 - 90)")
    aspect: float = Field(..., description="Slope orientation in degrees (0 - 360)")
    lithology: int = Field(..., ge=1, le=5, description="Geological fragility index (1 to 5)")
    land_cover: int = Field(..., ge=1, le=5, description="Land use / land cover category (1 to 5)")
    ndvi: float = Field(..., ge=-1.0, le=1.0, description="Normalized Difference Vegetation Index")
    soil_type: int = Field(..., ge=1, le=4, description="Soil classification category (1 to 4)")
    rainfall_antecedent_72h: float = Field(..., ge=0.0, description="Cumulative 72-hour rainfall in mm")
    rainfall_current_24h: float = Field(..., ge=0.0, description="Current 24-hour rainfall in mm")

    def to_list(self) -> List[float]:
        return [
            float(self.elevation),
            float(self.slope),
            float(self.aspect),
            float(self.lithology),
            float(self.land_cover),
            float(self.ndvi),
            float(self.soil_type),
            float(self.rainfall_antecedent_72h),
            float(self.rainfall_current_24h)
        ]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "elevation_m": self.elevation,
            "slope_deg": self.slope,
            "aspect_deg": self.aspect,
            "lithology_name": LITHOLOGY_MAP.get(self.lithology, "Unknown"),
            "land_cover_name": LAND_COVER_MAP.get(self.land_cover, "Unknown"),
            "ndvi": self.ndvi,
            "soil_type_name": SOIL_TYPE_MAP.get(self.soil_type, "Unknown"),
            "rainfall_antecedent_72h_mm": self.rainfall_antecedent_72h,
            "rainfall_current_24h_mm": self.rainfall_current_24h
        }


class WardFeatureProfile(BaseModel):
    ward_id: str
    ward_name: str
    district_name: str
    latitude: float
    longitude: float
    base_elevation: float
    base_slope: float
    base_aspect: float
    lithology: int
    land_cover: int
    base_ndvi: float
    soil_type: int
    historical_flood_count: int
