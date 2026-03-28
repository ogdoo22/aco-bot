import React, { useState, useEffect } from 'react';
import '../styles/settings.css';

interface AppSettings {
  twoCaptchaApiKey: string;
  discordWebhookUrl: string;
  dbPath: string;
  logDir: string;
}

function Settings(): JSX.Element {
  const [settings, setSettings] = useState<AppSettings>({
    twoCaptchaApiKey: '',
    discordWebhookUrl: '',
    dbPath: '',
    logDir: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    try {
      const data = await window.electron.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      await window.electron.setSetting('twoCaptchaApiKey', settings.twoCaptchaApiKey);
      await window.electron.setSetting('discordWebhookUrl', settings.discordWebhookUrl);

      setSaveMessage('✅ Settings saved successfully!');
      setIsEditing(false);

      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      setSaveMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestDiscord = async (): Promise<void> => {
    try {
      await window.electron.testDiscord();
      alert('✅ Discord test message sent! Check your Discord channel.');
    } catch (error: any) {
      alert(`❌ Discord test failed: ${error.message}`);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Settings</h1>
        {!isEditing && (
          <button className="btn-primary" onClick={() => setIsEditing(true)}>
            Edit Settings
          </button>
        )}
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.startsWith('✅') ? 'success' : 'error'}`}>
          {saveMessage}
        </div>
      )}

      <div className="settings-container">
        {/* 2Captcha Settings */}
        <div className="settings-section">
          <h2>🔐 2Captcha Configuration</h2>
          <p className="section-description">
            2Captcha is used to solve "I'm not a robot" challenges during checkout.
          </p>

          <div className="setting-item">
            <label>API Key:</label>
            {isEditing ? (
              <input
                type="text"
                value={settings.twoCaptchaApiKey}
                onChange={(e) => setSettings({ ...settings, twoCaptchaApiKey: e.target.value })}
                placeholder="Enter your 2Captcha API key"
              />
            ) : (
              <div className="setting-value">
                {settings.twoCaptchaApiKey
                  ? `${settings.twoCaptchaApiKey.substring(0, 8)}...${settings.twoCaptchaApiKey.slice(-4)}`
                  : 'Not configured'}
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="setting-info">
              <a href="https://2captcha.com" target="_blank" rel="noopener noreferrer">
                Sign up for 2Captcha →
              </a>
            </div>
          )}
        </div>

        {/* Discord Settings */}
        <div className="settings-section">
          <h2>💬 Discord Notifications (Optional)</h2>
          <p className="section-description">
            Get notified in Discord when you successfully checkout an item.
          </p>

          <div className="setting-item">
            <label>Webhook URL:</label>
            {isEditing ? (
              <input
                type="text"
                value={settings.discordWebhookUrl}
                onChange={(e) => setSettings({ ...settings, discordWebhookUrl: e.target.value })}
                placeholder="https://discord.com/api/webhooks/..."
              />
            ) : (
              <div className="setting-value">
                {settings.discordWebhookUrl ? 'Configured ✅' : 'Not configured (optional)'}
              </div>
            )}
          </div>

          {!isEditing && settings.discordWebhookUrl && (
            <button className="btn-secondary" onClick={handleTestDiscord}>
              Send Test Message
            </button>
          )}

          {!isEditing && !settings.discordWebhookUrl && (
            <div className="setting-info">
              <p>To set up:</p>
              <ol>
                <li>Go to Discord Server Settings → Integrations</li>
                <li>Create a webhook</li>
                <li>Copy the webhook URL</li>
                <li>Paste it here</li>
              </ol>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="settings-section">
          <h2>📊 System Information</h2>

          <div className="setting-item">
            <label>Database Location:</label>
            <div className="setting-value mono">{settings.dbPath}</div>
          </div>

          <div className="setting-item">
            <label>Logs Directory:</label>
            <div className="setting-value mono">{settings.logDir}</div>
          </div>

          <div className="setting-info">
            <p>
              💡 <strong>Logs are useful for debugging.</strong> If you encounter issues, share
              recent logs with support.
            </p>
          </div>
        </div>

        {/* BYOP Info */}
        <div className="settings-section byop-info-section">
          <h2>🌐 Proxy Configuration</h2>
          <p className="section-description">
            This bot uses the <strong>BYOP (Bring Your Own Proxies)</strong> model.
          </p>

          <div className="info-box">
            <h3>How it works:</h3>
            <ul>
              <li>Each profile manages its own proxy credentials</li>
              <li>Go to <strong>Profiles</strong> → Select profile → <strong>Import Proxies</strong></li>
              <li>Use <strong>ISP proxies</strong> for Walmart</li>
              <li>Use <strong>Residential proxies</strong> for Shopify</li>
            </ul>
            <p className="learn-more">
              📚 Read <code>BYOP_GUIDE.md</code> for detailed instructions
            </p>
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="settings-actions">
            <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setIsEditing(false);
                loadSettings(); // Reset to original values
              }}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
