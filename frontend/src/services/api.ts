import axios from 'axios';
import {
  Camera,
  VehicleSearchResponse,
  TrafficMetric,
  Alert,
  WatchlistItem,
  ODFlow,
  HeatmapPoint,
} from '../types';

const API_BASE_URL = 'http://localhost:8001';
const BACKEND_API_URL = 'http://localhost:8000';

// --------------------------------------------------
// CAMERAS
// --------------------------------------------------

export const fetchCameras = async (): Promise<Camera[]> => {
  const res = await axios.get(`${API_BASE_URL}/cameras`);
  return res.data;
};


// --------------------------------------------------
// VEHICLE SEARCH
// --------------------------------------------------

export const searchVehicleByPlate = async (
  plate: string
): Promise<VehicleSearchResponse> => {

  const cleanPlate = plate.trim();

  // Get vehicle information from AI server
  const res = await axios.get(
    `${API_BASE_URL}/vehicles/search?plate=${encodeURIComponent(cleanPlate)}`
  );

  const data: any = res.data;

  // ------------------------------------------------
  // Get trajectory from AI server
  // ------------------------------------------------

  let trajectory: any[] = [];

  if (Array.isArray(data.trajectory)) {
    trajectory = data.trajectory;

  } else if (Array.isArray(data.events)) {
    // IMPORTANT:
    // The AI server returns journey information
    // inside the "events" field.
    trajectory = data.events;

  } else if (Array.isArray(data.detections)) {
    trajectory = data.detections;

  } else if (Array.isArray(data.journey)) {
    trajectory = data.journey;
  }


  // ------------------------------------------------
  // Normalize trajectory objects
  // ------------------------------------------------

  trajectory = trajectory.map((event: any) => ({
    camera_id:
      event.camera_id ||
      event.camera?.camera_id ||
      'UNKNOWN',

    camera_name:
      event.camera_name ||
      event.camera?.location ||
      event.location ||
      'Unknown Camera',

    timestamp:
      event.timestamp ||
      event.timestamp_utc ||
      new Date().toISOString(),

    lat:
      event.lat ??
      event.latitude ??
      event.gps?.lat ??
      0,

    lng:
      event.lng ??
      event.longitude ??
      event.gps?.lng ??
      0,

    direction:
      event.direction ||
      'UNKNOWN',

    speed_kmh:
      event.speed_kmh ??
      event.speed ??
      0,

    confidence:
      event.confidence ??
      0.95,
  }));


  // ------------------------------------------------
  // If AI server has no events, try PostgreSQL
  // backend using global vehicle ID.
  // ------------------------------------------------

  if (
    trajectory.length === 0 &&
    data.global_vehicle_id
  ) {

    try {

      const backendRes = await axios.get(
        `${BACKEND_API_URL}/vehicles/${encodeURIComponent(
          data.global_vehicle_id
        )}/trajectory`
      );

      const backendData: any = backendRes.data;

      if (Array.isArray(backendData.detections)) {

        trajectory = backendData.detections.map(
          (detection: any) => ({
            camera_id:
              detection.camera_id ||
              detection.camera?.camera_id ||
              'UNKNOWN',

            camera_name:
              detection.camera_name ||
              detection.camera?.location ||
              detection.location ||
              'Unknown Camera',

            timestamp:
              detection.timestamp ||
              new Date().toISOString(),

            lat:
              detection.lat ??
              detection.latitude ??
              detection.gps?.lat ??
              0,

            lng:
              detection.lng ??
              detection.longitude ??
              detection.gps?.lng ??
              0,

            direction:
              detection.direction ||
              'UNKNOWN',

            speed_kmh:
              detection.speed_kmh ??
              detection.speed ??
              0,

            confidence:
              detection.confidence ??
              0.95,
          })
        );
      }

    } catch (backendError) {

      console.warn(
        'Could not retrieve trajectory from PostgreSQL backend:',
        backendError
      );
    }
  }


  // ------------------------------------------------
  // Cameras visited
  // ------------------------------------------------

  let camerasVisited: any[] = [];

  if (Array.isArray(data.cameras_visited)) {

    camerasVisited = data.cameras_visited;

  } else if (trajectory.length > 0) {

    const uniqueCameras = new Map();

    trajectory.forEach((event: any) => {

      if (!uniqueCameras.has(event.camera_id)) {

        uniqueCameras.set(
          event.camera_id,
          {
            camera_id: event.camera_id,
            camera_name: event.camera_name,
            timestamp: event.timestamp,
            speed_kmh: event.speed_kmh,
          }
        );

      }

    });

    camerasVisited = Array.from(
      uniqueCameras.values()
    );
  }


  // ------------------------------------------------
  // Total observations
  // ------------------------------------------------

  const totalObservations =
    data.total_observations ??
    data.total_detections ??
    trajectory.length;


  // ------------------------------------------------
  // Return normalized response
  // ------------------------------------------------

  return {
    ...data,

    // AI response can return plate: null.
    // Keep the searched plate for display.
    plate:
      data.plate ||
      cleanPlate,

    trajectory,

    cameras_visited:
      camerasVisited,

    total_observations:
      totalObservations,
  };
};


// --------------------------------------------------
// TRAFFIC
// --------------------------------------------------

export const fetchCurrentTraffic = async (): Promise<
  TrafficMetric[]
> => {

  const res = await axios.get(
    `${API_BASE_URL}/traffic/current`
  );

  return res.data;
};


// --------------------------------------------------
// BOTTLENECKS
// --------------------------------------------------

export const fetchBottlenecks = async (): Promise<any[]> => {

  const res = await axios.get(
    `${API_BASE_URL}/traffic/bottlenecks`
  );

  return res.data;
};


// --------------------------------------------------
// HEATMAP
// --------------------------------------------------

export const fetchHeatmapData = async (
  mode: string = 'density'
): Promise<HeatmapPoint[]> => {

  const res = await axios.get(
    `${API_BASE_URL}/traffic/heatmap?mode=${encodeURIComponent(mode)}`
  );

  return res.data;
};


// --------------------------------------------------
// ORIGIN / DESTINATION MATRIX
// --------------------------------------------------

export const fetchODMatrix = async (): Promise<ODFlow[]> => {

  const res = await axios.get(
    `${API_BASE_URL}/traffic/od`
  );

  return res.data;
};


// --------------------------------------------------
// ALERTS
// --------------------------------------------------

export const fetchAlerts = async (): Promise<Alert[]> => {

  const res = await axios.get(
    `${API_BASE_URL}/alerts`
  );

  return res.data;
};


// --------------------------------------------------
// WATCHLIST
// --------------------------------------------------

export const fetchWatchlist = async (): Promise<
  Record<string, WatchlistItem>
> => {

  const res = await axios.get(
    `${API_BASE_URL}/watchlist`
  );

  return res.data;
};


// --------------------------------------------------
// ADD WATCHLIST TARGET
// --------------------------------------------------

export const addToWatchlist = async (
  plate: string,
  description: string,
  priority: string = 'HIGH'
): Promise<any> => {

  const res = await axios.post(
    `${API_BASE_URL}/watchlist`,
    {
      plate,
      description,
      priority,
      active: true,
    }
  );

  return res.data;
};


// --------------------------------------------------
// DELETE WATCHLIST TARGET
// --------------------------------------------------

export const deleteFromWatchlist = async (
  plate: string
): Promise<any> => {

  const res = await axios.delete(
    `${API_BASE_URL}/watchlist/${encodeURIComponent(plate)}`
  );

  return res.data;
};