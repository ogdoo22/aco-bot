import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Profiles from './pages/Profiles';
import Proxies from './pages/Proxies';
import Settings from './pages/Settings';
import './styles/App.css';

type Page = 'dashboard' | 'profiles' | 'proxies' | 'settings';

/**
 * Main application component
 */
function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = (): JSX.Element => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'profiles':
        return <Profiles />;
      case 'proxies':
        return <Proxies />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>ACO Bot</h1>
          <p className="version">v0.1.0</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="icon">📊</span>
            Dashboard
          </button>

          <button
            className={`nav-item ${currentPage === 'profiles' ? 'active' : ''}`}
            onClick={() => setCurrentPage('profiles')}
          >
            <span className="icon">👤</span>
            Profiles
          </button>

          <button
            className={`nav-item ${currentPage === 'proxies' ? 'active' : ''}`}
            onClick={() => setCurrentPage('proxies')}
          >
            <span className="icon">🌐</span>
            Proxies
          </button>

          <button
            className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            <span className="icon">⚙️</span>
            Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <p className="status">
            <span className="status-dot"></span>
            Connected
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

export default App;
