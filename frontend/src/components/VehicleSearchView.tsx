import React, { useState } from 'react';
import { Search, Clock, CheckCircle2 } from 'lucide-react';
import { searchVehicleByPlate } from '../services/api';
import { VehicleSearchResponse } from '../types';
import { CityMapView } from './CityMapView';

export const VehicleSearchView: React.FC = () => {
  const [query, setQuery] = useState<string>('KA01AB1234');
  const [result, setResult] = useState<VehicleSearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (plateQuery: string) => {
    const plate = plateQuery.trim();

    if (!plate) {
      setError('Please enter a vehicle license plate.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await searchVehicleByPlate(plate);

      // Make sure trajectory is always an array.
      // This prevents the page from crashing if the API
      // returns a response without a trajectory field.
      const safeResult: VehicleSearchResponse = {
        ...data,
        trajectory: Array.isArray(data.trajectory)
          ? data.trajectory
          : [],
        cameras_visited: Array.isArray(data.cameras_visited)
          ? data.cameras_visited
          : [],
      };

      setResult(safeResult);

      if (safeResult.trajectory.length === 0) {
        setError(`No vehicle trajectory found for plate: ${plate}`);
      }
    } catch (err: any) {
      console.error('Vehicle search error:', err);

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Vehicle license plate not found in active database'
      );

      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            marginBottom: '0.25rem',
          }}
        >
          ANPR Vehicle Search & Journey Re-ID
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
          }}
        >
          Lookup license plate to reconstruct spatio-temporal journey
          timeline and map trajectory across all virtual city cameras
        </p>
      </div>

      {/* SEARCH BAR & DEMO BUTTONS */}
      <div
        className="glass-panel"
        style={{ marginBottom: '1.5rem' }}
      >
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              flex: 1,
              position: 'relative',
            }}
          >
            <input
              type="text"
              className="input-field"
              placeholder="Enter License Plate (e.g. KA01AB1234)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(query);
                }
              }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => handleSearch(query)}
            disabled={loading}
          >
            <Search size={18} />

            <span>
              {loading ? 'Searching...' : 'Search Vehicle'}
            </span>
          </button>
        </div>

        {/* DEMO PLATES */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
          }}
        >
          <span>Try Target Demo Plates:</span>

          {[
            'KA01AB1234',
            'KA02CD5678',
            'KA03EF9012',
            'KA04GH3456',
          ].map((plate) => (
            <button
              key={plate}
              className="btn"
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.8rem',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--accent-cyan)',
              }}
              onClick={() => {
                setQuery(plate);
                handleSearch(plate);
              }}
            >
              {plate}
            </button>
          ))}
        </div>
      </div>

      {/* ERROR / NO RESULT MESSAGE */}
      {error && (
        <div
          className="glass-panel"
          style={{
            borderColor: 'var(--accent-crimson)',
            color: 'var(--accent-crimson)',
            marginBottom: '1.5rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* SEARCH RESULT */}
      {result && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
          }}
        >
          {/* LEFT SIDE */}
          <div>
            {/* VEHICLE IDENTITY CARD */}
            <div
              className="glass-panel"
              style={{ marginBottom: '1.25rem' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    GLOBAL VEHICLE IDENTITY
                  </div>

                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {result.plate}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    className="badge badge-free"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <CheckCircle2 size={14} />

                    ID: {result.global_vehicle_id}
                  </span>

                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.35rem',
                    }}
                  >
                    ReID Confidence:{' '}
                    <strong>95%</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  paddingTop: '1rem',
                  borderTop:
                    '1px solid var(--border-color)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Class
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      textTransform: 'capitalize',
                    }}
                  >
                    {result.vehicle_class}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Cameras Visited
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--accent-emerald)',
                    }}
                  >
                    {result.cameras_visited.length} Nodes
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Total Detections
                  </div>

                  <div style={{ fontWeight: 700 }}>
                    {result.total_observations} Observations
                  </div>
                </div>
              </div>
            </div>

            {/* CHRONOLOGICAL TIMELINE */}
            <div className="glass-panel">
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Clock
                  size={18}
                  style={{
                    color: 'var(--accent-cyan)',
                  }}
                />

                Chronological Journey History
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {(result.trajectory ?? []).map(
                  (event, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem',
                        background:
                          'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        borderLeft:
                          '4px solid var(--accent-cyan)',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: '#fff',
                          }}
                        >
                          {idx + 1}. {event.camera_name}{' '}
                          ({event.camera_id})
                        </div>

                        <div
                          style={{
                            fontSize: '0.8rem',
                            color:
                              'var(--text-secondary)',
                            marginTop: '0.2rem',
                          }}
                        >
                          Direction: {event.direction} |
                          Speed: {event.speed_kmh} km/h
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color:
                              'var(--accent-cyan)',
                          }}
                        >
                          {new Date(
                            event.timestamp
                          ).toLocaleTimeString()}
                        </div>

                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Confidence:{' '}
                          {(
                            event.confidence * 100
                          ).toFixed(0)}
                          %
                        </div>
                      </div>
                    </div>
                  )
                )}

                {/* EMPTY TRAJECTORY */}
                {result.trajectory.length === 0 && (
                  <div
                    style={{
                      padding: '1rem',
                      color: 'var(--text-secondary)',
                      background:
                        'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                    }}
                  >
                    No journey detections are available
                    for this vehicle yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - MAP */}
          <div>
            <CityMapView
              highlightTrajectory={result.trajectory}
            />
          </div>
        </div>
      )}
    </div>
  );
};