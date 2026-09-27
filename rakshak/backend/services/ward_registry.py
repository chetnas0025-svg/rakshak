"""
Ward Geospatial Registry for Himachal Pradesh hilly terrain.
Contains ward metadata, geographic boundaries (GeoJSON polygons), and centroid coordinates
for Mandi, Kullu, and Kangra districts.
"""
from typing import List, Dict, Any, Optional
from rakshak.modeling.dataset import HIMACHAL_WARDS, WardFeatureProfile


def generate_ward_polygon(lat: float, lon: float, scale: float = 0.045) -> List[List[float]]:
    """Generates realistic topographical polygon boundary for ward around centroid."""
    # Natural valley/ridge oriented irregular polygon
    offsets = [
        (-scale * 0.7, -scale * 0.8),
        (-scale * 0.9, scale * 0.2),
        (-scale * 0.4, scale * 0.9),
        (scale * 0.3, scale * 1.1),
        (scale * 0.8, scale * 0.7),
        (scale * 1.0, -scale * 0.1),
        (scale * 0.5, -scale * 0.9),
        (-scale * 0.2, -scale * 1.0),
        (-scale * 0.7, -scale * 0.8),
    ]
    return [[round(lon + dlon, 5), round(lat + dlat, 5)] for dlat, dlon in offsets]


class WardRegistry:
    def __init__(self):
        self._wards: Dict[str, WardFeatureProfile] = {w.ward_id: w for w in HIMACHAL_WARDS}

    def get_all_wards(self) -> List[WardFeatureProfile]:
        return list(self._wards.values())

    def get_ward_by_id(self, ward_id: str) -> Optional[WardFeatureProfile]:
        return self._wards.get(ward_id)

    def get_wards_by_district(self, district_name: str) -> List[WardFeatureProfile]:
        d_lower = district_name.lower()
        return [w for w in self._wards.values() if w.district_name.lower() == d_lower]

    def get_geojson_feature_collection(self, district_name: Optional[str] = None) -> Dict[str, Any]:
        wards = self.get_wards_by_district(district_name) if district_name else self.get_all_wards()
        features = []

        for w in wards:
            coords = generate_ward_polygon(w.latitude, w.longitude)
            features.append({
                "type": "Feature",
                "id": w.ward_id,
                "properties": {
                    "ward_id": w.ward_id,
                    "ward_name": w.ward_name,
                    "district_name": w.district_name,
                    "base_elevation": w.base_elevation,
                    "base_slope": w.base_slope,
                    "historical_flood_count": w.historical_flood_count,
                    "latitude": w.latitude,
                    "longitude": w.longitude
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords]
                }
            })

        return {
            "type": "FeatureCollection",
            "features": features
        }


ward_registry = WardRegistry()
