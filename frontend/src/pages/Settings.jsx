import React, { useEffect, useState } from 'react';
import api from '../api';
import { Card, Button, Input } from '../components/ui';
import { Bell } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({ currency: 'INR', ntfy_url: '', ntfy_topic: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/api/settings/').then(res => setSettings(res.data));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    await api.put('/api/settings/', settings);
    setLoading(false);
    setMsg('Settings saved successfully');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleTestNtfy = async () => {
    const res = await api.post('/api/settings/test-ntfy');
    alert(res.data.message);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Card>
        <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">Profile & Preferences</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <Input 
            label="Currency Symbol" 
            value={settings.currency} 
            onChange={e => setSettings({...settings, currency: e.target.value})} 
          />
          
          <div className="pt-4">
             <div className="flex items-center gap-2 mb-2">
                <Bell size={18} className="text-primary"/>
                <h4 className="font-medium">Notification Settings (Ntfy.sh)</h4>
             </div>
             <p className="text-xs text-slate-500 mb-4">
               Enter your self-hosted or public ntfy URL. Leave blank if not used.
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    label="Server URL" 
                    placeholder="https://ntfy.sh"
                    value={settings.ntfy_url || ''} 
                    onChange={e => setSettings({...settings, ntfy_url: e.target.value})} 
                />
                <Input 
                    label="Topic Name" 
                    placeholder="my-secret-topic-123"
                    value={settings.ntfy_topic || ''} 
                    onChange={e => setSettings({...settings, ntfy_topic: e.target.value})} 
                />
             </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" isLoading={loading}>Save Settings</Button>
            <Button type="button" variant="secondary" onClick={handleTestNtfy}>Test Notification</Button>
          </div>
          {msg && <p className="text-green-400 text-sm mt-2">{msg}</p>}
        </form>
      </Card>
      
      <div className="text-center text-xs text-slate-600 mt-8">
        CC-Track v1.0 • Self Hosted
      </div>
    </div>
  );
};

export default Settings;