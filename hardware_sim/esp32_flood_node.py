"""
ESP32 IoT Sensor Node Simulator for Rakshak.
Simulates a field-deployed telemetry unit mounted over mountain rivers (Beas/Parbati/Suketi Khad).
Features:
- Ultrasonic / Millimeter-Wave water level sonar sensor (0 - 800 cm)
- 3-Axis Accelerometer tilt sensor (slope displacement monitoring)
- Battery monitor & Wi-Fi/cellular RSSI
- Pushes to common schema endpoint: /api/v1/ingest/sensor (source='sensor')
"""
import argparse
import math
import random
import time
from datetime import datetime, timezone
import httpx

NODES = [
    {
        "node_id": "ESP32-MND-BEAS-01",
        "ward_id": "HP-MND-01",
        "river": "Beas River at Mandi Bridge",
        "baseline_level": 140.0,
        "danger_level": 420.0
    },
    {
        "node_id": "ESP32-KLU-PRB-02",
        "ward_id": "HP-KLU-01",
        "river": "Parbati River at Manikaran Gorge",
        "baseline_level": 175.0,
        "danger_level": 450.0
    },
    {
        "node_id": "ESP32-MND-SRJ-03",
        "ward_id": "HP-MND-02",
        "river": "Thunag Nallah (Seraj Valley)",
        "baseline_level": 65.0,
        "danger_level": 280.0
    },
    {
        "node_id": "ESP32-KNG-MNI-04",
        "ward_id": "HP-KNG-02",
        "river": "Manuni Khad near Khaniyara",
        "baseline_level": 85.0,
        "danger_level": 320.0
    }
]


def generate_telemetry_reading(node: dict, step: int, mode: str = "normal") -> dict:
    base = node["baseline_level"]
    danger = node["danger_level"]

    if mode == "surge":
        # Simulate sudden flash surge (cloudburst runoff)
        surge_factor = min(1.0, step / 10.0)
        water_level = base + (danger - base) * 1.15 * surge_factor + random.uniform(-2, 2)
        rate = 42.0 * surge_factor
        tilt = 1.2 + (5.5 * surge_factor) + random.uniform(-0.3, 0.3)
    elif mode == "tilt_warning":
        # Simulate slope creeping/landslide displacement
        water_level = base + random.uniform(5, 15)
        rate = 2.0
        tilt = 7.8 + random.uniform(0, 1.2)
    else:
        # Normal peaceful diurnal river oscillation
        water_level = base + (math.sin(step / 5.0) * 12.0) + random.uniform(-1.5, 1.5)
        rate = math.cos(step / 5.0) * 4.0
        tilt = 0.8 + random.uniform(-0.2, 0.2)

    battery = max(20.0, 98.0 - (step * 0.1))
    rssi = random.randint(-78, -62)

    return {
        "node_id": node["node_id"],
        "ward_id": node["ward_id"],
        "source": "sensor",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "water_level_cm": round(max(0.0, water_level), 2),
        "water_level_rate_cm_per_hr": round(rate, 2),
        "tilt_angle_deg": round(max(0.0, tilt), 2),
        "battery_level_pct": round(battery, 1),
        "signal_rssi_dbm": rssi,
        "extra_attributes": {
            "river_name": node["river"],
            "firmware_version": "ESP32-IDF-v5.2-FS1",
            "sensor_type": "Ultrasonic-JSN-SR04T + MPU6050"
        }
    }


def run_sensor_simulation(
    endpoint: str = "http://localhost:8000/api/v1/ingest/sensor",
    iterations: int = 15,
    interval_sec: float = 2.0,
    mode: str = "normal"
):
    print("=" * 65)
    print(f"ESP32 rakshak FIELD SENSOR SIMULATION (Mode: {mode.upper()})")
    print(f"Target Ingestion Endpoint: {endpoint}")
    print("=" * 65)

    client = httpx.Client(timeout=5.0)

    for step in range(1, iterations + 1):
        for node in NODES:
            payload = generate_telemetry_reading(node, step, mode=mode)
            try:
                resp = client.post(endpoint, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    status_flag = "[ANOMALY ALERT]" if data.get("anomaly_detected") else "[NORMAL]"
                    print(
                        f"Step {step:02d} | Node: {payload['node_id']} | "
                        f"Water: {payload['water_level_cm']:5.1f} cm | "
                        f"Tilt: {payload['tilt_angle_deg']:3.1f}° | {status_flag} {data.get('warning_flag') or ''}"
                    )
                else:
                    print(f"Error {resp.status_code}: {resp.text}")
            except Exception as e:
                print(f"Connection failed: {e}. Is Rakshak API running on {endpoint}?")
                return

        time.sleep(interval_sec)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ESP32 Rakshak Telemetry Node Simulator")
    parser.add_argument("--endpoint", default="http://localhost:8000/api/v1/ingest/sensor", help="Ingestion URL")
    parser.add_argument("--iterations", type=int, default=10, help="Number of telemetry cycles")
    parser.add_argument("--interval", type=float, default=2.0, help="Seconds between readings")
    parser.add_argument("--mode", choices=["normal", "surge", "tilt_warning"], default="surge", help="Simulation scenario")

    args = parser.parse_args()
    run_sensor_simulation(
        endpoint=args.endpoint,
        iterations=args.iterations,
        interval_sec=args.interval,
        mode=args.mode
    )
