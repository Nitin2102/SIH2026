import React, { useEffect, useState } from 'react';
import { Camera as CameraIcon } from 'lucide-react';
import { fetchCameras } from '../services/api';
import { Camera } from '../types';

export const LiveCamerasView: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);

  useEffect(() => {
    fetchCameras()
      .then(setCameras)
      .catch(console.error);
  }, []);

  return (
    <div>
      {/* PAGE HEADER */}
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
            Live Multi-Camera AI Vision Grid
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}
          >
            Real-time 15 FPS video streams with object detection,
            SORT tracking, ANPR plate crop, and cross-camera ReID tags
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <span className="badge badge-free">
            ● 8 / 8 Cameras Active
          </span>

          <span className="badge badge-moderate">
            AI Detection Pipeline Live
          </span>
        </div>
      </div>

      {/* 8-CAMERA VIDEO GRID */}
      <div className="camera-grid">

        {cameras.map((cam) => (

          <div
            key={cam.id}
            className="glass-panel camera-card"
          >

            {/* CAMERA HEADER */}
            <div className="camera-header">

              <div>

                <div
                  className="camera-title"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CameraIcon
                    size={16}
                    style={{
                      color: 'var(--accent-cyan)'
                    }}
                  />

                  <span>
                    {cam.id}: {cam.name}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.15rem'
                  }}
                >
                  📍 {cam.location} | Limit: {cam.speed_limit_kmh} km/h
                </div>

              </div>

              <span
                className="badge badge-free"
                style={{
                  fontSize: '0.7rem'
                }}
              >
                LIVE 15 FPS
              </span>

            </div>


            {/* LIVE CAMERA VIDEO */}
            <div className="camera-video-container">

              <img
                src={`http://127.0.0.1:8001/video_feed/${cam.id}`}
                alt={`Live Feed ${cam.id}`}
                className="camera-video-stream"
              />

            </div>


            {/* CAMERA INFORMATION */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.75rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}
            >

              <span>
                Direction:{' '}
                <strong style={{ color: '#fff' }}>
                  {cam.direction}
                </strong>
              </span>

              <span>
                Ref Dist:{' '}
                <strong
                  style={{
                    color: 'var(--accent-cyan)'
                  }}
                >
                  {cam.reference_distance_m}m
                </strong>
              </span>

            </div>

          </div>

        ))}

      </div>
    </div>
  );
};