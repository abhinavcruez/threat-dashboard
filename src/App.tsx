import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  Activity,
  FileText,
  Ban,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

type Incident = {
  id: string;
  timestamp: string;
  ip: string;
  type: string;
  severity: string;
  mitre: string;
  status: string;
  aiSummary: string;
};

type ThreatPoint = {
  time: string;
  alerts: number;
  critical: number;
};

const API_URL = 'http://localhost:3001/api/incidents';

function normalizeIncident(raw: Record<string, unknown>, index: number): Incident {
  const timestamp =
    (typeof raw.generated_at === 'string' && raw.generated_at) ||
    (typeof raw.timestamp === 'string' && raw.timestamp) ||
    new Date().toISOString();

  return {
    id: String(raw.id ?? `INC-${Date.now()}-${index}`),
    timestamp,
    ip: String(raw.source_ip ?? raw.ip ?? 'Unknown'),
    type: String(raw.attack_type ?? raw.type ?? 'Malicious Activity'),
    severity: String(raw.severity ?? 'High'),
    mitre: String(raw.mitre ?? 'Unknown'),
    status: String(raw.status ?? 'Monitoring'),
    aiSummary: String(raw.report ?? raw.aiSummary ?? 'No summary available.'),
  };
}

function buildThreatActivity(incidents: Incident[]): ThreatPoint[] {
  if (!incidents.length) {
    return [];
  }

  const buckets = new Map<string, { alerts: number; critical: number }>();

  incidents.forEach((incident) => {
    const date = new Date(incident.timestamp);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const timeKey = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
    const current = buckets.get(timeKey) ?? { alerts: 0, critical: 0 };
    current.alerts += 1;
    if (incident.severity.toLowerCase() === 'critical') {
      current.critical += 1;
    }
    buckets.set(timeKey, current);
  });

  return Array.from(buckets.entries())
    .slice(-7)
    .map(([time, values]) => ({ time, alerts: values.alerts, critical: values.critical }));
}

function buildAttackVectors(incidents: Incident[]) {
  const counts = incidents.reduce<Record<string, number>>((acc, incident) => {
    const key = incident.type || 'Unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export default function App() {
  const [search, setSearch] = useState('');
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchIncidents = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: unknown = await response.json();
        const normalized = Array.isArray(data)
          ? data.map((entry, index) => normalizeIncident((entry ?? {}) as Record<string, unknown>, index))
          : [];

        if (isMounted) {
          setLiveIncidents(normalized);
        }
      } catch (error) {
        console.error('Unable to fetch live incidents:', error);
        if (isMounted) {
          setLiveIncidents([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchIncidents();
    const interval = window.setInterval(fetchIncidents, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return liveIncidents;
    }

    return liveIncidents.filter((incident) =>
      [incident.ip, incident.type, incident.severity, incident.status, incident.aiSummary]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [liveIncidents, search]);

  const threatActivity = useMemo(() => buildThreatActivity(liveIncidents), [liveIncidents]);
  const attackVectors = useMemo(() => buildAttackVectors(liveIncidents), [liveIncidents]);

  const totalAlerts = liveIncidents.length;
  const criticalThreats = liveIncidents.filter((incident) => incident.severity.toLowerCase() === 'critical').length;
  const activeBlockedIps = new Set(
    liveIncidents
      .filter((incident) => ['blocked', 'mitigated'].includes(incident.status.toLowerCase()))
      .map((incident) => incident.ip),
  ).size;

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-300 font-sans">
      <nav className="border-b border-zinc-800 bg-zinc-900 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <div>
            <h1 className="text-xl font-bold text-slate-100 leading-tight">ThreatSight</h1>
            <p className="text-xs text-slate-400">Live CrowdSec AI Analysis Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search IPs or incidents..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-red-500 text-slate-200 transition-colors w-64"
            />
          </div>
          <button className="relative p-2 hover:bg-zinc-800 rounded-full transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Alerts (24h)" value={totalAlerts.toLocaleString()} icon={<Activity className="text-blue-400" />} trend="Live" />
          <StatCard title="Critical Threats" value={criticalThreats.toLocaleString()} icon={<ShieldAlert className="text-red-500" />} trend="Live" />
          <StatCard title="AI Reports Generated" value={totalAlerts.toLocaleString()} icon={<FileText className="text-purple-400" />} trend="Live" />
          <StatCard title="Active IPs Banned" value={activeBlockedIps.toLocaleString()} icon={<Ban className="text-orange-400" />} trend="Live" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Threat Activity</h2>
            <div className="h-72 w-full">
              {loading && !liveIncidents.length ? (
                <div className="flex h-full items-center justify-center text-slate-400">Loading live data...</div>
              ) : threatActivity.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={threatActivity} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e2e8f0' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" name="Total Alerts" dataKey="alerts" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="Critical" dataKey="critical" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">No live threat activity available.</div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Attack Vectors</h2>
            <div className="h-72 w-full">
              {attackVectors.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attackVectors} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">No live attack vectors available.</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">AI-Analyzed Incidents</h2>
            <button className="text-sm bg-zinc-800 hover:bg-zinc-700 text-slate-200 px-3 py-1.5 rounded-md transition-colors border border-zinc-700">
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            {filteredIncidents.length ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 font-medium">Timestamp</th>
                    <th className="px-5 py-3 font-medium">Source IP</th>
                    <th className="px-5 py-3 font-medium">Attack Type</th>
                    <th className="px-5 py-3 font-medium">Severity</th>
                    <th className="px-5 py-3 font-medium">AI Summary / MITRE</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-sm">
                  {filteredIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-zinc-400">{incident.timestamp}</td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-zinc-300">{incident.ip}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{incident.type}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            incident.severity.toLowerCase() === 'critical'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : incident.severity.toLowerCase() === 'high'
                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-zinc-300 mb-1">{incident.aiSummary}</p>
                        <span className="inline-block bg-zinc-800 text-zinc-400 text-xs px-1.5 py-0.5 rounded border border-zinc-700">
                          {incident.mitre}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {['blocked', 'mitigated'].includes(incident.status.toLowerCase()) ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="text-zinc-300">{incident.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-10 text-center text-slate-400">
                {loading ? 'Loading live incident feed...' : 'No live incidents available.'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend: string }) {
  const isPositive = trend.startsWith('+') || trend === 'Live';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors" />
      <div>
        <p className="text-zinc-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
        <p className={`text-xs mt-2 ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
          <span className="font-semibold">{trend}</span>
        </p>
      </div>
      <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">{icon}</div>
    </div>
  );
}
