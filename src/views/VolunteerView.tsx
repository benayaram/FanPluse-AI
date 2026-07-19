import React, { useState, useRef, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { askVolunteerAssistant, quickTranslateText } from '../services/gemini';
import type { ChatMessage } from '../services/gemini';
import { 
  ClipboardList, 
  HelpCircle, 
  Languages, 
  AlertOctagon, 
  Send, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { VENUE_KNOWLEDGE_BASE } from '../data/mockData';

export const VolunteerView: React.FC = () => {
  const { 
    reportIncident, 
    geminiApiKey 
  } = useSimulation();

  const [faqMessages, setFaqMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello Aisha! I am your AI Volunteer Co-Pilot. Ask me any policy question, uniform rules, shift regulations, or safety procedures.' }
  ]);
  const [faqInput, setFaqInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Tasks local state
  const [volunteerTasks, setVolunteerTasks] = useState([
    { id: 'vtask-1', title: 'Collect Sensory Bags from Booth 124', description: 'Restock sensory kits for families arriving at West Gate D.', status: 'pending' },
    { id: 'vtask-2', title: 'Assist Fan at Sec 112', description: 'Guide Priya to her seat in Section 112 via the elevator.', status: 'pending' },
    { id: 'vtask-3', title: 'Monitor Gate D Entry Wait', description: 'Report scanner delays or issues to Organizer.', status: 'completed' }
  ]);

  // Translator state
  const [translateText, setTranslateText] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [translatedResult, setTranslatedResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Escalate state
  const [escalateTitle, setEscalateTitle] = useState('');
  const [escalateCategory, setEscalateCategory] = useState<'facilities' | 'security' | 'medical' | 'accessibility'>('facilities');
  const [escalateDesc, setEscalateDesc] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const faqEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    faqEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [faqMessages, isTyping]);

  const toggleTask = (id: string) => {
    setVolunteerTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
        if (nextStatus === 'completed') {
          showToast('Task marked completed!');
        }
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const handleFaqSend = async () => {
    const text = faqInput.trim();
    if (!text) return;

    setFaqInput('');
    setFaqMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);

    const response = await askVolunteerAssistant(geminiApiKey, text, VENUE_KNOWLEDGE_BASE, faqMessages);
    
    setIsTyping(false);
    setFaqMessages(prev => [...prev, { role: 'model', text: response }]);
  };

  const handleTranslate = async () => {
    if (!translateText.trim()) return;
    setIsTranslating(true);
    const translated = await quickTranslateText(geminiApiKey, translateText, targetLang);
    setTranslatedResult(translated);
    setIsTranslating(false);
  };

  const handleEscalateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalateTitle.trim() || !escalateDesc.trim()) {
      showToast('Please fill out all fields.');
      return;
    }

    reportIncident({
      title: escalateTitle,
      category: escalateCategory,
      severity: escalateCategory === 'medical' || escalateCategory === 'security' ? 'high' : 'medium',
      location: 'Sector West (Gate D)',
      description: `Reported by Volunteer Aisha: ${escalateDesc}`
    });

    setEscalateTitle('');
    setEscalateDesc('');
    showToast('🚨 Incident escalated to Command Center!');
  };

  return (
    <div className="w-full h-full bg-slate-50 text-slate-900 flex flex-col font-sans p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Volunteer Mode</span>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-800">Volunteer Co-Pilot Hub</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">FIFA World Cup 2026 Volunteer Portal — MetLife Stadium</p>
        </div>

        <div className="bg-white border border-slate-200 text-slate-755 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
          Sector Assignment: <span className="text-amber-700 font-bold">Sector West • Shift A (Gate D Duty)</span>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-0 min-h-[550px]">
        {/* Column 1: Task list */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between h-full min-h-[450px]">
          <div>
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <ClipboardList size={16} className="text-amber-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Shift Task Checklist</h2>
            </div>
            
            <div className="space-y-2.5 overflow-y-auto max-h-[350px] pr-1">
              {volunteerTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`border rounded-xl p-3.5 cursor-pointer transition-all ${
                    task.status === 'completed' 
                      ? 'bg-slate-100/50 border-slate-200 opacity-60' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {task.title}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{task.description}</p>
                    </div>
                    <div className="shrink-0 mt-0.5 ml-2">
                      <CheckCircle 
                        size={16} 
                        className={task.status === 'completed' ? 'text-emerald-600' : 'text-slate-400'} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mt-4 text-[10px] leading-relaxed text-amber-900 shadow-sm">
            <div className="font-bold text-amber-800 flex items-center gap-1 mb-1">
              <AlertTriangle size={11} className="text-amber-650" /> Volunteer Briefing Note:
            </div>
            Always keep credentials visible. For any ticket terminal scanners locking up, direct fans to secondary lines and notify staff.
          </div>
        </div>

        {/* Column 2: AI Coach Policies chatbot */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between h-full min-h-[450px]">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <HelpCircle size={16} className="text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">AI Coach (Handbook Chat)</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-4">
            {faqMessages.map((msg, index) => (
              <div 
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-amber-600 text-white rounded-tr-none shadow-sm' 
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm'
                }`}>
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200/80 text-slate-400 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={faqEndRef} />
          </div>

          {/* Quick FAQ Shortcuts */}
          <div className="mb-3 shrink-0 flex flex-wrap gap-1.5 text-[9px]">
            <button 
              onClick={() => setFaqInput("What is the uniform policy?")}
              className="bg-white border border-slate-200 text-slate-700 hover:text-amber-700 px-2 py-1 rounded-full shadow-sm"
            >
              👕 Uniforms
            </button>
            <button 
              onClick={() => setFaqInput("Where is volunteer check-in?")}
              className="bg-white border border-slate-200 text-slate-700 hover:text-amber-700 px-2 py-1 rounded-full shadow-sm"
            >
              ⏰ Check-in Location
            </button>
            <button 
              onClick={() => setFaqInput("What do I do in case of a medical emergency?")}
              className="bg-white border border-slate-200 text-slate-700 hover:text-amber-700 px-2 py-1 rounded-full shadow-sm"
            >
              🚨 Medical emerg
            </button>
          </div>

          {/* AI FAQ Input */}
          <div className="flex items-center gap-2 bg-white border border-slate-250 rounded-xl p-2 shrink-0 shadow-sm focus-within:border-amber-500">
            <input 
              type="text" 
              value={faqInput}
              onChange={(e) => setFaqInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFaqSend()}
              placeholder="Ask policies handbook..."
              className="flex-1 bg-transparent text-xs text-slate-805 focus:outline-none placeholder-slate-400 pl-1"
            />
            <button 
              onClick={handleFaqSend}
              className="bg-amber-600 hover:bg-amber-550 text-white p-2 rounded-lg transition-colors shadow-sm"
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Column 3: Translator + Escalate Tools */}
        <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-1">
          {/* Quick Translator */}
          <div className="glass rounded-2xl p-4 flex-1 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Languages size={16} className="text-amber-600" /> Visitor Translator
                </h2>
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="text-[10px] bg-white border border-slate-250 text-slate-700 rounded px-2 py-1 focus:outline-none font-semibold focus:border-amber-500 shadow-sm"
                >
                  <option>Spanish</option>
                  <option>Portugués</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Japanese</option>
                  <option>Arabic</option>
                </select>
              </div>

              <div className="space-y-3">
                <textarea 
                  value={translateText}
                  onChange={(e) => setTranslateText(e.target.value)}
                  placeholder="Type a message to translate (e.g. 'Elevators to Section 200 are on your left')"
                  className="w-full h-20 bg-white border border-slate-250 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none placeholder-slate-450 resize-none leading-relaxed shadow-sm focus:border-amber-550"
                />
                <button 
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="w-full bg-amber-600 hover:bg-amber-550 text-white font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isTranslating ? 'Translating...' : 'Translate'}
                </button>

                {translatedResult && (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 animate-slide-up max-h-[100px] overflow-y-auto shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-1">{targetLang} Translation</span>
                    <p className="text-xs text-slate-800 leading-relaxed font-semibold">{translatedResult}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Escalate incident */}
          <div className="glass rounded-2xl p-4 shrink-0">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <AlertOctagon size={16} className="text-amber-600" /> Escalate Incident
            </h2>
            <form onSubmit={handleEscalateSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={escalateCategory}
                  onChange={(e) => setEscalateCategory(e.target.value as typeof escalateCategory)}
                  className="bg-white border border-slate-250 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:border-red-500 shadow-sm"
                >
                  <option value="facilities">Facilities</option>
                  <option value="accessibility">Accessibility</option>
                  <option value="security">Security</option>
                  <option value="medical">Medical</option>
                </select>
                <input 
                  type="text" 
                  value={escalateTitle}
                  onChange={(e) => setEscalateTitle(e.target.value)}
                  placeholder="Short Title"
                  className="bg-white border border-slate-250 text-slate-800 text-xs rounded-lg p-2 focus:outline-none focus:border-red-500 shadow-sm"
                />
              </div>

              <textarea 
                value={escalateDesc}
                onChange={(e) => setEscalateDesc(e.target.value)}
                placeholder="Incident details, location, requirements..."
                className="w-full h-16 bg-white border border-slate-250 text-slate-800 text-xs rounded-lg p-2 focus:outline-none placeholder-slate-450 resize-none leading-relaxed shadow-sm focus:border-red-550"
              />

              <button 
                type="submit"
                className="w-full bg-red-650 hover:bg-red-550 text-white font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(220,38,38,0.1)]"
              >
                <AlertOctagon size={14} /> Send Alert to Command
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-premium border-amber-500/20 text-amber-700 text-xs font-bold p-3.5 rounded-lg shadow-xl animate-slide-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
