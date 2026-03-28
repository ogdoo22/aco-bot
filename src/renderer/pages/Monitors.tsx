import React, { useState, useEffect } from 'react';
import '../styles/monitors.css';

declare const window: any;

function Monitors(): JSX.Element {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [productUrl, setProductUrl] = useState('');
  const [productName, setProductName] = useState('');
  const [sizes, setSizes] = useState('');
  const [site, setSite] = useState('shopify');
  const [profileId, setProfileId] = useState('');
  const [mode, setMode] = useState('fast');
  const [pollInterval, setPollInterval] = useState(10);

  useEffect(() => {
    loadMonitors();
    loadProfiles();

    if (window.electron) {
      window.electron.onMonitorUpdate(() => {
        loadMonitors();
      });
    }
  }, []);

  const loadMonitors = async (): Promise<void> => {
    try {
      if (window.electron) {
        const all = await window.electron.getAllMonitors();
        setMonitors(all);
      }
    } catch (error) {
      console.error('Failed to load monitors:', error);
    }
  };

  const loadProfiles = async (): Promise<void> => {
    try {
      if (window.electron) {
        const all = await window.electron.getAllProfiles();
        setProfiles(all);
        if (all.length > 0 && !profileId) {
          setProfileId(all[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const createMonitor = async (): Promise<void> => {
    if (!productUrl || !productName || !sizes || !profileId) {
      alert('Please fill all required fields');
      return;
    }

    const sizeList = sizes.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    if (sizeList.length === 0) {
      alert('Please enter at least one size');
      return;
    }

    const monitor = {
      id: `mon_${Date.now()}`,
      site,
      productUrl,
      productName,
      sizes: sizeList,
      profileId,
      mode,
      pollInterval: pollInterval * 1000,
      status: 'idle',
      lastChecked: null,
      lastStockState: null,
      tasksCreated: 0,
      errorMessage: null,
      createdAt: Date.now(),
      startedAt: null,
    };

    try {
      if (window.electron) {
        await window.electron.createMonitor(monitor);
        setProductUrl('');
        setProductName('');
        setSizes('');
        setIsCreating(false);
        await loadMonitors();
      }
    } catch (error) {
      console.error('Failed to create monitor:', error);
      alert('Failed to create monitor');
    }
  };

  const startMonitor = async (monitorId: string): Promise<void> => {
    try {
      if (window.electron) {
        await window.electron.startMonitor(monitorId);
        await loadMonitors();
      }
    } catch (error) {
      console.error('Failed to start monitor:', error);
    }
  };

  const stopMonitor = async (monitorId: string): Promise<void> => {
    try {
      if (window.electron) {
        await window.electron.stopMonitor(monitorId);
        await loadMonitors();
      }
    } catch (error) {
      console.error('Failed to stop monitor:', error);
    }
  };

  const deleteMonitor = async (monitorId: string): Promise<void> => {
    try {
      if (window.electron) {
        await window.electron.deleteMonitor(monitorId);
        await loadMonitors();
      }
    } catch (error) {
      console.error('Failed to delete monitor:', error);
    }
  };

  const getStatusEmoji = (status: string): string => {
    const map: Record<string, string> = {
      idle: '⏸️',
      monitoring: '👁',
      stock_found: '🟢',
      paused: '⏯️',
      error: '❌',
    };
    return map[status] || '⏸️';
  };

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="monitors-page">
      <div className="monitors-header">
        <h1>Monitors</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? 'Cancel' : '+ New Monitor'}
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="monitor-creator">
          <h2>Create Monitor</h2>
          <form onSubmit={(e) => { e.preventDefault(); createMonitor(); }}>
            <div className="form-row">
              <div className="form-group">
                <label>Site</label>
                <select value={site} onChange={(e) => setSite(e.target.value)}>
                  <option value="shopify">Shopify</option>
                  <option value="walmart">Walmart</option>
                </select>
              </div>

              <div className="form-group">
                <label>Profile</label>
                <select value={profileId} onChange={(e) => setProfileId(e.target.value)}>
                  {profiles.length === 0 && <option value="">No profiles — create one first</option>}
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Product URL</label>
              <input
                type="url"
                placeholder="https://store.com/products/sneaker"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                placeholder="Air Jordan 1 Chicago"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Sizes (comma-separated)</label>
              <input
                type="text"
                placeholder="US 9, US 10, US 11"
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Checkout Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="fast">Fast</option>
                  <option value="safe">Safe</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <div className="form-group">
                <label>Poll Interval: {pollInterval}s</label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={pollInterval}
                  onChange={(e) => setPollInterval(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Create Monitor</button>
              <button type="button" className="btn" onClick={() => setIsCreating(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="monitor-list">
        <h2>Active Monitors ({monitors.length})</h2>

        {monitors.length === 0 ? (
          <div className="empty-state">
            <p>No monitors yet. Create one to start watching for stock.</p>
          </div>
        ) : (
          <div className="monitors">
            {monitors.map((mon) => (
              <div key={mon.id} className={`monitor-card status-${mon.status}`}>
                <div className="monitor-header">
                  <h3>
                    <span className="status-emoji">{getStatusEmoji(mon.status)}</span>
                    {mon.productName}
                  </h3>
                  <span className={`monitor-status status-${mon.status}`}>
                    {mon.status.toUpperCase().replace('_', ' ')}
                  </span>
                </div>

                <div className="monitor-details">
                  <p><strong>Site:</strong> {mon.site}</p>
                  <p><strong>Sizes:</strong> {mon.sizes.join(', ')}</p>
                  <p><strong>Interval:</strong> {mon.pollInterval / 1000}s</p>
                  <p><strong>Last Checked:</strong> {formatTime(mon.lastChecked)}</p>
                  <p><strong>Tasks Created:</strong> {mon.tasksCreated}</p>
                  {mon.errorMessage && (
                    <p className="monitor-error"><strong>Error:</strong> {mon.errorMessage}</p>
                  )}
                </div>

                <div className="monitor-actions">
                  {(mon.status === 'idle' || mon.status === 'paused' || mon.status === 'error') && (
                    <button className="btn btn-sm btn-success" onClick={() => startMonitor(mon.id)}>
                      Start
                    </button>
                  )}
                  {mon.status === 'monitoring' && (
                    <button className="btn btn-sm btn-warning" onClick={() => stopMonitor(mon.id)}>
                      Stop
                    </button>
                  )}
                  <button className="btn btn-sm btn-danger" onClick={() => deleteMonitor(mon.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Monitors;
