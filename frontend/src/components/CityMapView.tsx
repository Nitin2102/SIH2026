import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker
} from 'react-leaflet';
import L from 'leaflet';
import { Flame, Activity } from 'lucide-react';
import {
  fetchCameras,
  fetchCurrentTraffic,
  fetchHeatmapData
} from '../services/api';
import {
  Camera,
  TrafficMetric,
  HeatmapPoint,
  TrajectoryEvent
} from '../types';

interface CityMapViewProps {
  highlightTrajectory?: TrajectoryEvent[];
}

// Custom Leaflet Camera Marker Icon
const createCameraIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="
      background: ${color};
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 0 12px ${color};
      display: flex;
      align-items: center;
      justify-content: center;
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

export const CityMapView: React.FC<CityMapViewProps> = ({
  highlightTrajectory
}) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [traffic, setTraffic] = useState<TrafficMetric[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([]);
  const [heatmapMode, setHeatmapMode] = useState<string>('density');

  useEffect(() => {
    const load = async () => {
      try {
        const [cData, tData, hData] = await Promise.all([
          fetchCameras(),
          fetchCurrentTraffic(),
          fetchHeatmapData(heatmapMode)
        ]);

        setCameras(cData);
        setTraffic(tData);
        setHeatmap(hData);
      } catch (err) {
        console.error('Map load error:', err);
      }
    };

    load();

    const interval = setInterval(load, 5000);

    return () => clearInterval(interval);
  }, [heatmapMode]);

  // Road connections between camera nodes
  const roadConnections = [
    { from: 'CAM-01', to: 'CAM-02' },
    { from: 'CAM-02', to: 'CAM-03' },
    { from: 'CAM-02', to: 'CAM-04' },
    { from: 'CAM-02', to: 'CAM-05' },
    { from: 'CAM-03', to: 'CAM-06' },
    { from: 'CAM-03', to: 'CAM-08' },
    { from: 'CAM-04', to: 'CAM-08' },
    { from: 'CAM-05', to: 'CAM-07' },
    { from: 'CAM-01', to: 'CAM-06' }
  ];

  // Find camera coordinates by ID
  const getCamCoords = (id: string): [number, number] | null => {
    const camera = cameras.find(cam => cam.id === id);

    if (!camera) {
      return null;
    }

    return [camera.lat, camera.lng];
  };

  // Vehicle trajectory
  const trajectoryPositions: [number, number][] = highlightTrajectory
    ? highlightTrajectory.map(event => [event.lat, event.lng])
    : [];

  return (
    <div>
      <div
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              marginBottom: '0.25rem'
            }}
          >
            Virtual City GIS Map & Spatial Intelligence
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}
          >
            Interactive map displaying camera nodes, road segment
            congestion, traffic density, and vehicle route playback
          </p>
        </div>

        {/* Heatmap Controls */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            background: 'rgba(16, 22, 36, 0.8)',
            padding: '0.4rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}
        >
          <button
            className={`btn ${
              heatmapMode === 'density' ? 'btn-primary' : ''
            }`}
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.75rem',
              background:
                heatmapMode === 'density'
                  ? undefined
                  : 'transparent'
            }}
            onClick={() => setHeatmapMode('density')}
          >
            <Flame size={14} />
            Traffic Density
          </button>

          <button
            className={`btn ${
              heatmapMode === 'congestion' ? 'btn-primary' : ''
            }`}
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.75rem',
              background:
                heatmapMode === 'congestion'
                  ? undefined
                  : 'transparent'
            }}
            onClick={() => setHeatmapMode('congestion')}
          >
            <Activity size={14} />
            Congestion Index
          </button>
        </div>
      </div>

      <div
        className="glass-panel"
        style={{
          padding: '0.75rem'
        }}
      >
        <div className="map-container">
          <MapContainer
            center={[12.9750, 77.5950]}
            zoom={13}
            style={{
              height: '100%',
              width: '100%'
            }}
            scrollWheelZoom={true}
          >
            {/* FREE OPENSTREETMAP TILE LAYER */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* ROAD NETWORK */}
            {roadConnections.map((connection, index) => {
              const c1 = getCamCoords(connection.from);
              const c2 = getCamCoords(connection.to);

              if (!c1 || !c2) {
                return null;
              }

              const trafficData = traffic.find(
                item => item.camera_id === connection.from
              );

              const congestion =
                trafficData?.congestion_level || 'FREE';

              const congestionColors: Record<string, string> = {
                FREE: '#10b981',
                MODERATE: '#f59e0b',
                HEAVY: '#ef4444',
                SEVERE: '#a855f7'
              };

              return (
                <Polyline
                  key={index}
                  positions={[c1, c2]}
                  pathOptions={{
                    color:
                      congestionColors[congestion] ||
                      '#10b981',
                    weight: 5,
                    opacity: 0.9,
                    dashArray:
                      congestion === 'HEAVY' ||
                      congestion === 'SEVERE'
                        ? '8, 8'
                        : undefined
                  }}
                />
              );
            })}

            {/* TRAFFIC HEATMAP */}
            {heatmap.map(point => (
              <CircleMarker
                key={point.camera_id}
                center={[point.lat, point.lng]}
                radius={28 * point.intensity + 10}
                pathOptions={{
                  fillColor:
                    point.intensity > 0.7
                      ? '#ef4444'
                      : point.intensity > 0.4
                      ? '#f59e0b'
                      : '#00e5ff',
                  fillOpacity: 0.35,
                  stroke: false
                }}
              />
            ))}

            {/* VEHICLE TRAJECTORY */}
            {trajectoryPositions.length > 0 && (
              <Polyline
                positions={trajectoryPositions}
                pathOptions={{
                  color: '#00e5ff',
                  weight: 6,
                  opacity: 0.95,
                  dashArray: '10, 10'
                }}
              />
            )}

            {/* CAMERA MARKERS */}
            {cameras.map(camera => {
              const trafficData = traffic.find(
                item => item.camera_id === camera.id
              );

              const color =
                trafficData?.congestion_level === 'SEVERE'
                  ? '#a855f7'
                  : trafficData?.congestion_level === 'HEAVY'
                  ? '#ef4444'
                  : '#00e5ff';

              return (
                <Marker
                  key={camera.id}
                  position={[camera.lat, camera.lng]}
                  icon={createCameraIcon(color)}
                >
                  <Popup>
                    <div
                      style={{
                        color: '#000',
                        padding: '0.25rem'
                      }}
                    >
                      <strong
                        style={{
                          fontSize: '1rem',
                          color: '#000'
                        }}
                      >
                        {camera.id}: {camera.name}
                      </strong>

                      <div
                        style={{
                          fontSize: '0.85rem',
                          marginTop: '0.25rem'
                        }}
                      >
                        Location: {camera.location}
                      </div>

                      <div
                        style={{
                          fontSize: '0.85rem'
                        }}
                      >
                        Vehicles Tracked:{' '}
                        <strong>
                          {trafficData?.vehicle_count || 0}
                        </strong>
                      </div>

                      <div
                        style={{
                          fontSize: '0.85rem'
                        }}
                      >
                        Avg Speed:{' '}
                        <strong>
                          {trafficData?.avg_speed_kmh || 50} km/h
                        </strong>
                      </div>

                      <div
                        style={{
                          fontSize: '0.85rem'
                        }}
                      >
                        Status:{' '}
                        <strong
                          style={{
                            color
                          }}
                        >
                          {trafficData?.congestion_level ||
                            'FREE'}
                        </strong>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};