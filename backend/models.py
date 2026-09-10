from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    global_vehicle_id = Column(String, unique=True, index=True)
    plate_number = Column(String, index=True)
    vehicle_class = Column(String)

    trajectories = relationship("TrajectoryDB", back_populates="vehicle")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String, unique=True, index=True)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)

    detections = relationship("DetectionDB", back_populates="camera")


class TrajectoryDB(Base):
    __tablename__ = "trajectories"

    id = Column(Integer, primary_key=True, index=True)
    trajectory_id = Column(String, unique=True, index=True)
    plate_number = Column(String, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    total_distance = Column(Float)
    average_speed = Column(Float)
    route_polyline = Column(String)

    vehicle = relationship("Vehicle", back_populates="trajectories")
    detections = relationship("DetectionDB", back_populates="trajectory")


class DetectionDB(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    trajectory_id = Column(Integer, ForeignKey("trajectories.id"))
    camera_id = Column(Integer, ForeignKey("cameras.id"))
    timestamp = Column(DateTime)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    speed = Column(Float)
    direction = Column(String)
    image_url = Column(String)

    trajectory = relationship("TrajectoryDB", back_populates="detections")
    camera = relationship("Camera", back_populates="detections")