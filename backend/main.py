from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from schemas import Trajectory
from database import engine, SessionLocal
from models import Base, Vehicle, Camera, TrajectoryDB, DetectionDB


app = FastAPI()


# Create database tables
Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# DATABASE SESSION
# --------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "ANPR Backend is running!"
    }


# --------------------------------------------------
# POST TRAJECTORY
# --------------------------------------------------

@app.post("/trajectories")
def create_trajectory(
    trajectory: Trajectory,
    db: Session = Depends(get_db)
):

    # 1. Find or create vehicle
    vehicle = db.query(Vehicle).filter(
        Vehicle.plate_number == trajectory.plate_number
    ).first()

    if not vehicle:
        vehicle = Vehicle(
            global_vehicle_id=trajectory.plate_number,
            plate_number=trajectory.plate_number,
            vehicle_class="unknown"
        )

        db.add(vehicle)
        db.flush()

    # 2. Create trajectory
    db_trajectory = TrajectoryDB(
        trajectory_id=trajectory.trajectory_id,
        plate_number=trajectory.plate_number,
        vehicle_id=vehicle.id,
        total_distance=trajectory.total_distance,
        average_speed=trajectory.average_speed,
        route_polyline=trajectory.route_polyline
    )

    db.add(db_trajectory)
    db.flush()

    # 3. Store detections
    for detection in trajectory.detections:

        # Find or create camera
        camera = db.query(Camera).filter(
            Camera.camera_id == detection.camera_id
        ).first()

        if not camera:
            camera = Camera(
                camera_id=detection.camera_id,
                location=detection.location,
                latitude=detection.gps.lat,
                longitude=detection.gps.lng
            )

            db.add(camera)
            db.flush()

        # Create detection
        db_detection = DetectionDB(
            trajectory_id=db_trajectory.id,
            camera_id=camera.id,
            timestamp=detection.timestamp,
            location=detection.location,
            latitude=detection.gps.lat,
            longitude=detection.gps.lng,
            speed=detection.speed,
            direction=detection.direction,
            image_url=detection.image_url
        )

        db.add(db_detection)

    # 4. Save everything
    db.commit()

    return {
        "message": "Trajectory stored successfully",
        "trajectory_id": trajectory.trajectory_id,
        "plate_number": trajectory.plate_number,
        "detections_saved": len(trajectory.detections)
    }


# --------------------------------------------------
# GET VEHICLE TRAJECTORY
# --------------------------------------------------

@app.get("/trajectories/{plate_number}")
def get_trajectory(
    plate_number: str,
    db: Session = Depends(get_db)
):

    # Find vehicle
    vehicle = db.query(Vehicle).filter(
        Vehicle.plate_number == plate_number
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # Find all trajectories for this vehicle
    trajectories = db.query(TrajectoryDB).filter(
        TrajectoryDB.vehicle_id == vehicle.id
    ).all()

    result = []

    for trajectory in trajectories:

        # Get detections
        detections = db.query(DetectionDB).filter(
            DetectionDB.trajectory_id == trajectory.id
        ).all()

        detection_list = []

        for detection in detections:

            # Get camera information
            camera = db.query(Camera).filter(
                Camera.id == detection.camera_id
            ).first()

            detection_list.append({
                "camera_id": camera.camera_id if camera else None,
                "timestamp": detection.timestamp,
                "location": detection.location,
                "gps": {
                    "lat": detection.latitude,
                    "lng": detection.longitude
                },
                "speed": detection.speed,
                "direction": detection.direction,
                "image_url": detection.image_url
            })

        result.append({
            "trajectory_id": trajectory.trajectory_id,
            "plate_number": trajectory.plate_number,
            "total_distance": trajectory.total_distance,
            "average_speed": trajectory.average_speed,
            "route_polyline": trajectory.route_polyline,
            "detections": detection_list
        })

    return result


# --------------------------------------------------
# GET ALL CAMERAS
# --------------------------------------------------

@app.get("/cameras")
def get_cameras(
    db: Session = Depends(get_db)
):

    cameras = db.query(Camera).all()

    return [
        {
            "camera_id": camera.camera_id,
            "location": camera.location,
            "latitude": camera.latitude,
            "longitude": camera.longitude
        }
        for camera in cameras
    ]


# --------------------------------------------------
# TRAFFIC ANALYTICS
# --------------------------------------------------

@app.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db)
):

    total_vehicles = db.query(Vehicle).count()

    total_detections = db.query(DetectionDB).count()

    total_cameras = db.query(Camera).count()

    average_speed = db.query(
        func.avg(DetectionDB.speed)
    ).scalar()

    if average_speed is None:
        average_speed = 0

    return {
        "total_vehicles": total_vehicles,
        "total_detections": total_detections,
        "total_cameras": total_cameras,
        "average_speed": round(float(average_speed), 2)
    }
# --------------------------------------------------
# CONGESTION STATUS
# --------------------------------------------------

@app.get("/congestion")
def get_congestion(
    db: Session = Depends(get_db)
):

    average_speed = db.query(
        func.avg(DetectionDB.speed)
    ).scalar()

    if average_speed is None:
        average_speed = 0

    average_speed = float(average_speed)

    if average_speed < 20:
        congestion_level = "HIGH"
    elif average_speed < 40:
        congestion_level = "MEDIUM"
    else:
        congestion_level = "LOW"

    return {
        "average_speed": round(average_speed, 2),
        "congestion_level": congestion_level
    }