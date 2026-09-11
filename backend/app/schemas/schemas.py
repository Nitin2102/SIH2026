from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class CameraBase(BaseModel):
    id: str
    name: str
    location: str
    lat: float
    lng: float
    direction: str
    status: str
    fps: int
    speed_limit_kmh: float
    reference_distance_m: float

class CameraResponse(CameraBase):
    model_config = ConfigDict(from_attributes=True)

class VehicleTrackBase(BaseModel):
    camera_id: str
    track_id: str
    vehicle_class: str
    first_seen: datetime
    last_seen: datetime
    confidence: float
    bbox_json: Optional[str] = None

class VehicleIdentityBase(BaseModel):
    global_vehicle_id: str
    plate: Optional[str] = None
    vehicle_class: str
    appearance_features_json: Optional[str] = None
    first_seen: datetime
    last_seen: datetime
    observation_count: int
    confidence: float

class TrajectoryEventBase(BaseModel):
    id: int
    global_vehicle_id: str
    camera_id: str
    camera_name: str
    timestamp: datetime
    lat: float
    lng: float
    direction: str
    vehicle_class: str
    speed_kmh: float
    confidence: float
    plate: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class VehicleSearchResponse(BaseModel):
    global_vehicle_id: str
    plate: str
    vehicle_class: str
    first_seen: datetime
    last_seen: datetime
    total_observations: int
    cameras_visited: List[str]
    trajectory: List[TrajectoryEventBase]
    confidence: float

class TrafficMetricResponse(BaseModel):
    camera_id: str
    timestamp: datetime
    vehicle_count: int
    density_veh_km: float
    flow_veh_min: float
    avg_speed_kmh: float
    congestion_level: str
    occupancy_pct: float

    model_config = ConfigDict(from_attributes=True)

class AlertCreate(BaseModel):
    plate: str
    camera_id: str
    camera_name: str
    vehicle_class: str
    alert_type: str
    priority: str
    description: str
    snapshot_url: Optional[str] = None
    confidence: float

class AlertResponse(AlertCreate):
    id: int
    timestamp: datetime
    acknowledged: bool

    model_config = ConfigDict(from_attributes=True)

class WatchlistBase(BaseModel):
    plate: str
    description: str
    priority: str = "HIGH"
    active: bool = True

class WatchlistResponse(WatchlistBase):
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ODFlowResponse(BaseModel):
    origin_camera_id: str
    destination_camera_id: str
    count: int
    avg_travel_time_sec: float
