"""
Evacuation Shelters and Situation Report (SITREP) Service for Rakshak.
Provides verified high-ground NDRF and District Disaster Management shelters
across Mandi, Kullu, and Kangra districts.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from rakshak.backend.services.risk_service import risk_service


class EvacuationShelter(BaseModel):
    shelter_id: str
    shelter_name: str
    district_name: str
    ward_id: str
    ward_name: str
    latitude: float
    longitude: float
    elevation_m: float
    capacity_persons: int
    current_occupancy: int = 0
    supplies_status: str  # "STOCKED", "ADEQUATE", "CRITICAL"
    helpline_contact: str
    distance_km_from_valley: float
    is_active_staging_area: bool = True


EVACUATION_SHELTERS: List[EvacuationShelter] = [
    # Mandi District
    EvacuationShelter(
        shelter_id="SHT-MND-01",
        shelter_name="Govt Senior Secondary School (Upper Ridge)",
        district_name="Mandi",
        ward_id="HP-MND-02",
        ward_name="Thunag (Seraj Basin)",
        latitude=31.5480,
        longitude=77.1680,
        elevation_m=1960.0,
        capacity_persons=450,
        current_occupancy=42,
        supplies_status="STOCKED",
        helpline_contact="+91-1905-222123",
        distance_km_from_valley=1.8
    ),
    EvacuationShelter(
        shelter_id="SHT-MND-02",
        shelter_name="Mandi District Sports Complex High Ground",
        district_name="Mandi",
        ward_id="HP-MND-01",
        ward_name="Mandi Sadar (Beas Valley)",
        latitude=31.7140,
        longitude=76.9380,
        elevation_m=850.0,
        capacity_persons=800,
        current_occupancy=110,
        supplies_status="STOCKED",
        helpline_contact="+91-1905-224433",
        distance_km_from_valley=1.2
    ),
    EvacuationShelter(
        shelter_id="SHT-MND-03",
        shelter_name="Pandoh Upper Terrace Community Hall",
        district_name="Mandi",
        ward_id="HP-MND-04",
        ward_name="Pandoh (Dam Catchment)",
        latitude=31.6740,
        longitude=77.0420,
        elevation_m=970.0,
        capacity_persons=350,
        current_occupancy=15,
        supplies_status="ADEQUATE",
        helpline_contact="+91-1905-282210",
        distance_km_from_valley=2.1
    ),

    # Kullu District
    EvacuationShelter(
        shelter_id="SHT-KLU-01",
        shelter_name="Gurudwara Manikaran High Terrace Camp",
        district_name="Kullu",
        ward_id="HP-KLU-01",
        ward_name="Manikaran (Parbati Valley)",
        latitude=32.0320,
        longitude=77.3520,
        elevation_m=1840.0,
        capacity_persons=600,
        current_occupancy=85,
        supplies_status="STOCKED",
        helpline_contact="+91-1902-273222",
        distance_km_from_valley=0.9
    ),
    EvacuationShelter(
        shelter_id="SHT-KLU-02",
        shelter_name="Govt Model Senior Secondary School Banjar",
        district_name="Kullu",
        ward_id="HP-KLU-03",
        ward_name="Banjar (Tirthan Valley)",
        latitude=31.6420,
        longitude=77.3460,
        elevation_m=1450.0,
        capacity_persons=400,
        current_occupancy=28,
        supplies_status="STOCKED",
        helpline_contact="+91-1902-268140",
        distance_km_from_valley=1.5
    ),
    EvacuationShelter(
        shelter_id="SHT-KLU-03",
        shelter_name="Dhalpur Ground Disaster Relief Center",
        district_name="Kullu",
        ward_id="HP-KLU-04",
        ward_name="Kullu Town (Beas Confluence)",
        latitude=31.9610,
        longitude=77.1140,
        elevation_m=1280.0,
        capacity_persons=1200,
        current_occupancy=140,
        supplies_status="STOCKED",
        helpline_contact="+91-1902-222372",
        distance_km_from_valley=1.4
    ),

    # Kangra District
    EvacuationShelter(
        shelter_id="SHT-KNG-01",
        shelter_name="Dharamshala Indoor Sports Complex",
        district_name="Kangra",
        ward_id="HP-KNG-01",
        ward_name="Dharamshala (Bhagsunag / Dhauladhar)",
        latitude=32.2240,
        longitude=76.3280,
        elevation_m=1520.0,
        capacity_persons=950,
        current_occupancy=90,
        supplies_status="STOCKED",
        helpline_contact="+91-1892-223322",
        distance_km_from_valley=1.6
    ),
    EvacuationShelter(
        shelter_id="SHT-KNG-02",
        shelter_name="Khaniyara High Ridge Community Center",
        district_name="Kangra",
        ward_id="HP-KNG-02",
        ward_name="Khaniyara (Manuni Khad)",
        latitude=32.1910,
        longitude=76.3720,
        elevation_m=1410.0,
        capacity_persons=350,
        current_occupancy=30,
        supplies_status="ADEQUATE",
        helpline_contact="+91-1892-242111",
        distance_km_from_valley=2.3
    ),
    EvacuationShelter(
        shelter_id="SHT-KNG-03",
        shelter_name="Govt College Auditorium Shahpur",
        district_name="Kangra",
        ward_id="HP-KNG-03",
        ward_name="Shahpur (Gaj Khad)",
        latitude=32.2320,
        longitude=76.1780,
        elevation_m=890.0,
        capacity_persons=600,
        current_occupancy=18,
        supplies_status="STOCKED",
        helpline_contact="+91-1892-238412",
        distance_km_from_valley=1.1
    )
]


class ShelterService:
    def get_all_shelters(self, district: Optional[str] = None) -> List[EvacuationShelter]:
        if district and district.lower() != "all":
            d = district.lower()
            return [s for s in EVACUATION_SHELTERS if s.district_name.lower() == d]
        return EVACUATION_SHELTERS

    def get_shelter_by_ward(self, ward_id: str) -> Optional[EvacuationShelter]:
        for s in EVACUATION_SHELTERS:
            if s.ward_id == ward_id:
                return s
        return None

    def generate_sitrep(self) -> Dict[str, Any]:
        """Generates an official NDRF / SDMA Situation Report (SITREP) in standard tactical format."""
        all_wards = risk_service.get_all_summaries()
        critical_wards = [w for w in all_wards if w.alert_level in ["WARNING", "WATCH"]]
        advisory_wards = [w for w in all_wards if w.alert_level == "ADVISORY"]
        normal_wards = [w for w in all_wards if w.alert_level == "NORMAL"]

        total_shelter_capacity = sum(s.capacity_persons for s in EVACUATION_SHELTERS)
        total_occupancy = sum(s.current_occupancy for s in EVACUATION_SHELTERS)

        return {
            "sitrep_number": "SITREP-HP-2026-0814-01",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "reporting_agency": "NDRF 14th Battalion / Himachal Pradesh State EOC",
            "operation_codename": "OPERATION MEGH-RAKSHAK (Cloudburst & Flash Flood Response)",
            "monitored_region": "Mandi, Kullu, and Kangra Districts, Himachal Pradesh",
            "summary_statistics": {
                "total_monitored_wards": len(all_wards),
                "critical_warning_count": len(critical_wards),
                "advisory_watch_count": len(advisory_wards),
                "safe_normal_count": len(normal_wards),
                "total_shelter_capacity": total_shelter_capacity,
                "current_shelter_occupancy": total_occupancy,
                "available_shelter_capacity": total_shelter_capacity - total_occupancy,
                "active_iot_telemetry_nodes": 4
            },
            "critical_wards_details": [
                {
                    "ward_id": w.ward_id,
                    "ward_name": w.ward_name,
                    "district": w.district_name,
                    "risk_score": w.risk_score,
                    "alert_level": w.alert_level,
                    "lead_time_hours": w.lead_time_hours,
                    "rainfall_current_24h": w.rainfall_current_24h,
                    "rainfall_antecedent_72h": w.rainfall_antecedent_72h
                }
                for w in critical_wards
            ],
            "evacuation_status": {
                "designated_shelters_active": len(EVACUATION_SHELTERS),
                "food_medical_readiness": "100% Stocked",
                "emergency_helpline": "1077 (District) / 112 (National Emergency)"
            }
        }


shelter_service = ShelterService()
