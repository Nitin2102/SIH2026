import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { LiveCamerasView } from './components/LiveCamerasView';
import { CityMapView } from './components/CityMapView';
import { VehicleSearchView } from './components/VehicleSearchView';
import { AnalyticsView } from './components/AnalyticsView';
import { AlertsView } from './components/AlertsView';
import { fetchAlerts } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [alertCount, setAlertCount] = useState<number>(3);

  useEffect(() => {
    const checkAlerts = () => {
      fetchAlerts()
        .then(alerts => setAlertCount(alerts.length))
        .catch(() => {});
    };
    checkAlerts();
    const interval = setInterval(checkAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alertCount}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && <DashboardView onNavigateTab={setActiveTab} />}
        {activeTab === 'cameras' && <LiveCamerasView />}
        {activeTab === 'map' && <CityMapView />}
        {activeTab === 'search' && <VehicleSearchView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'alerts' && <AlertsView />}
      </main>
    </div>
  );
}

export default App;
