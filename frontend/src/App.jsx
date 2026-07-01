import { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Play, Square, RotateCw, FileText, Search, RefreshCw, Cpu, MemoryStick, Trash2, MoreVertical } from 'lucide-react';

const API_BASE = 'http://localhost:5000';
const GRAFANA_BASE = 'http://localhost:3001';
const DASHBOARD_ID = 'adsrvlz'; // Your dashboard ID

function App() {
  const [containers, setContainers] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [logsModal, setLogsModal] = useState({ show: false, name: '', logs: '' });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

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
      toast.error('Failed to connect to backend');
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

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdown(null);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const startContainer = async (id, name) => {
    try {
      await axios.post(`${API_BASE}/containers/${id}/start`);
      toast.success(`${name} started`);
      fetchContainers();
    } catch (err) {
      toast.error('Failed to start container');
    }
  };

  const stopContainer = async (id, name) => {
    try {
      await axios.post(`${API_BASE}/containers/${id}/stop`);
      toast.success(`${name} stopped`);
      fetchContainers();
    } catch (err) {
      toast.error('Failed to stop container');
    }
  };

  const restartContainer = async (id, name) => {
    try {
      await axios.post(`${API_BASE}/containers/${id}/restart`);
      toast.success(`${name} restarted`);
      fetchContainers();
    } catch (err) {
      toast.error('Failed to restart container');
    }
  };

  const viewLogs = async (id, name) => {
    try {
      const res = await axios.get(`${API_BASE}/containers/${id}/logs`);
      setLogsModal({ show: true, name, logs: res.data });
    } catch (err) {
      toast.error('Failed to fetch logs');
    }
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const deleteContainer = async (id, name) => {
    showConfirm(
      'Delete Container',
      `⚠️ Are you sure you want to delete container "${name}"? This action cannot be undone.`,
      async () => {
        try {
          await axios.delete(`${API_BASE}/containers/${id}`);
          toast.success(`${name} deleted`);
          fetchContainers();
        } catch (err) {
          toast.error('Failed to delete container');
        }
      }
    );
  };

  const filteredContainers = containers.filter(c =>
    c.Names[0].toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count running and stopped containers
  const runningCount = containers.filter(c => c.State === 'running').length;
  const stoppedCount = containers.length - runningCount;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e2a44',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#4ade80', secondary: '#1e2a44' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#1e2a44' },
          },
        }}
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 relative md:flex-row md:justify-center">
          <div>
            <h1 className="text-4xl font-bold text-primary">Docker Container Manager</h1>
            <p className="text-muted-foreground mt-1">Mini Portainer • Live Monitoring</p>
          </div>
          <button
            onClick={fetchContainers}
            className="mt-4 md:mt-0 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 flex items-center gap-2 bg-card hover:bg-muted px-5 py-2.5 rounded-xl border border-border transition"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-2xl px-6 py-4 text-center">
            <span className="text-muted-foreground text-sm">Total</span>
            <p className="text-3xl font-bold">{containers.length}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl px-6 py-4 text-center">
            <span className="text-muted-foreground text-sm">Running</span>
            <p className="text-3xl font-bold text-primary">{runningCount}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl px-6 py-4 text-center">
            <span className="text-muted-foreground text-sm">Stopped</span>
            <p className="text-3xl font-bold text-destructive">{stoppedCount}</p>
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
        <div className="bg-card rounded-3xl border border-border shadow-lg relative overflow-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground rounded-tl-3xl">Container Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Image</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">CPU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">RAM</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ports</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-24 rounded-tr-3xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContainers.map((container) => {
                const name = container.Names[0].replace('/', '');
                const isRunning = container.State === 'running';
                const containerStats = stats[container.Id];

                return (
                  <tr key={container.Id} className="hover:bg-muted/50 border-b border-border last:border-none transition">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground break-all max-w-[220px]">{container.Image}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isRunning ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                        }`}>
                        {container.Status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {isRunning && containerStats ? (
                        <div className="flex items-center gap-1.5">
                          <Cpu size={14} className="text-primary" />
                          <span className="font-mono text-xs">{containerStats.cpuPercent}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {isRunning && containerStats ? (
                        <div className="flex items-center gap-1.5">
                          <MemoryStick size={14} className="text-primary" />
                          <span className="font-mono text-xs">
                            {containerStats.memUsageMB} MB ({containerStats.memPercent}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono text-xs break-all max-w-[150px]">
                      {container.Ports?.length > 0
                        ? container.Ports.map(p => `${p.PublicPort}:${p.PrivatePort}`).join(', ')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === container.Id ? null : container.Id);
                          }}
                          className="p-1.5 hover:bg-muted rounded-lg transition text-muted-foreground hover:text-foreground border border-transparent hover:border-border cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeDropdown === container.Id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-xl py-1.5 z-50 text-left">
                            {!isRunning && (
                              <button
                                onClick={() => {
                                  startContainer(container.Id, name);
                                  setActiveDropdown(null);
                                }}
                                className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-muted flex items-center gap-2 text-primary font-medium transition cursor-pointer"
                              >
                                <Play size={14} /> Start
                              </button>
                            )}

                            {isRunning && (
                              <>
                                <button
                                  onClick={() => {
                                    stopContainer(container.Id, name);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-muted flex items-center gap-2 text-destructive font-medium transition cursor-pointer"
                                >
                                  <Square size={14} /> Stop
                                </button>

                                <button
                                  onClick={() => {
                                    restartContainer(container.Id, name);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-muted flex items-center gap-2 text-amber-500 font-medium transition cursor-pointer"
                                >
                                  <RotateCw size={14} /> Restart
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => {
                                viewLogs(container.Id, name);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-muted flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition cursor-pointer"
                            >
                              <FileText size={14} /> Logs
                            </button>

                            <div className="h-[1px] bg-border my-1"></div>

                            <button
                              onClick={() => {
                                deleteContainer(container.Id, name);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-destructive/10 text-destructive flex items-center gap-2 font-medium transition cursor-pointer"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredContainers.length === 0 && (
            <p className="text-center py-12 text-muted-foreground rounded-b-3xl">No containers found.</p>
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

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all">
            <div className="p-6">
              <h3 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                {confirmModal.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-3">
                {confirmModal.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 text-sm font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;