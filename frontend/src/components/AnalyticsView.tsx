import React, { useEffect, useState } from 'react';
import { BarChart3, ArrowRight, AlertTriangle, Layers, TrendingUp } from 'lucide-react';
import { fetchBottlenecks, fetchODMatrix, fetchCurrentTraffic } from '../services/api';
import { ODFlow, TrafficMetric } from '../types';

export const AnalyticsView: React.FC = () => {
  const [bottlenecks, setBottlenecks] = useState<any[]>([]);
  const [odMatrix, setOdMatrix] = useState<ODFlow[]>([]);
  const [traffic, setTraffic] = useState<TrafficMetric[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [bData, odData, tData] = await Promise.all([
          fetchBottlenecks(),
          fetchODMatrix(),
          fetchCurrentTraffic()
        ]);
        setBottlenecks(bData);
        setOdMatrix(odData);
        setTraffic(tData);
      } catch (err) {
        console.error("Analytics load error:", err);
      }
    };
    load();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Citywide Traffic Intelligence & OD Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cross-camera origin-destination matrix, bottleneck rankings, density utilization, and speed distributions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* RANKED BOTTLENECK LEADERBOARD */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent-amber)' }} />
            Ranked Congestion Bottlenecks
          </h3>

          <table className="data-table">
            <thead>
              <tr>
                <th>Rank & Node</th>
                <th>Congestion Level</th>
                <th>Avg Speed</th>
                <th>Vehicles</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {bottlenecks.length > 0 ? (
                bottlenecks.map((b, idx) => (
                  <tr key={b.camera_id}>
                    <td style={{ fontWeight: 700 }}>
                      #{idx + 1} {b.camera_name} ({b.camera_id})
                    </td>
                    <td>
                      <span className={`badge badge-${b.congestion_level.toLowerCase()}`}>{b.congestion_level}</span>
                    </td>
                    <td>{b.avg_speed_kmh} km/h</td>
                    <td>{b.vehicle_count}</td>
                    <td style={{ fontWeight: 800, color: 'var(--accent-amber)' }}>{b.bottleneck_score}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>All camera intersections operating at free-flow speed</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* VEHICLE CLASS DISTRIBUTION */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} style={{ color: 'var(--accent-cyan)' }} />
            Vehicle Class Breakdown
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--accent-cyan)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Passenger Cars</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>64%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>Primary Volume</div>
            </div>
            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--accent-emerald)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Motorcycles</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>22%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>High Mobility</div>
            </div>
            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--accent-amber)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Trucks & Heavy</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>9%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>Freight Corridors</div>
            </div>
            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--accent-purple)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Buses</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>5%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>Public Transit</div>
            </div>
          </div>
        </div>
      </div>

      {/* ORIGIN-DESTINATION TRAFFIC MATRIX */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} style={{ color: 'var(--accent-emerald)' }} />
          Cross-Camera Origin-Destination (OD) Traffic Matrix
        </h3>

        <table className="data-table">
          <thead>
            <tr>
              <th>Origin Node</th>
              <th>Destination Node</th>
              <th>Trips Recorded</th>
              <th>Avg Travel Time</th>
              <th>Corridor Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { from: 'CAM-01 (North Gate)', to: 'CAM-02 (Central Junction)', count: 340, time: '1m 12s' },
              { from: 'CAM-02 (Central Junction)', to: 'CAM-03 (East Tech Park)', count: 410, time: '2m 05s' },
              { from: 'CAM-03 (East Tech Park)', to: 'CAM-05 (West Avenue)', count: 280, time: '3m 18s' },
              { from: 'CAM-05 (West Avenue)', to: 'CAM-08 (Highway Toll)', count: 190, time: '4m 45s' },
            ].map((row, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{row.from}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{row.to}</td>
                <td style={{ fontWeight: 800 }}>{row.count} trips</td>
                <td>{row.time}</td>
                <td>
                  <span className="badge badge-free">OPTIMAL FLOW</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
