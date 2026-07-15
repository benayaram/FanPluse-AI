import React, { useState } from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { FanView } from './views/FanView';
import { OrganizerView } from './views/OrganizerView';
import { VolunteerView } from './views/VolunteerView';
import { StaffView } from './views/StaffView';
import { 
  Compass, 
  ClipboardList, 
  ShieldAlert, 
  Monitor, 
  ArrowLeft,
  Sparkles,
  Globe
} from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<'portal' | 'fan' | 'organizer' | 'volunteer' | 'staff'>('portal');
  const { incidents } = useSimulation();

  const activeIncidentsCount = incidents.filter(inc => inc.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none">
      {/* Header (Hidden on Portal Home for maximum branding impact, shown on View Screens) */}
      {activeView !== 'portal' && (
        <header className="bg-white border-b border-slate-250 px-6 py-3 flex justify-between items-center shrink-0 z-40">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveView('portal')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-950 transition-all"
            >
              <ArrowLeft size={13} />
              <span>Back to Portal Hub</span>
            </button>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-fifa-blue to-emerald-600 flex items-center justify-center font-black text-white text-[10px]">
                FP
              </div>
              <span className="font-extrabold text-sm tracking-tight text-slate-800 hidden sm:inline">FanPulse AI</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeView === 'fan' && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Fan Portal
              </span>
            )}
            {activeView === 'volunteer' && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Volunteer Co-Pilot
              </span>
            )}
            {activeView === 'staff' && (
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Staff Console
              </span>
            )}
            {activeView === 'organizer' && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Command Center
              </span>
            )}
          </div>
        </header>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeView === 'portal' ? (
          /* Stunning Landing Portal Home Screen */
          <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 max-w-6xl mx-auto w-full overflow-y-auto">
            {/* Branding Hero */}
            <div className="text-center max-w-2xl mb-12 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                <Sparkles size={12} className="animate-pulse" /> Google AI Hackathon submission
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-slate-900 via-fifa-blue to-slate-950 bg-clip-text text-transparent">
                FanPulse AI
              </h1>
              <p className="text-sm md:text-base text-slate-600 mt-3 font-medium leading-relaxed">
                A connected GenAI operations and experience layer for FIFA World Cup 2026. Select a simulated role below to enter the live stadium experience.
              </p>
            </div>

            {/* Portal Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl animate-slide-up">
              {/* Card 1: Fan Experience */}
              <div 
                onClick={() => setActiveView('fan')}
                className="glass rounded-3xl p-6 cursor-pointer border border-slate-200/80 hover:border-emerald-500/40 hover:shadow-[0_12px_25px_rgba(16,185,129,0.08)] hover:-translate-y-1 transition-all group flex flex-col justify-between h-72"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform mb-5">
                    <Compass size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Fan Portal</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    AI wayfinding assistant, transit planner, Green Score tracker, and multilingual help.
                  </p>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-4">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Website UI</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Priya (Fan)</span>
                </div>
              </div>

              {/* Card 2: Volunteer Co-Pilot */}
              <div 
                onClick={() => setActiveView('volunteer')}
                className="glass rounded-3xl p-6 cursor-pointer border border-slate-200/80 hover:border-amber-500/40 hover:shadow-[0_12px_25px_rgba(245,158,11,0.08)] hover:-translate-y-1 transition-all group flex flex-col justify-between h-72"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform mb-5">
                    <ClipboardList size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-amber-650 transition-colors">Volunteer Hub</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Volunteer tasks list, AI shift guide, and instant speech translation utilities.
                  </p>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-4">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Website UI</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Aisha (Volunteer)</span>
                </div>
              </div>

              {/* Card 3: Staff & Security Console */}
              <div 
                onClick={() => setActiveView('staff')}
                className="glass rounded-3xl p-6 cursor-pointer border border-slate-200/80 hover:border-rose-500/40 hover:shadow-[0_12px_25px_rgba(239,68,68,0.08)] hover:-translate-y-1 transition-all group flex flex-col justify-between h-72"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform mb-5">
                    <ShieldAlert size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-rose-600 transition-colors">Staff Console</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Voice-to-text incident logs, AI categorization, and ADA assistance queue dispatches.
                  </p>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-4">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Website UI</span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Diego (Staff)</span>
                </div>
              </div>

              {/* Card 4: Command Center */}
              <div 
                onClick={() => setActiveView('organizer')}
                className="glass rounded-3xl p-6 cursor-pointer border border-slate-200/80 hover:border-blue-500/40 hover:shadow-[0_12px_25px_rgba(30,64,175,0.08)] hover:-translate-y-1 transition-all group flex flex-col justify-between h-72"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform mb-5">
                    <Monitor size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Command Center</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Live SVG venue heatmap, operation analytics charts, broadcast controls, and AI search logs.
                  </p>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-4">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Website UI</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                    Marcus (Organizer) {activeIncidentsCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Demo Tips */}
            <div className="mt-12 text-[10px] text-slate-550 flex items-center gap-1.5">
              <Globe size={11} /> Real Gemini reasoning active. Try reporting an incident in Staff Console and watching it sync to the Command Center!
            </div>
          </div>
        ) : (
          /* Render Active Persona View as Full-screen Website UI */
          <div className="flex-1 flex min-h-0 overflow-y-auto bg-slate-100/50">
            {activeView === 'fan' && <FanView />}
            {activeView === 'volunteer' && <VolunteerView />}
            {activeView === 'staff' && <StaffView />}
            {activeView === 'organizer' && <OrganizerView />}
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SimulationProvider>
      <AppContent />
    </SimulationProvider>
  );
};

export default App;
