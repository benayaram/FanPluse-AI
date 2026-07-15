import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { autoCategorizeIncident } from '../services/gemini';
import { 
  FileText, 
  Accessibility, 
  AlertTriangle,
  Mic, 
  Send,
  UserCheck, 
  AlertCircle,
  Clock
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const { 
    incidents, 
    updateIncidentStatus, 
    reportIncident, 
    updateZoneCrowd, 
    geminiApiKey 
  } = useSimulation();
  
  // Incident log inputs
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please type a description.');
      return;
    }

    setIsSubmitting(true);
    showToast('AI Analyzing and Categorizing Incident...');

    // Auto-categorize using Gemini
    const result = await autoCategorizeIncident(geminiApiKey, description);

    reportIncident({
      title: result.title,
      category: result.category as any,
      severity: result.severity as any,
      location: 'Sector West (Gate D)',
      description: description,
      aiSuggestedAction: result.aiSuggestedAction
    });

    setDescription('');
    setIsSubmitting(false);
    showToast('🚨 Incident logged & AI dispatched recommendations!');
  };

  // Simulate dictation
  const simulateVoiceDictation = () => {
    setIsListening(true);
    showToast('Listening... Speak incident details.');
    
    const mockSpeeches = [
      "Elderly gentleman fell down near section one twenty four needs aid",
      "Spill of soda near section one ten creating slipping hazard",
      "Crowd is pushing near entrance gate D because scanner is offline",
      "Fan with wheelchair looking for step free elevator access at gate B"
    ];
    
    setTimeout(() => {
      const speechText = mockSpeeches[Math.floor(Math.random() * mockSpeeches.length)];
      setDescription(speechText);
      setIsListening(false);
      showToast('Speech processed successfully!');
    }, 2500);
  };

  const handleAcknowledgeCrowd = (gateId: string, name: string) => {
    // Deploying staff reduces density at the gate!
    updateZoneCrowd(gateId, -20);
    showToast(`👮 Staff deployed to ${name}. Crowd density reduced.`);
  };

  const activeADATasks = incidents.filter(
    inc => inc.category === 'accessibility' && inc.status !== 'resolved'
  );

  return (
    <div className="w-full h-full bg-slate-50 text-slate-900 flex flex-col font-sans p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Venue Staff Mode</span>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-800">Staff & Security Console</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">FIFA World Cup 2026 Security Console — MetLife Stadium</p>
        </div>

        <div className="bg-white border border-slate-200 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
          Active Duty: <span className="font-bold">Gate D Security & Ground Response Control</span>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 h-0 min-h-[550px]">
        {/* Column 1: Voice/Text Incident Logger */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between h-full min-h-[450px]">
          <div>
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <FileText size={16} className="text-rose-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Voice/Text Incident Dispatcher</h2>
            </div>

            <form onSubmit={handleIncidentSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-450 font-bold uppercase block mb-1.5">
                  Describe Incident (Dictate or Type)
                </label>
                <div className="relative">
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Type details (e.g. 'Elderly fan fainted near Section 112, needs medical assistance')"
                    className="w-full h-44 bg-white border border-slate-250 text-slate-800 text-xs rounded-2xl p-4 focus:outline-none placeholder-slate-400 resize-none leading-relaxed shadow-sm focus:border-rose-500"
                    disabled={isSubmitting || isListening}
                  />
                  <button 
                    type="button"
                    onClick={simulateVoiceDictation}
                    className={`absolute right-3.5 bottom-3.5 p-3 rounded-full transition-all shadow-sm ${
                      isListening 
                        ? 'bg-rose-500 text-white animate-pulse' 
                        : 'bg-slate-100 text-slate-550 hover:text-rose-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                    title="Simulate Voice Input"
                    disabled={isSubmitting || isListening}
                  >
                    <Mic size={18} />
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || isListening}
                className="w-full bg-rose-600 hover:bg-rose-550 text-white font-bold text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(244,63,94,0.1)]"
              >
                <Send size={14} /> {isSubmitting ? 'AI Classifying...' : 'Submit to Command Center'}
              </button>
            </form>
          </div>

          <div className="border border-slate-200 bg-white/70 rounded-2xl p-4 mt-6 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-slate-400 mb-2">AI NLU Classification Samples</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-500">
              <p>• *"Water leak near stand section 114"* (Facilities)</p>
              <p>• *"Intoxicated fan shouting at Gate A"* (Security)</p>
              <p>• *"Fan needs a wheelchair at entrance"* (Accessibility)</p>
              <p>• *"Fan having severe chest pain at gate D"* (Medical)</p>
            </div>
          </div>
        </div>

        {/* Column 2: ADA queue & Crowd Alerts */}
        <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-1">
          {/* ADA Queue */}
          <div className="glass rounded-2xl p-4 flex-1 flex flex-col justify-between min-h-[250px]">
            <div>
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <Accessibility size={16} className="text-rose-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Accessibility Service Queue</h2>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[200px] pr-1">
                {activeADATasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">No active accessibility dispatches.</p>
                ) : (
                  activeADATasks.map(task => (
                    <div 
                      key={task.id}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-slate-800">{task.title}</div>
                          <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-1">
                            <Clock size={10} /> {task.timestamp} | {task.location}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          task.severity === 'high' ? 'bg-red-50 text-red-700 border border-red-150' : 'bg-amber-50 text-amber-700 border border-amber-150'
                        }`}>
                          {task.severity.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-600 leading-normal">{task.description}</p>

                      {task.aiSuggestedAction && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded p-2 text-[9px] text-indigo-700 leading-normal">
                          <span className="font-bold">AI Recommended Pathway:</span> {task.aiSuggestedAction}
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        {task.status === 'open' ? (
                          <button 
                            onClick={() => {
                              updateIncidentStatus(task.id, 'assigned', 'Diego (Staff)');
                              showToast('Assigned to Diego.');
                            }}
                            className="bg-indigo-650 hover:bg-indigo-550 text-white text-[9px] font-bold px-3 py-1.5 rounded shadow-sm"
                          >
                            Assign to Me
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              updateIncidentStatus(task.id, 'resolved');
                              showToast('Accessibility request resolved.');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-550 text-white text-[9px] font-bold px-3 py-1.5 rounded flex items-center gap-1 shadow-sm"
                          >
                            <UserCheck size={11} /> Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Crowd alerts */}
          <div className="glass rounded-2xl p-4 shrink-0">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <AlertTriangle size={16} className="text-rose-600" /> Active Crowd Congestion Alerts
            </h2>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-red-500 shrink-0" size={16} />
                  <div>
                    <div className="text-xs font-bold text-slate-800 font-sans">Gate D (Pepsi) Queue Congested</div>
                    <p className="text-[9px] text-slate-400 mt-1">Wait time: 35 mins | Scanner terminal offline</p>
                  </div>
                </div>
                <span className="bg-red-50 text-red-700 border border-red-150 px-1.5 py-0.5 rounded text-[8px] font-bold">CRITICAL</span>
              </div>

              <p className="text-[10px] text-slate-650 leading-relaxed">
                Turnstiles entry scanners are backed up. Send secondary staff to route the queue to nearby Gate A.
              </p>

              <div className="flex justify-end">
                <button 
                  onClick={() => handleAcknowledgeCrowd('gate-d', 'Gate D')}
                  className="bg-rose-600 hover:bg-rose-550 text-white text-[9px] font-bold px-3 py-1.5 rounded transition-all shadow-[0_4px_12px_rgba(244,63,94,0.15)]"
                >
                  Deploy Staff & Direct Crowd
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-premium border-rose-500/20 text-rose-700 text-xs font-bold p-3.5 rounded-lg shadow-xl animate-slide-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
