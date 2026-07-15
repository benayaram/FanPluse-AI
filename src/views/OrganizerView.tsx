import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { askOrganizerOps } from '../services/gemini';
import { StadiumMap } from '../components/StadiumMap';
import { 
  ShieldAlert, 
  Users, 
  UtensilsCrossed, 
  Sparkles, 
  Send,
  AlertTriangle,
  Leaf,
  CheckCircle,
  Globe,
  TrendingUp
} from 'lucide-react';
import type { StadiumZone } from '../data/mockData';

export const OrganizerView: React.FC = () => {
  const { 
    zones, 
    incidents, 
    updateIncidentStatus, 
    triggerMockAlert, 
    geminiApiKey 
  } = useSimulation();

  const [activeZone, setActiveZone] = useState<StadiumZone | null>(null);
  
  // Ask Stadium AI state
  const [queryText, setQueryText] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);

  // Broadcast state
  const [broadcastText, setBroadcastText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAskStadium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    setIsQuerying(true);
    setAiAnswer('');

    // Call Gemini
    const result = await askOrganizerOps(
      geminiApiKey,
      queryText,
      { incidents, zones }
    );

    setAiAnswer(result);
    setIsQuerying(false);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    showToast(`📢 Global alert broadcasted: "${broadcastText}"`);
    setBroadcastText('');
  };

  // Aggregated metrics
  const activeIncidentsCount = incidents.filter(inc => inc.status !== 'resolved').length;
  
  const avgConcessionWait = 9; // simulated average
  
  // Calculate average gate scanner rate
  const gateZones = zones.filter(z => z.id.startsWith('gate-'));
  const avgGateWait = Math.round(gateZones.reduce((acc, curr) => acc + curr.waitMinutes, 0) / gateZones.length);

  return (
    <div className="w-full h-full bg-slate-50 text-slate-900 flex flex-col font-sans p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-fifa-red text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Live Operations</span>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-800">FanPulse AI Command Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">FIFA World Cup 2026 Operations Layer — MetLife Stadium</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerMockAlert}
            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <AlertTriangle size={14} className="text-fifa-red animate-pulse" /> Simulate Crowd Surge
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Active Incidents</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{activeIncidentsCount}</div>
            <span className="text-[9px] text-slate-500 mt-0.5 block">{incidents.filter(i => i.severity === 'high' && i.status !== 'resolved').length} High Severity</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-555 tracking-wider">Gate Congestion</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{avgGateWait}m</div>
            <span className="text-[9px] text-slate-500 mt-0.5 block flex items-center gap-0.5"><TrendingUp size={10} /> Gate D Critical (35m)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-705">
            <Users size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Concessions Avg Line</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{avgConcessionWait}m</div>
            <span className="text-[9px] text-slate-505 mt-0.5 block">Green Bites: 2m wait</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <UtensilsCrossed size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Estimated Carbon Saved</span>
            <div className="text-2xl font-black text-emerald-650 mt-1">214.6 kg</div>
            <span className="text-[9px] text-slate-505 mt-0.5 block">82% transit adoption rate</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-605">
            <Leaf size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-0 min-h-[500px]">
        {/* Map column (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass rounded-2xl p-4 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-750 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={16} className="text-fifa-gold" /> Stadium Heatmap & Densities
              </h2>
              <div className="text-[10px] text-slate-450">Click zones for detailed statistics</div>
            </div>
            <div className="flex-1 min-h-[300px]">
              <StadiumMap 
                onZoneClick={(z) => setActiveZone(z)}
                interactive={true}
                showHeatmap={true}
              />
            </div>
          </div>

          {/* Active Zone statistics card */}
          <div className="glass rounded-2xl p-4 shrink-0">
            {activeZone ? (
              <div className="animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xs font-bold text-fifa-gold uppercase">Active Zone Focus</h3>
                  <div className="text-lg font-bold text-slate-800 mt-0.5">{activeZone.name}</div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Crowd Level</div>
                    <div className={`text-xs font-extrabold mt-0.5 ${
                      activeZone.crowdLevel === 'critical' ? 'text-red-650 font-black' :
                      activeZone.crowdLevel === 'high' ? 'text-orange-600' :
                      activeZone.crowdLevel === 'medium' ? 'text-amber-600' :
                      'text-emerald-600'
                    }`}>{activeZone.crowdLevel.toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Density Index</div>
                    <div className="text-xs font-extrabold text-slate-800 mt-0.5">{activeZone.densityPercentage}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Scanner Rate</div>
                    <div className="text-xs font-extrabold text-slate-800 mt-0.5">
                      {activeZone.scannerRate > 0 ? `${activeZone.scannerRate} sc/m` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-1">
                Select a zone or gate on the map above to view focused statistics.
              </p>
            )}
          </div>
        </div>

        {/* Dashboard Tools column (1/3 width) */}
        <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-1">
          {/* Gemini command Center co-pilot */}
          <div className="glass-premium rounded-2xl p-4 flex flex-col justify-between shrink-0">
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <Sparkles size={14} className="text-fifa-gold animate-pulse" /> Ask Stadium AI (Ops Co-pilot)
              </h2>

              <form onSubmit={handleAskStadium} className="flex gap-2">
                <input 
                  type="text" 
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="e.g. Summarize incident statuses..."
                  className="flex-1 bg-white border border-slate-250 text-xs text-slate-800 p-2.5 rounded-lg focus:outline-none placeholder-slate-450 focus:border-fifa-gold shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={isQuerying}
                  className="bg-fifa-gold hover:bg-yellow-600 text-slate-950 p-2.5 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                >
                  <Send size={14} />
                </button>
              </form>

              {isQuerying && (
                <div className="text-xs text-slate-500 mt-3 italic flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-fifa-gold"></span> Gemini is analyzing stadium data...
                </div>
              )}

              {aiAnswer && (
                <div className="mt-3.5 bg-white border border-slate-200 rounded-xl p-3 text-xs leading-relaxed max-h-48 overflow-y-auto animate-slide-up shadow-sm">
                  {aiAnswer.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 text-[9px] text-slate-450 border-t border-slate-100 pt-2 flex items-center gap-1">
              <Globe size={10} /> Queries live incidents and crowd densities using Gemini logic.
            </div>
          </div>

          {/* Active Incident List */}
          <div className="glass rounded-2xl p-4 flex-1 flex flex-col justify-between min-h-[300px]">
            <div>
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Live Incident logs
              </h2>

              <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
                {incidents.filter(inc => inc.status !== 'resolved').length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">No pending incidents.</p>
                ) : (
                  incidents.filter(inc => inc.status !== 'resolved').map(inc => (
                    <div 
                      key={inc.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-sm animate-fade-in"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-slate-805">{inc.title}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{inc.timestamp} | {inc.location}</div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          inc.severity === 'high' ? 'bg-red-50 text-red-700 border border-red-150' : 'bg-amber-50 text-amber-700 border border-amber-150'
                        }`}>
                          {inc.severity.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-600 leading-normal">{inc.description}</p>

                      {inc.aiSuggestedAction && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded p-2 text-[9px] text-indigo-700 leading-normal">
                          <span className="font-bold flex items-center gap-0.5 text-fifa-gold"><Sparkles size={9} /> AI Recommendation:</span>
                          {inc.aiSuggestedAction}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 mt-1">
                        <button 
                          onClick={() => updateIncidentStatus(inc.id, 'resolved')}
                          className="bg-emerald-600 hover:bg-emerald-550 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 transition-colors shadow-sm"
                        >
                          <CheckCircle size={9} /> Mark Resolved
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Broadcast Banner creation tool */}
          <div className="glass rounded-2xl p-4 shrink-0">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Broadcast Stadium Alert
            </h2>
            <form onSubmit={handleBroadcast} className="flex gap-2">
              <input 
                type="text" 
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Alert text (e.g. Heavy traffic Route 3)..."
                className="flex-1 bg-white border border-slate-250 text-xs text-slate-805 p-2 rounded-lg focus:outline-none placeholder-slate-450 focus:border-red-500 shadow-sm"
              />
              <button 
                type="submit"
                className="bg-fifa-red hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm"
              >
                Broadcast
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-premium border-fifa-gold/20 text-slate-800 text-xs font-bold p-3.5 rounded-lg shadow-xl animate-slide-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
