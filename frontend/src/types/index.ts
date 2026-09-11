export interface Camera {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  direction: string;
  status: string;
  fps: number;
  speed_limit_kmh: number;
  reference_distance_m: number;
}

export interface TrajectoryEvent {
  id: number;
  global_vehicle_id: string;
  camera_id: string;
  camera_name: string;
  timestamp: string;
  lat: number;
  lng: number;
  direction: string;
  vehicle_class: string;
  speed_kmh: number;
  confidence: number;
  plate?: string;
}

export interface VehicleSearchResponse {
  global_vehicle_id: string;
  plate: string;
  vehicle_class: string;
  first_seen: string;
  last_seen: string;
  total_observations: number;
  cameras_visited: string[];
  trajectory: TrajectoryEvent[];
  confidence: number;
}

export interface TrafficMetric {
  camera_id: string;
  timestamp: string;
  vehicle_count: number;
  density_veh_km: number;
  flow_veh_min: number;
  avg_speed_kmh: number;
  congestion_level: 'FREE' | 'MODERATE' | 'HEAVY' | 'SEVERE';
  occupancy_pct: number;
}

export interface Alert {
  id: number;
  plate: string;
  camera_id: string;
  camera_name: string;
  timestamp: string;
  vehicle_class: string;
  alert_type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  confidence: number;
  acknowledged: boolean;
}

export interface WatchlistItem {
  plate: string;
  description: string;
  priority: string;
  active: boolean;
  created_at?: string;
}

export interface ODFlow {
  origin_camera_id: string;
  destination_camera_id: string;
  count: number;
  avg_travel_time_sec: number;
}

export interface HeatmapPoint {
  camera_id: string;
  lat: number;
  lng: number;
  intensity: number;
}
