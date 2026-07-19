import React, { useState, useRef, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { askFanAssistant } from '../services/gemini';
import type { ChatMessage } from '../services/gemini';
import { StadiumMap } from '../components/StadiumMap';
import type { POI, TransitOption } from '../data/mockData';
import { 
  MessageSquare, 
  Map, 
  Navigation, 
  Leaf, 
  Send, 
  Mic, 
  MicOff,
  Compass, 
  Accessibility, 
  AlertTriangle,
  Award,
  Globe
} from 'lucide-react';

export const FanView: React.FC = () => {
  const { 
    zones, 
    pois, 
    transit, 
    greenScore, 
    addGreenScorePoints, 
    geminiApiKey 
  } = useSimulation();

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '👋 Hi Priya! Welcome to MetLife Stadium. I am FanPulse, your AI Stadium Guide. Ask me anything about finding your gate, restaurants, restrooms, accessibility services, or transportation back home!' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [highlightedPoi, setHighlightedPoi] = useState<string | undefined>(undefined);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Setup Web Speech API for voice input support
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setInputValue(text);
        setIsListening(false);
        handleSend(text);
      };

      rec.onerror = (e: Event) => {
        console.error('Speech error:', e);
        setIsListening(false);
        showToast('Voice typing error. Please type manually.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      showToast('Voice recognition not supported on this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    setInputValue('');
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Call Gemini
    const chatHistory = messages;
    const responseText = await askFanAssistant(
      geminiApiKey,
      text,
      { zones, pois, transit, greenScore },
      chatHistory
    );

    // AI dynamic feedback triggers based on response
    if (text.toLowerCase().includes('green bites') || text.toLowerCase().includes('vegan')) {
      addGreenScorePoints(10);
      showToast('🌱 Sustainability point earned: Green food selection!');
    }

    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);

    // Highlight map items if mentioned
    const lowerResp = responseText.toLowerCase();
    const foundPoi = pois.find(poi => lowerResp.includes(poi.name.toLowerCase()) || lowerResp.includes(poi.location.toLowerCase()));
    if (foundPoi) {
      setHighlightedPoi(foundPoi.id);
    }
  };

  const handlePoiClickOnMap = (poi: POI) => {
    handleSend(`Tell me about ${poi.name} at ${poi.location}`);
    setHighlightedPoi(poi.id);
  };

  const handleShortcutClick = (text: string) => {
    handleSend(text);
  };

  const selectTransit = (opt: TransitOption): void => {
    if (opt.type === 'train' || opt.type === 'bus') {
      const points = opt.type === 'train' ? 50 : 30;
      addGreenScorePoints(points);
      showToast(`🌱 Eco-friendly Commute Saved! +${points} Green Points.`);
    } else {
      showToast(`Selected ${opt.name} commute mode.`);
    }
  };

  return (
    <div className="w-full h-full bg-slate-50 text-slate-900 flex flex-col font-sans p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Fan Assistant</span>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-800">FanPulse Visitor Hub</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">FIFA World Cup 2026 Interactive Portal — MetLife Stadium</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-slate-400" />
            <select 
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                showToast(`Language set to ${e.target.value}`);
              }}
              className="text-xs bg-white border border-slate-250 text-slate-700 rounded px-2 py-1 focus:outline-none focus:border-fifa-gold"
            >
              <option>English</option>
              <option>Español</option>
              <option>Portugués</option>
              <option>Français</option>
            </select>
          </div>

          {/* Green Score Pill */}
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-sm">
            <Leaf size={13} className="fill-emerald-600/10 text-emerald-600" />
            <span>Green Score: {greenScore} pts</span>
          </div>
        </div>
      </div>

      {/* Critical Queue Alert */}
      {zones.some(z => z.crowdLevel === 'critical') && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 text-xs text-red-700 mb-6 shadow-sm">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <span>Warning: **Gate D (Pepsi)** is currently facing critical crowd bottlenecks. Avoid this entry zone. Use Gate A/B instead.</span>
        </div>
      )}

      {/* 3-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-0 min-h-[550px]">
        {/* Column 1: AI Chat Assistant */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between h-full min-h-[450px]">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <MessageSquare size={16} className="text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">AI Wayfinding & Info</h2>
          </div>

          {/* Chat message box */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-4">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm' 
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
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="mb-3 shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Common Queries</span>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleShortcutClick("Where's the nearest ADA restroom?")}
                className="text-[10px] bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-350 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-sm"
              >
                <Accessibility size={11} className="text-emerald-650" /> Nearest ADA Restroom
              </button>
              <button 
                onClick={() => handleShortcutClick("Which food stands have veggie or halal options?")}
                className="text-[10px] bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-350 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-sm"
              >
                <Compass size={11} className="text-emerald-650" /> Veggie/Halal Foods
              </button>
              <button 
                onClick={() => handleShortcutClick("How do I get back to Manhattan post-match?")}
                className="text-[10px] bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-350 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-sm"
              >
                <Navigation size={11} className="text-emerald-650" /> Transit back to NYC
              </button>
            </div>
          </div>

          {/* Chat Inputs */}
          <div className="flex items-center gap-2 bg-white border border-slate-250 rounded-xl p-2 shrink-0 shadow-sm focus-within:border-emerald-500">
            <button 
              onClick={toggleVoice}
              className={`p-2 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-500/10 text-red-500 animate-pulse' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
              }`}
              title="Voice Input"
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Listening..." : "Ask FanPulse AI stadium guide..."}
              className="flex-1 bg-transparent text-xs text-slate-800 focus:outline-none placeholder-slate-400 pl-1"
              disabled={isListening}
            />
            <button 
              onClick={() => handleSend()}
              className="bg-emerald-600 hover:bg-emerald-550 text-white p-2 rounded-lg transition-colors shadow-sm"
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Column 2: Stadium Map */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between h-full">
          <div className="flex justify-between items-center mb-3 shrink-0">
            <h2 className="text-xs font-bold text-slate-750 uppercase tracking-wider flex items-center gap-1.5">
              <Map size={16} className="text-emerald-600" /> MetLife Stadium Heatmap
            </h2>
            <span className="text-[10px] text-slate-450">Click elements to query AI</span>
          </div>
          <div className="flex-1 h-0 min-h-[350px]">
            <StadiumMap 
              onPoiClick={handlePoiClickOnMap} 
              highlightedPoiId={highlightedPoi}
              showHeatmap={true}
            />
          </div>
        </div>

        {/* Column 3: Transit + Eco Hub */}
        <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-1">
          {/* Transit planner */}
          <div className="glass rounded-2xl p-4 flex-1 flex flex-col justify-between min-h-[250px]">
            <div>
              <h2 className="text-xs font-bold text-slate-750 uppercase tracking-wider flex items-center gap-1.5 mb-3 shrink-0">
                <Navigation size={16} className="text-emerald-600" /> Transit Planner
              </h2>
              <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                {transit.map(opt => (
                  <div 
                    key={opt.id}
                    className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 hover:border-slate-350 transition-colors shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          {opt.name}
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            opt.status === 'normal' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            opt.status === 'crowded' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {opt.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{opt.statusDetails}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-800 block">{opt.etaMinutes} min</span>
                        <span className="text-[9px] text-slate-400 block">ETA</span>
                      </div>
                    </div>

                    <div className="h-[1px] bg-slate-100"></div>

                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-650 font-semibold flex items-center gap-0.5">
                          <Leaf size={10} /> {opt.carbonKg}kg CO2
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">Fare: {opt.costEstimate}</span>
                      </div>
                      <button 
                        onClick={() => selectTransit(opt)}
                        className={`text-[9px] font-bold px-2 py-1 rounded transition-colors shadow-sm ${
                          opt.type === 'train' || opt.type === 'bus'
                            ? 'bg-emerald-600 hover:bg-emerald-550 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250'
                        }`}
                      >
                        Select Mode
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sustainability & Green Hub */}
          <div className="glass-premium rounded-2xl p-4 flex flex-col justify-between shrink-0">
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Leaf size={15} className="text-emerald-600" /> Eco Score & Tips
              </h2>
              
              <div className="flex items-center justify-between bg-white/70 border border-slate-200 rounded-xl p-3 mb-3.5 shadow-sm">
                <div>
                  <span className="text-[9px] text-slate-450 font-bold block uppercase">Green Badge</span>
                  <span className="text-sm font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                    Green Champion <Award size={15} className="text-fifa-gold fill-fifa-gold/10" />
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-50 text-emerald-700 font-black text-xs">
                  {greenScore} pts
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[10px] leading-relaxed text-slate-700 shadow-sm">
                <span className="font-bold text-emerald-700 flex items-center gap-0.5 mb-1"><Leaf size={10} /> Composting Nudge:</span>
                "MetLife Stadium is zero-waste-to-landfill for FIFA 2026. Place sandwich wraps in **composting bins (Green)** and cups in **recycling bins (Blue)** to earn **+15 Green Points**!"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-premium border-emerald-500/20 text-emerald-700 text-xs font-bold p-3.5 rounded-lg shadow-xl animate-slide-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
