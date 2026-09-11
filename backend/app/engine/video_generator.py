import os
import cv2
import numpy as np
import random
import time
from typing import Dict, List, Tuple

# Pre-defined target vehicles that cross multiple cameras to enable ReID demonstration
TARGET_VEHICLES = [
    {
        "plate": "KA01AB1234",
        "class": "car",
        "color": (220, 50, 50), # Red (BGR)
        "route": ["CAM-01", "CAM-02", "CAM-03", "CAM-05", "CAM-08"],
        "schedule": { "CAM-01": (1, 6), "CAM-02": (7, 12), "CAM-03": (13, 18), "CAM-05": (19, 24), "CAM-08": (25, 30) },
        "speed_kmh": 58.5
    },
    {
        "plate": "KA02CD5678",
        "class": "car",
        "color": (50, 180, 50), # Green
        "route": ["CAM-05", "CAM-02", "CAM-04", "CAM-08"],
        "schedule": { "CAM-05": (2, 7), "CAM-02": (8, 13), "CAM-04": (14, 19), "CAM-08": (20, 25) },
        "speed_kmh": 46.2
    },
    {
        "plate": "KA03EF9012",
        "class": "truck",
        "color": (40, 100, 200), # Amber / Brown
        "route": ["CAM-06", "CAM-01", "CAM-02", "CAM-03"],
        "schedule": { "CAM-06": (3, 8), "CAM-01": (9, 14), "CAM-02": (15, 20), "CAM-03": (21, 26) },
        "speed_kmh": 72.0
    },
    {
        "plate": "KA04GH3456",
        "class": "motorcycle",
        "color": (200, 200, 30), # Yellow/Cyan
        "route": ["CAM-07", "CAM-05", "CAM-04"],
        "schedule": { "CAM-07": (4, 9), "CAM-05": (10, 15), "CAM-04": (16, 21) },
        "speed_kmh": 42.0
    }
]

# Random background vehicles per camera
BACKGROUND_PLATES = ["MH12DE4321", "DL03XY9876", "KA05MN7890", "TN07AB5544", "KL01CD9988"]

def draw_license_plate(image: np.ndarray, x: int, y: int, w: int, h: int, text: str):
    """Draw a realistic white license plate rectangle with black text on the vehicle."""
    plate_w = int(w * 0.45)
    plate_h = int(h * 0.22)
    px = x + (w - plate_w) // 2
    py = y + int(h * 0.65)
    
    # White background plate
    cv2.rectangle(image, (px, py), (px + plate_w, py + plate_h), (245, 245, 245), -1)
    # Black border
    cv2.rectangle(image, (px, py), (px + plate_w, py + plate_h), (10, 10, 10), 2)
    
    # Text font
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = max(0.35, plate_w / 160.0)
    thickness = 1
    
    # Text size centered
    (tw, th), _ = cv2.getTextSize(text, font, font_scale, thickness)
    tx = px + (plate_w - tw) // 2
    ty = py + (plate_h + th) // 2
    cv2.putText(image, text, (tx, ty), font, font_scale, (10, 10, 10), thickness, cv2.LINE_AA)

