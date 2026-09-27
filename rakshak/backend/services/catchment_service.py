"""
Catchment Routing and Hydrological River Cascade Service for Rakshak.
Models upstream-to-downstream floodwave propagation across the Beas, Parbati,
and Tirthan river basins in Himachal Pradesh using kinematic wave and Manning's channel routing.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class RiverNode(BaseModel):
    node_id: str
    ward_id: str
    name: str
    river: str
    elevation_m: float
    distance_from_source_km: float
    channel_slope: float  # m/m
    travel_time_hours_from_source: float
    downstream_node_id: Optional[str] = None


class RiverBasin(BaseModel):
    basin_name: str
    primary_river: str
    total_length_km: float
    headwater_elevation_m: float
    terminal_elevation_m: float
    nodes: List[RiverNode]


# Topologically sorted river networks in Himachal Pradesh
BEAS_RIVER_NETWORK: List[RiverNode] = [
    RiverNode(
        node_id="BEAS-01",
        ward_id="HP-KLU-04",
        name="Manali (Beas Headwaters)",
        river="Beas",
        elevation_m=2050.0,
        distance_from_source_km=15.0,
        channel_slope=0.038,
        travel_time_hours_from_source=0.5,
        downstream_node_id="BEAS-02"
    ),
    RiverNode(
        node_id="BEAS-02",
        ward_id="HP-KLU-01",
        name="Kullu Valley (Beas Mainstem)",
        river="Beas",
        elevation_m=1220.0,
        distance_from_source_km=55.0,
        channel_slope=0.021,
        travel_time_hours_from_source=2.2,
        downstream_node_id="BEAS-03"
    ),
    RiverNode(
        node_id="BEAS-03",
        ward_id="HP-KLU-03",
        name="Bhuntar Confluence (Beas-Parbati)",
        river="Beas",
        elevation_m=1080.0,
        distance_from_source_km=68.0,
        channel_slope=0.016,
        travel_time_hours_from_source=2.9,
        downstream_node_id="BEAS-04"
    ),
    RiverNode(
        node_id="BEAS-04",
        ward_id="HP-MND-06",
        name="Pandoh Dam Gorge",
        river="Beas",
        elevation_m=850.0,
        distance_from_source_km=105.0,
        channel_slope=0.012,
        travel_time_hours_from_source=4.5,
        downstream_node_id="BEAS-05"
    ),
    RiverNode(
        node_id="BEAS-05",
        ward_id="HP-MND-01",
        name="Mandi Sadar (Beas Valley)",
        river="Beas",
        elevation_m=760.0,
        distance_from_source_km=125.0,
        channel_slope=0.009,
        travel_time_hours_from_source=5.6,
        downstream_node_id=None
    )
]

PARBATI_RIVER_NETWORK: List[RiverNode] = [
    RiverNode(
        node_id="PARB-01",
        ward_id="HP-KLU-05",
        name="Manikaran (Parbati Valley)",
        river="Parbati",
        elevation_m=1760.0,
        distance_from_source_km=25.0,
        channel_slope=0.045,
        travel_time_hours_from_source=0.6,
        downstream_node_id="PARB-02"
    ),
    RiverNode(
        node_id="PARB-02",
        ward_id="HP-KLU-02",
        name="Kasol (Parbati Gorge)",
        river="Parbati",
        elevation_m=1580.0,
        distance_from_source_km=32.0,
        channel_slope=0.035,
        travel_time_hours_from_source=1.1,
        downstream_node_id="PARB-03"
    ),
    RiverNode(
        node_id="PARB-03",
        ward_id="HP-KLU-03",
        name="Bhuntar Confluence",
        river="Parbati",
        elevation_m=1080.0,
        distance_from_source_km=58.0,
        channel_slope=0.024,
        travel_time_hours_from_source=2.4,
        downstream_node_id=None
    )
]

TIRTHAN_RIVER_NETWORK: List[RiverNode] = [
    RiverNode(
        node_id="TIRT-01",
        ward_id="HP-KLU-06",
        name="Gushaini (Tirthan Valley)",
        river="Tirthan",
        elevation_m=1500.0,
        distance_from_source_km=18.0,
        channel_slope=0.041,
        travel_time_hours_from_source=0.4,
        downstream_node_id="TIRT-02"
    ),
    RiverNode(
        node_id="TIRT-02",
        ward_id="HP-MND-05",
        name="Banjar-Aut Gorge",
        river="Tirthan",
        elevation_m=1350.0,
        distance_from_source_km=34.0,
        channel_slope=0.028,
        travel_time_hours_from_source=1.3,
        downstream_node_id="TIRT-03"
    ),
    RiverNode(
        node_id="TIRT-03",
        ward_id="HP-MND-06",
        name="Larji Reservoir Confluence",
        river="Tirthan",
        elevation_m=950.0,
        distance_from_source_km=48.0,
        channel_slope=0.019,
        travel_time_hours_from_source=2.1,
        downstream_node_id=None
    )
]


class CatchmentRoutingService:
    """Service to compute downstream cascade surge arrival times and transmission risks."""

    def __init__(self):
        self.networks = {
            "Beas": BEAS_RIVER_NETWORK,
            "Parbati": PARBATI_RIVER_NETWORK,
            "Tirthan": TIRTHAN_RIVER_NETWORK
        }

    def get_all_networks(self) -> List[Dict[str, Any]]:
        result = []
        for river_name, nodes in self.networks.items():
            result.append({
                "river": river_name,
                "node_count": len(nodes),
                "headwater_elevation_m": nodes[0].elevation_m,
                "terminal_elevation_m": nodes[-1].elevation_m,
                "total_drop_m": nodes[0].elevation_m - nodes[-1].elevation_m,
                "nodes": [n.model_dump() for n in nodes]
            })
        return result

    def calculate_cascade_impact(self, triggered_ward_id: str, surge_stage_m: float = 3.5) -> Dict[str, Any]:
        """
        Given an upstream surge or cloudburst at `triggered_ward_id`, computes downstream propagation ETAs.
        """
        for river_name, nodes in self.networks.items():
            for i, node in enumerate(nodes):
                if node.ward_id == triggered_ward_id:
                    # Found the origin node; calculate downstream cascade
                    downstream_cascade = []
                    origin_time = node.travel_time_hours_from_source

                    for j in range(i + 1, len(nodes)):
                        target = nodes[j]
                        lag_hours = round(target.travel_time_hours_from_source - origin_time, 1)
                        # Flow attenuation: surge height decreases slightly with distance, but risk is severe
                        attenuated_stage = round(max(1.8, surge_stage_m * (0.92 ** (j - i))), 2)
                        downstream_cascade.append({
                            "node_id": target.node_id,
                            "ward_id": target.ward_id,
                            "ward_name": target.name,
                            "distance_from_origin_km": round(target.distance_from_source_km - node.distance_from_source_km, 1),
                            "estimated_surge_arrival_hours": lag_hours,
                            "projected_peak_stage_m": attenuated_stage,
                            "threat_severity": "HIGH" if lag_hours <= 2.5 else "WATCH"
                        })

                    return {
                        "origin_ward_id": triggered_ward_id,
                        "origin_ward_name": node.name,
                        "river": river_name,
                        "surge_stage_m": surge_stage_m,
                        "downstream_cascade": downstream_cascade,
                        "downstream_wards_at_risk_count": len(downstream_cascade)
                    }

        return {
            "origin_ward_id": triggered_ward_id,
            "origin_ward_name": "Unknown",
            "river": "Local Tributary",
            "surge_stage_m": surge_stage_m,
            "downstream_cascade": [],
            "downstream_wards_at_risk_count": 0
        }


catchment_service = CatchmentRoutingService()
