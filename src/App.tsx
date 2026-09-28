import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  FileText, 
  Ban, 
  Bell, 
  Search,
  CheckCircle2,
  AlertTriangle
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
  Legend
} from 'recharts';

// --- MOCK DATA ---
// Replace these with actual API calls to your n8n / Python backend
const THREAT_ACTIVITY = [
  { time: '00:00', alerts: 12, critical: 2 },
  { time: '04:00', alerts: 19, critical: 1 },
  { time: '08:00', alerts: 45, critical: 5 },
  { time: '12:00', alerts: 82, critical: 12 },
  { time: '16:00', alerts: 60, critical: 8 },
  { time: '20:00', alerts: 35, critical: 3 },
  { time: '24:00', alerts: 15, critical: 1 },
];

const ATTACK_TYPES = [
  { name: 'Brute Force', count: 145 },
  { name: 'SQL Injection', count: 82 },
  { name: 'DDoS', count: 210 },
  { name: 'XSS', count: 45 },
  { name: 'Port Scan', count: 320 },
];

const RECENT_INCIDENTS = [
  {
    id: 'INC-2023-001',
    timestamp: '2023-10-24 14:32:01',
    ip: '192.168.1.105',
    type: 'Brute Force',
    severity: 'High',
    mitre: 'T1110',
    status: 'Blocked',
    aiSummary: 'Multiple failed SSH login attempts detected for root user. Blocked by CrowdSec.'
  },
  {
    id: 'INC-2023-002',
    timestamp: '2023-10-24 14:15:22',
    ip: '203.0.113.42',
    type: 'SQL Injection',
    severity: 'Critical',
    mitre: 'T1190',
    status: 'Reported',
    aiSummary: 'Attempted SQLi on login endpoint containing UNION SELECT statements.'
  },
  {
    id: 'INC-2023-003',
    timestamp: '2023-10-24 13:45:10',
    ip: '45.22.10.9',
    type: 'Port Scan',
    severity: 'Low',
    mitre: 'T1046',
    status: 'Monitoring',
    aiSummary: 'Sequential TCP SYN scan detected across multiple ports.'
  },
  {
    id: 'INC-2023-004',
    timestamp: '2023-10-24 12:10:05',
    ip: '198.51.100.77',
    type: 'DDoS',
    severity: 'Critical',
    mitre: 'T1498',
    status: 'Mitigated',
    aiSummary: 'Volumetric HTTP GET flood exceeding rate limits. Handled by WAF.'
  }
];

export default function App() {
  const [search, setSearch] = useState('');
  const [liveIncidents, setLiveIncidents] = useState(RECENT_INCIDENTS);

  // 🔌 PLUG AND PLAY: Fetch live data from local Node server
  React.useEffect(() => {
    const API_URL = 'http://localhost:3001/api/incidents';
    
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        // Assuming n8n returns an array of incidents
        if (data && Array.isArray(data) && data.length > 0) {
          setLiveIncidents(data);
        }
      })
      .catch(err => {
        console.log("n8n webhook not reachable yet, using AI mock data for preview.", err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-300 font-sans">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-900 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <div>
            <h1 className="text-xl font-bold text-slate-100 leading-tight">ThreatSight</h1>
            <p className="text-xs text-slate-400">CrowdSec AI Analysis Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search IPs or Incidents..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-red-500 text-slate-200 transition-colors w-64"
            />
          </div>
          <button className="relative p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Alerts (24h)" value="1,248" icon={<Activity className="text-blue-400" />} trend="+12%" />
          <StatCard title="Critical Threats" value="23" icon={<ShieldAlert className="text-red-500" />} trend="-5%" />
          <StatCard title="AI Reports Generated" value="156" icon={<FileText className="text-purple-400" />} trend="+24%" />
          <StatCard title="Active IPs Banned" value="482" icon={<Ban className="text-orange-400" />} trend="+2%" />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Threat Activity (24h)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={THREAT_ACTIVITY} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e2e8f0' }} 
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  <Line type="monotone" name="Total Alerts" dataKey="alerts" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Critical" dataKey="critical" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Attack Vectors</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ATTACK_TYPES} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip cursor={{fill: '#27272a'}} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Incidents Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">AI-Analyzed Incidents</h2>
            <button className="text-sm bg-zinc-800 hover:bg-zinc-700 text-slate-200 px-3 py-1.5 rounded-md transition-colors border border-zinc-700">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
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
                {liveIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-zinc-400">{inc.timestamp}</td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-zinc-300">{inc.ip}</td>
                    <td className="px-5 py-4 whitespace-nowrap">{inc.type}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        inc.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                        inc.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-zinc-300 mb-1">{inc.aiSummary}</p>
                      <span className="inline-block bg-zinc-800 text-zinc-400 text-xs px-1.5 py-0.5 rounded border border-zinc-700">
                        {inc.mitre}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {inc.status === 'Blocked' || inc.status === 'Mitigated' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className="text-zinc-300">{inc.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors" />
      <div>
        <p className="text-zinc-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
        <p className={`text-xs mt-2 ${isPositive ? 'text-emerald-400' : 'text-emerald-400'}`}>
          {/* Note: In security, + alerts is usually bad, but we style neutrally or based on context */}
          <span className="font-semibold">{trend}</span> vs last week
        </p>
      </div>
      <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
        {icon}
      </div>
    </div>
  );
}