def generate_frame_for_camera(camera_id: str, camera_name: str, frame_num: int, total_frames: int = 450, fps: int = 15) -> np.ndarray:
    """Generate a single 640x480 synthetic camera video frame with road background and moving vehicles."""
    width, height = 640, 480
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Asphalt road background (dark slate gray)
    frame[:] = (45, 45, 48)
    
    # Green grass roadside margins
    frame[0:60, :] = (35, 75, 35)
    frame[420:480, :] = (35, 75, 35)
    
    # Road lane lines (dashed yellow line in middle)
    cv2.line(frame, (0, 240), (width, 240), (40, 200, 240), 3) # Double yellow
    
    # White lane dashes
    dash_length = 30
    for x in range(0, width, dash_length * 2):
        cv2.line(frame, (x, 150), (x + dash_length, 150), (220, 220, 220), 2)
        cv2.line(frame, (x, 330), (x + dash_length, 330), (220, 220, 220), 2)

    # Time calculation in seconds
    t_sec = (frame_num % total_frames) / float(fps)
    
    # Draw Camera Info Header Overlay
    cv2.rectangle(frame, (0, 0), (width, 40), (15, 15, 20), -1)
    cv2.putText(frame, f"LIVE CAM: {camera_id} - {camera_name.upper()}", (15, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 230, 255), 2)
    cv2.putText(frame, f"FPS: {fps} | TIME: {t_sec:.1f}s", (width - 200, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)

    # Active vehicles to render on this frame
    vehicles_to_render = []

    # Check target vehicles
    for v in TARGET_VEHICLES:
        if camera_id in v["schedule"]:
            start_t, end_t = v["schedule"][camera_id]
            if start_t <= t_sec <= end_t:
                progress = (t_sec - start_t) / (end_t - start_t)
                vehicles_to_render.append({
                    "plate": v["plate"],
                    "class": v["class"],
                    "color": v["color"],
                    "progress": progress,
                    "lane": 1 if v["class"] == "car" else (0 if v["class"] == "truck" else 2)
                })

    # Add periodic background vehicles if empty
    if not vehicles_to_render or (frame_num % 90 < 30):
        bg_idx = (frame_num // 90 + ord(camera_id[-1])) % len(BACKGROUND_PLATES)
        bg_progress = ((frame_num % 90) / 30.0)
        vehicles_to_render.append({
            "plate": BACKGROUND_PLATES[bg_idx],
            "class": "car",
            "color": (160, 160, 165), # Silver
            "progress": bg_progress,
            "lane": (frame_num // 45) % 3
        })

    # Render vehicles
    for veh in vehicles_to_render:
        prog = veh["progress"]
        v_class = veh["class"]
        
        # Calculate Bounding Box coordinates based on vehicle type and lane progress
        if v_class == "truck" or v_class == "bus":
            w, h = 180, 90
        elif v_class == "motorcycle":
            w, h = 70, 45
        else: # car
            w, h = 130, 65

        lane_y_map = {0: 85, 1: 180, 2: 270}
        y = lane_y_map.get(veh["lane"], 180)
        x = int(-w + prog * (width + w * 2))

        if -w < x < width:
            # Draw Vehicle Body
            color = veh["color"]
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, -1)
            # Vehicle outline
            cv2.rectangle(frame, (x, y), (x + w, y + h), (20, 20, 20), 2)
            
            # Windshield / Windows
            cv2.rectangle(frame, (x + int(w * 0.25), y + int(h * 0.15)), (x + int(w * 0.75), y + int(h * 0.4)), (180, 220, 240), -1)

            # Wheels
            cv2.circle(frame, (x + int(w * 0.2), y + h), 8, (10, 10, 10), -1)
            cv2.circle(frame, (x + int(w * 0.8), y + h), 8, (10, 10, 10), -1)

            # Draw License Plate
            draw_license_plate(frame, x, y, w, h, veh["plate"])

    return frame

def generate_all_demo_videos(output_dir: str = "data/videos", total_frames: int = 450):
    """Generate 8 standalone synthetic MP4 videos for CAM-01 through CAM-08."""
    os.makedirs(output_dir, exist_ok=True)
    cameras = [
        ("CAM-01", "North Gate Boulevard"),
        ("CAM-02", "Central Grand Junction"),
        ("CAM-03", "East Tech Park Junction"),
        ("CAM-04", "South Gateway Interchange"),
        ("CAM-05", "West Avenue Cross"),
        ("CAM-06", "Airport Expressway Express"),
        ("CAM-07", "Old Market Road"),
        ("CAM-08", "Highway Interstate 10")
    ]
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    
    for cam_id, cam_name in cameras:
        video_path = os.path.join(output_dir, f"{cam_id}.mp4")
        out = cv2.VideoWriter(video_path, fourcc, 15.0, (640, 480))
        for f in range(total_frames):
            frame = generate_frame_for_camera(cam_id, cam_name, f, total_frames=total_frames)
            out.write(frame)
        out.release()
        print(f"[VIDEO GENERATOR] Created {video_path} ({total_frames} frames)")
