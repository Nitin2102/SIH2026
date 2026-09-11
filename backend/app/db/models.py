from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from .database import Base

class CameraModel(Base):
    __tablename__ = "cameras"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    direction = Column(String, default="NORTHBOUND")
    status = Column(String, default="active")
    fps = Column(Integer, default=15)
    speed_limit_kmh = Column(Float, default=50.0)
    reference_distance_m = Column(Float, default=20.0)

class RoadModel(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    from_camera_id = Column(String, ForeignKey("cameras.id"), nullable=False)
    to_camera_id = Column(String, ForeignKey("cameras.id"), nullable=False)
    distance_km = Column(Float, nullable=False)
    free_flow_speed_kmh = Column(Float, default=50.0)

class VehicleTrackModel(Base):
    __tablename__ = "vehicle_tracks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(String, index=True, nullable=False)
    track_id = Column(String, index=True, nullable=False)
    vehicle_class = Column(String, nullable=False)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float, default=0.90)
    bbox_json = Column(Text, nullable=True)

class VehicleIdentityModel(Base):
    __tablename__ = "vehicles"

    global_vehicle_id = Column(String, primary_key=True, index=True)
    plate = Column(String, index=True, nullable=True)
    vehicle_class = Column(String, nullable=False)
    appearance_features_json = Column(Text, nullable=True)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    observation_count = Column(Integer, default=1)
    confidence = Column(Float, default=0.85)

class PlateObservationModel(Base):
    __tablename__ = "plate_observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(String, index=True, nullable=False)
    track_id = Column(String, nullable=False)
    global_vehicle_id = Column(String, index=True, nullable=True)
    raw_plate = Column(String, nullable=False)
    normalized_plate = Column(String, index=True, nullable=False)
    ocr_confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    bbox_json = Column(Text, nullable=True)

class TrajectoryEventModel(Base):
    __tablename__ = "trajectory_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    global_vehicle_id = Column(String, ForeignKey("vehicles.global_vehicle_id"), index=True, nullable=False)
    camera_id = Column(String, index=True, nullable=False)
    camera_name = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    direction = Column(String, default="FORWARD")
    vehicle_class = Column(String, nullable=False)
    speed_kmh = Column(Float, default=45.0)
    confidence = Column(Float, default=0.90)
    plate = Column(String, index=True, nullable=True)

class TrafficMetricModel(Base):
    __tablename__ = "traffic_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    vehicle_count = Column(Integer, default=0)
    density_veh_km = Column(Float, default=0.0)
    flow_veh_min = Column(Float, default=0.0)
    avg_speed_kmh = Column(Float, default=0.0)
    congestion_level = Column(String, default="FREE") # FREE, MODERATE, HEAVY, SEVERE
    occupancy_pct = Column(Float, default=0.0)

class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plate = Column(String, index=True, nullable=False)
    camera_id = Column(String, nullable=False)
    camera_name = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    vehicle_class = Column(String, default="car")
    alert_type = Column(String, nullable=False) # Watchlist Match, Route Anomaly, Speed Anomaly
    priority = Column(String, default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    snapshot_url = Column(String, nullable=True)
    confidence = Column(Float, default=0.95)
    acknowledged = Column(Boolean, default=False)

class WatchlistModel(Base):
    __tablename__ = "watchlist"

    plate = Column(String, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    priority = Column(String, default="HIGH")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ODFlowModel(Base):
    __tablename__ = "od_flows"

    id = Column(Integer, primary_key=True, autoincrement=True)
    origin_camera_id = Column(String, index=True, nullable=False)
    destination_camera_id = Column(String, index=True, nullable=False)
    count = Column(Integer, default=0)
    avg_travel_time_sec = Column(Float, default=0.0)
    time_bucket = Column(String, default="ALL")
