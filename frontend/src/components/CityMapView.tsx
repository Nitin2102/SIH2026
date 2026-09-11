import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Flame, Activity } from 'lucide-react';
import { fetchCameras, fetchCurrentTraffic, fetchHeatmapData } from '../services/api';
import { Camera, TrafficMetric, HeatmapPoint, TrajectoryEvent } from '../types';

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

export const CityMapView: React.FC<CityMapViewProps> = ({ highlightTrajectory }) => {
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
        console.error("Map load error:", err);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [heatmapMode]);

  // Road connections geometry vectors between cameras
  const roadConnections = [
    { from: "CAM-01", to: "CAM-02" },
    { from: "CAM-02", to: "CAM-03" },
    { from: "CAM-02", to: "CAM-04" },
    { from: "CAM-02", to: "CAM-05" },
    { from: "CAM-03", to: "CAM-06" },
    { from: "CAM-03", to: "CAM-08" },
    { from: "CAM-04", to: "CAM-08" },
    { from: "CAM-05", to: "CAM-07" },
    { from: "CAM-01", to: "CAM-06" },
  ];

  // Helper to find camera coordinates by ID
  const getCamCoords = (id: string): [number, number] | null => {
    const c = cameras.find(cam => cam.id === id);
    return c ? [c.lat, c.lng] : null;
  };

  // Trajectory polyline coordinates if vehicle search active
  const trajectoryPositions: [number, number][] = highlightTrajectory
    ? highlightTrajectory.map(e => [e.lat, e.lng])
    : [];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Virtual City GIS Map & Spatial Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Interactive map displaying 8 camera nodes, road segment congestion lines, density heatmaps, and vehicle route playback</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(16, 22, 36, 0.8)', padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            className={`btn ${heatmapMode === 'density' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: heatmapMode === 'density' ? undefined : 'transparent' }}
            onClick={() => setHeatmapMode('density')}
          >
            <Flame size={14} /> Traffic Density
          </button>
          <button
            className={`btn ${heatmapMode === 'congestion' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: heatmapMode === 'congestion' ? undefined : 'transparent' }}
            onClick={() => setHeatmapMode('congestion')}
          >
            <Activity size={14} /> Congestion Index
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0.75rem' }}>
        <div className="map-container">
          <MapContainer
            center={[12.9750, 77.5950]}
            zoom={13}
            style={{ height: '100%', width: '100%', background: '#0a0d14' }}
            scrollWheelZoom={true}
          >
            {/* Dark GIS Map Tile Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* ROAD NETWORK POLYLINE EDGES */}
            {roadConnections.map((conn, idx) => {
              const c1 = getCamCoords(conn.from);
              const c2 = getCamCoords(conn.to);
              if (!c1 || !c2) return null;

              const t1 = traffic.find(t => t.camera_id === conn.from);
              const congestion = t1?.congestion_level || 'FREE';
              const colors: Record<string, string> = {
                FREE: '#10b981',
                MODERATE: '#f59e0b',
                HEAVY: '#ef4444',
                SEVERE: '#a855f7'
              };

              return (
                <Polyline
                  key={idx}
                  positions={[c1, c2]}
                  pathOptions={{
                    color: colors[congestion] || '#10b981',
                    weight: 4,
                    opacity: 0.85,
                    dashArray: congestion === 'HEAVY' || congestion === 'SEVERE' ? '6, 6' : undefined
                  }}
                />
              );
            })}

            {/* HEATMAP CIRCLE OVERLAYS */}
            {heatmap.map((pt) => (
              <CircleMarker
                key={pt.camera_id}
                center={[pt.lat, pt.lng]}
                radius={28 * pt.intensity + 10}
                pathOptions={{
                  fillColor: pt.intensity > 0.7 ? '#ef4444' : (pt.intensity > 0.4 ? '#f59e0b' : '#00e5ff'),
                  fillOpacity: 0.35,
                  stroke: false
                }}
              />
            ))}

            {/* HIGHLIGHTED VEHICLE TRAJECTORY ROUTE */}
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

            {/* CAMERA NODE MARKERS */}
            {cameras.map((cam) => {
              const t = traffic.find(tr => tr.camera_id === cam.id);
              const color = t?.congestion_level === 'SEVERE' ? '#a855f7' : (t?.congestion_level === 'HEAVY' ? '#ef4444' : '#00e5ff');
              return (
                <Marker
                  key={cam.id}
                  position={[cam.lat, cam.lng]}
                  icon={createCameraIcon(color)}
                >
                  <Popup>
                    <div style={{ color: '#000', padding: '0.25rem' }}>
                      <strong style={{ fontSize: '1rem', color: '#000' }}>{cam.id}: {cam.name}</strong>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Location: {cam.location}</div>
                      <div style={{ fontSize: '0.85rem' }}>Vehicles Tracked: <strong>{t?.vehicle_count || 0}</strong></div>
                      <div style={{ fontSize: '0.85rem' }}>Avg Speed: <strong>{t?.avg_speed_kmh || 50} km/h</strong></div>
                      <div style={{ fontSize: '0.85rem' }}>Status: <strong style={{ color: color }}>{t?.congestion_level || 'FREE'}</strong></div>
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
