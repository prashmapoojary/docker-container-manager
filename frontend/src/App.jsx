import { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Square, RotateCw, FileText, Search, RefreshCw, Cpu, MemoryStick } from 'lucide-react';

const API_BASE = 'http://localhost:5000';
const GRAFANA_BASE = 'http://localhost:3001';
const DASHBOARD_ID = 'adsrvlz'; // Your dashboard ID

function App() {
  const [containers, setContainers] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [logsModal, setLogsModal] = useState({ show: false, name: '', logs: '' });

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/containers`);
      setContainers(res.data);
      res.data.forEach((container) => {
        if (container.State === 'running') {
          fetchStats(container.Id);
        }
      });
    } catch (err) {
      alert('Failed to connect to backend. Is backend running?');
      console.error(err);
    }
    setLoading(false);
  };

  const fetchStats = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/containers/${id}/stats`);
      setStats((prev) => ({ ...prev, [id]: res.data }));
    } catch (err) {
      console.error('Failed to fetch stats for', id);
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, []);

  const startContainer = async (id, name) => {
    if (!confirm(`Start container: ${name}?`)) return;
    try {
      await axios.post(`${API_BASE}/containers/${id}/start`);
      fetchContainers();
    } catch (err) {
      alert('Failed to start container');
    }
  };

  const stopContainer = async (id, name) => {
    if (!confirm(`Stop container: ${name}?`)) return;
    try {
      await axios.post(`${API_BASE}/containers/${id}/stop`);
      fetchContainers();
    } catch (err) {
      alert('Failed to stop container');
    }
  };

  const restartContainer = async (id, name) => {
    if (!confirm(`Restart container: ${name}?`)) return;
    try {
      await axios.post(`${API_BASE}/containers/${id}/restart`);
      fetchContainers();
    } catch (err) {
      alert('Failed to restart container');
    }
  };

  const viewLogs = async (id, name) => {
    try {
      const res = await axios.get(`${API_BASE}/containers/${id}/logs`);
      setLogsModal({ show: true, name, logs: res.data });
    } catch (err) {
      alert('Failed to fetch logs');
    }
  };

  const filteredContainers = containers.filter(c =>
    c.Names[0].toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count running and stopped containers
  const runningCount = containers.filter(c => c.State === 'running').length;
  const stoppedCount = containers.length - runningCount;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary">Docker Container Manager</h1>
            <p className="text-muted-foreground mt-1">Mini Portainer • Live Monitoring</p>
          </div>
          <button
            onClick={fetchContainers}
            className="flex items-center gap-2 bg-card hover:bg-muted px-5 py-2.5 rounded-xl border border-border transition"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Summary */}
        <div className="flex gap-4 mb-6">
          <div className="bg-card border border-border rounded-2xl px-6 py-3">
            <span className="text-muted-foreground text-sm">Total</span>
            <p className="text-2xl font-bold">{containers.length}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl px-6 py-3">
            <span className="text-muted-foreground text-sm">Running</span>
            <p className="text-2xl font-bold text-primary">{runningCount}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl px-6 py-3">
            <span className="text-muted-foreground text-sm">Stopped</span>
            <p className="text-2xl font-bold text-destructive">{stoppedCount}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search containers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border pl-12 py-3 rounded-2xl focus:outline-none focus:border-primary text-lg text-foreground"
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-5">Container Name</th>
                <th className="text-left p-5">Image</th>
                <th className="text-left p-5">Status</th>
                <th className="text-left p-5">CPU</th>
                <th className="text-left p-5">RAM</th>
                <th className="text-left p-5">Ports</th>
                <th className="text-center p-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContainers.map((container) => {
                const name = container.Names[0].replace('/', '');
                const isRunning = container.State === 'running';
                const containerStats = stats[container.Id];

                return (
                  <tr key={container.Id} className="hover:bg-muted/50 border-b border-border last:border-none transition">
                    <td className="p-5 font-medium">{name}</td>
                    <td className="p-5 text-muted-foreground">{container.Image}</td>
                    <td className="p-5">
                      <span className={`px-4 py-1 rounded-full text-sm font-medium ${isRunning ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                        }`}>
                        {container.Status}
                      </span>
                    </td>

                    <td className="p-5">
                      {isRunning && containerStats ? (
                        <div className="flex items-center gap-2">
                          <Cpu size={16} className="text-primary" />
                          <span className="font-mono text-sm">{containerStats.cpuPercent}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>

                    <td className="p-5">
                      {isRunning && containerStats ? (
                        <div className="flex items-center gap-2">
                          <MemoryStick size={16} className="text-primary" />
                          <span className="font-mono text-sm">
                            {containerStats.memUsageMB} MB ({containerStats.memPercent}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>

                    <td className="p-5 text-muted-foreground">
                      {container.Ports?.length > 0
                        ? container.Ports.map(p => `${p.PublicPort}:${p.PrivatePort}`).join(', ')
                        : '-'}
                    </td>
                    <td className="p-5">
                      <div className="flex gap-2 justify-center">
                        {!isRunning && (
                          <button
                            onClick={() => startContainer(container.Id, name)}
                            className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 transition"
                          >
                            <Play size={18} /> Start
                          </button>
                        )}

                        {isRunning && (
                          <>
                            <button
                              onClick={() => stopContainer(container.Id, name)}
                              className="bg-destructive hover:opacity-90 text-destructive-foreground px-4 py-2 rounded-xl flex items-center gap-2 transition"
                            >
                              <Square size={18} /> Stop
                            </button>

                            <button
                              onClick={() => restartContainer(container.Id, name)}
                              className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-xl flex items-center gap-2 transition"
                            >
                              <RotateCw size={18} /> Restart
                            </button>

                            <button
                              onClick={() => viewLogs(container.Id, name)}
                              className="bg-secondary hover:bg-muted text-secondary-foreground px-4 py-2 rounded-xl flex items-center gap-2 transition"
                            >
                              <FileText size={18} /> Logs
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredContainers.length === 0 && (
            <p className="text-center py-12 text-muted-foreground">No containers found.</p>
          )}
        </div>

        {/* Grafana Monitoring Graphs */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-primary mb-4">📊 Live Monitoring (Grafana)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU Graph */}
            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-lg p-2">
              <iframe
                src={`${GRAFANA_BASE}/d-solo/${DASHBOARD_ID}/docker-monitoring-dashboard?orgId=1&from=now-15m&to=now&panelId=panel-1&refresh=5s`}
                width="100%"
                height="300"
                frameBorder="0"
                title="CPU Usage"
              ></iframe>
            </div>

            {/* RAM Graph */}
            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-lg p-2">
              <iframe
                src={`${GRAFANA_BASE}/d-solo/${DASHBOARD_ID}/docker-monitoring-dashboard?orgId=1&from=now-15m&to=now&panelId=panel-3&refresh=5s`}
                width="100%"
                height="300"
                frameBorder="0"
                title="RAM Usage"
              ></iframe>
            </div>
          </div>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Backend running on port 5000 • Auto-refresh every 5 seconds
        </p>
      </div>

      {/* Logs Modal */}
      {logsModal.show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-3xl w-[90%] max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-semibold">Logs: {logsModal.name}</h2>
              <button
                onClick={() => setLogsModal({ show: false, name: '', logs: '' })}
                className="text-3xl leading-none hover:text-primary transition"
              >
                ×
              </button>
            </div>
            <pre className="p-6 overflow-auto font-mono text-sm bg-black/80 flex-1 text-green-400 whitespace-pre-wrap max-h-[70vh] rounded-b-3xl">
              {logsModal.logs || 'No logs available'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;