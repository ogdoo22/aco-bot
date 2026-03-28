import React, { useState, useEffect } from 'react';
import '../styles/profiles.css';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  shipping: any;
  billing: any;
  payment: any;
}

interface Proxy {
  id: string;
  profileId: string;
  host: string;
  port: number;
  username: string;
  type: 'residential' | 'datacenter' | 'isp';
  successRate: number;
  speedMs: number | null;
  isActive: boolean;
}

function Profiles(): JSX.Element {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [showProxyImport, setShowProxyImport] = useState(false);
  const [proxyImportText, setProxyImportText] = useState('');
  const [proxyType, setProxyType] = useState<'residential' | 'datacenter' | 'isp'>('isp');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Load profiles
  useEffect(() => {
    loadProfiles();
  }, []);

  // Load proxies when profile selected
  useEffect(() => {
    if (selectedProfile) {
      loadProxies(selectedProfile);
    }
  }, [selectedProfile]);

  const loadProfiles = async (): Promise<void> => {
    const allProfiles = await window.electron.getAllProfiles();
    setProfiles(allProfiles);
  };

  const loadProxies = async (profileId: string): Promise<void> => {
    const profileProxies = await window.electron.getProxiesByProfile(profileId);
    setProxies(profileProxies);
  };

  const handleImportProxies = async (): Promise<void> => {
    if (!selectedProfile || !proxyImportText.trim()) {
      alert('Please select a profile and enter proxy data');
      return;
    }

    const proxyList = proxyImportText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (proxyList.length === 0) {
      alert('No valid proxies found');
      return;
    }

    try {
      const result = await window.electron.importProxies({
        profileId: selectedProfile,
        proxyList,
        type: proxyType,
      });

      alert(`✅ Imported ${result.imported} proxies`);
      setProxyImportText('');
      setShowProxyImport(false);
      loadProxies(selectedProfile);
    } catch (error: any) {
      alert(`❌ Import failed: ${error.message}`);
    }
  };

  const handleTestProxy = async (proxyId: string): Promise<void> => {
    try {
      const result = await window.electron.testProxy(proxyId);
      if (result.success) {
        alert(`✅ Proxy working! Speed: ${result.speedMs}ms`);
      } else {
        alert(`❌ Proxy failed: ${result.error}`);
      }
      if (selectedProfile) {
        loadProxies(selectedProfile);
      }
    } catch (error: any) {
      alert(`❌ Test failed: ${error.message}`);
    }
  };

  const handleDeleteProxy = async (proxyId: string): Promise<void> => {
    if (confirm('Delete this proxy?')) {
      await window.electron.deleteProxy(proxyId);
      if (selectedProfile) {
        loadProxies(selectedProfile);
      }
    }
  };

  const handleCreateProfile = (): void => {
    setIsCreatingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const profile: Profile = {
      id: `profile_${Date.now()}`,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      shipping: {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        address1: formData.get('address1') as string,
        address2: formData.get('address2') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zip: formData.get('zip') as string,
        country: formData.get('country') as string,
      },
      billing: {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        address1: formData.get('address1') as string,
        address2: formData.get('address2') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zip: formData.get('zip') as string,
        country: formData.get('country') as string,
      },
      payment: {
        cardNumber: formData.get('cardNumber') as string,
        cardholderName: formData.get('cardholderName') as string,
        expiryMonth: formData.get('expiryMonth') as string,
        expiryYear: formData.get('expiryYear') as string,
        cvv: formData.get('cvv') as string,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await window.electron.createProfile(profile);
    setIsCreatingProfile(false);
    loadProfiles();
    alert('✅ Profile created');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profiles & Proxies</h1>
        <button className="btn-primary" onClick={handleCreateProfile}>
          + New Profile
        </button>
      </div>

      {isCreatingProfile && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create Profile</h2>
            <form onSubmit={handleSaveProfile}>
              <div className="form-section">
                <h3>Basic Info</h3>
                <input name="name" placeholder="Profile Name" required />
                <input name="email" type="email" placeholder="Email" required />
                <input name="phone" placeholder="Phone" required />
              </div>

              <div className="form-section">
                <h3>Shipping Address</h3>
                <div className="form-row">
                  <input name="firstName" placeholder="First Name" required />
                  <input name="lastName" placeholder="Last Name" required />
                </div>
                <input name="address1" placeholder="Address Line 1" required />
                <input name="address2" placeholder="Address Line 2" />
                <div className="form-row">
                  <input name="city" placeholder="City" required />
                  <input name="state" placeholder="State" required />
                  <input name="zip" placeholder="ZIP" required />
                </div>
                <input name="country" placeholder="Country" required />
              </div>

              <div className="form-section">
                <h3>Payment Info</h3>
                <input name="cardNumber" placeholder="Card Number" required />
                <input name="cardholderName" placeholder="Cardholder Name" required />
                <div className="form-row">
                  <input name="expiryMonth" placeholder="MM" maxLength={2} required />
                  <input name="expiryYear" placeholder="YY" maxLength={2} required />
                  <input name="cvv" placeholder="CVV" maxLength={4} required />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Save Profile
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreatingProfile(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="profiles-container">
        {/* Profile List */}
        <div className="profile-list">
          <h2>Your Profiles</h2>
          {profiles.length === 0 ? (
            <p className="empty-state">No profiles yet. Create one to get started!</p>
          ) : (
            profiles.map((profile) => (
              <div
                key={profile.id}
                className={`profile-card ${selectedProfile === profile.id ? 'active' : ''}`}
                onClick={() => setSelectedProfile(profile.id)}
              >
                <h3>{profile.name}</h3>
                <p>{profile.email}</p>
                <p className="profile-meta">{profile.phone}</p>
              </div>
            ))
          )}
        </div>

        {/* Proxy Management for Selected Profile */}
        {selectedProfile && (
          <div className="proxy-manager">
            <div className="proxy-header">
              <h2>Proxies (BYOP)</h2>
              <button className="btn-primary" onClick={() => setShowProxyImport(true)}>
                + Import Proxies
              </button>
            </div>

            <div className="byop-info">
              <p>
                <strong>💡 BYOP (Bring Your Own Proxies)</strong>
              </p>
              <p>
                Each profile uses its own proxies. For Walmart, use ISP proxies. For Shopify, use
                residential proxies.
              </p>
            </div>

            {showProxyImport && (
              <div className="proxy-import-form">
                <h3>Import Proxies</h3>
                <p>
                  Enter proxies in format: <code>user:pass@host:port</code> or{' '}
                  <code>host:port:user:pass</code>
                </p>

                <select value={proxyType} onChange={(e) => setProxyType(e.target.value as any)}>
                  <option value="isp">ISP (Recommended for Walmart)</option>
                  <option value="residential">Residential (Shopify)</option>
                  <option value="datacenter">Datacenter</option>
                </select>

                <textarea
                  value={proxyImportText}
                  onChange={(e) => setProxyImportText(e.target.value)}
                  placeholder="user:pass@gate.smartproxy.com:7000&#10;user:pass@gate.smartproxy.com:7001&#10;user:pass@gate.smartproxy.com:7002"
                  rows={10}
                />

                <div className="form-actions">
                  <button className="btn-primary" onClick={handleImportProxies}>
                    Import
                  </button>
                  <button className="btn-secondary" onClick={() => setShowProxyImport(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Proxy List */}
            <div className="proxy-list">
              <h3>
                Active Proxies ({proxies.filter((p) => p.isActive).length}/{proxies.length})
              </h3>
              {proxies.length === 0 ? (
                <p className="empty-state">
                  No proxies configured. Import your proxy credentials above.
                </p>
              ) : (
                <table className="proxy-table">
                  <thead>
                    <tr>
                      <th>Host</th>
                      <th>Type</th>
                      <th>Success Rate</th>
                      <th>Speed</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proxies.map((proxy) => (
                      <tr key={proxy.id}>
                        <td>
                          {proxy.host}:{proxy.port}
                        </td>
                        <td>
                          <span className={`proxy-type ${proxy.type}`}>{proxy.type}</span>
                        </td>
                        <td>{(proxy.successRate * 100).toFixed(0)}%</td>
                        <td>{proxy.speedMs ? `${proxy.speedMs}ms` : '-'}</td>
                        <td>
                          <span className={`status ${proxy.isActive ? 'active' : 'inactive'}`}>
                            {proxy.isActive ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-small"
                            onClick={() => handleTestProxy(proxy.id)}
                          >
                            Test
                          </button>
                          <button
                            className="btn-small btn-danger"
                            onClick={() => handleDeleteProxy(proxy.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {!selectedProfile && profiles.length > 0 && (
          <div className="empty-state-large">
            <p>Select a profile to manage its proxies</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profiles;
