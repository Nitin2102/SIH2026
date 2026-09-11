from pydantic import BaseModel
from datetime import datetime


class GPS(BaseModel):
    lat: float
    lng: float


class Detection(BaseModel):
    camera_id: str
    timestamp: datetime
    location: str
    gps: GPS
    speed: float
    direction: str
    image_url: str


class Trajectory(BaseModel):
    trajectory_id: str
    plate_number: str
    detections: list[Detection]
    total_distance: float
    average_speed: float
    route_polyline: str