import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  POI, 
  TransitOption, 
  Incident, 
  StadiumZone 
} from '../data/mockData';
import { 
  STADIUM_ZONES, 
  STADIUM_POIS, 
  INITIAL_TRANSIT_OPTIONS, 
  INITIAL_INCIDENTS 
} from '../data/mockData';

interface SimulationContextType {
  zones: StadiumZone[];
  pois: POI[];
  transit: TransitOption[];
  incidents: Incident[];
  greenScore: number;
  userRole: 'fan' | 'organizer' | 'volunteer' | 'staff';
  viewMode: 'dashboard' | 'split';
  geminiApiKey: string;
  activePersonaTab: 'fan' | 'organizer' | 'volunteer' | 'staff';
  setGeminiApiKey: (key: string) => void;
  setUserRole: (role: 'fan' | 'organizer' | 'volunteer' | 'staff') => void;
  setViewMode: (mode: 'dashboard' | 'split') => void;
  setActivePersonaTab: (tab: 'fan' | 'organizer' | 'volunteer' | 'staff') => void;
  reportIncident: (incident: Omit<Incident, 'id' | 'timestamp' | 'status'>) => void;
  updateIncidentStatus: (id: string, status: Incident['status'], assignedStaff?: string) => void;
  addGreenScorePoints: (points: number) => void;
  updateZoneCrowd: (zoneId: string, deltaDensity: number) => void;
  triggerMockAlert: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [zones, setZones] = useState<StadiumZone[]>(STADIUM_ZONES);
  const [pois, setPois] = useState<POI[]>(STADIUM_POIS);
  const [transit, setTransit] = useState<TransitOption[]>(INITIAL_TRANSIT_OPTIONS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [greenScore, setGreenScore] = useState<number>(() => {
    const saved = localStorage.getItem('fanpulse_green_score');
    return saved ? parseInt(saved, 10) : 75; // Default score
  });
  const [userRole, setUserRoleState] = useState<'fan' | 'organizer' | 'volunteer' | 'staff'>('organizer');
  const [viewMode, setViewMode] = useState<'dashboard' | 'split'>('split');
  const [activePersonaTab, setActivePersonaTab] = useState<'fan' | 'organizer' | 'volunteer' | 'staff'>('fan');
  const [geminiApiKey, setGeminiApiKeyInternal] = useState<string>(
    import.meta.env.VITE_GEMINI_API_KEY || ''
  );

  const setGeminiApiKey = (key: string) => {
    localStorage.setItem('fanpulse_gemini_api_key', key);
    setGeminiApiKeyInternal(key);
  };

  const setUserRole = (role: 'fan' | 'organizer' | 'volunteer' | 'staff') => {
    setUserRoleState(role);
    setActivePersonaTab(role);
  };

  const addGreenScorePoints = (points: number) => {
    setGreenScore(prev => {
      const next = prev + points;
      localStorage.setItem('fanpulse_green_score', next.toString());
      return next;
    });
  };

  const reportIncident = (newInc: Omit<Incident, 'id' | 'timestamp' | 'status'>) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const createdIncident: Incident = {
      ...newInc,
      id: `inc-${Date.now()}`,
      status: 'open',
      timestamp: time,
      aiSuggestedAction: generateAISuggestion(newInc.category, newInc.location, newInc.description)
    };
    setIncidents(prev => [createdIncident, ...prev]);
  };

  const updateIncidentStatus = (id: string, status: Incident['status'], assignedStaff?: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return { 
          ...inc, 
          status, 
          assignedStaff: assignedStaff || inc.assignedStaff 
        };
      }
      return inc;
    }));
  };

  const updateZoneCrowd = (zoneId: string, deltaDensity: number) => {
    setZones(prev => prev.map(zone => {
      if (zone.id === zoneId) {
        const nextDensity = Math.max(0, Math.min(100, zone.densityPercentage + deltaDensity));
        let level: StadiumZone['crowdLevel'] = 'low';
        if (nextDensity > 85) level = 'critical';
        else if (nextDensity > 65) level = 'high';
        else if (nextDensity > 35) level = 'medium';

        // Adjust queue wait times proportionally
        const nextWait = Math.round((nextDensity / 100) * 40);

        return {
          ...zone,
          densityPercentage: nextDensity,
          crowdLevel: level,
          waitMinutes: nextWait
        };
      }
      return zone;
    }));
  };

  const triggerMockAlert = () => {
    // Randomly select a zone to congest
    const randomZone = zones[Math.floor(Math.random() * zones.length)];
    updateZoneCrowd(randomZone.id, 25);
    
    // Add incident
    reportIncident({
      title: `${randomZone.name} Crowding Surge`,
      category: 'crowd',
      severity: 'high',
      location: randomZone.name,
      description: `Sudden influx of fans arriving at ${randomZone.name}. Local bottlenecks forming. Scanner rate at capacity.`
    });
  };

  // Helper function to simulate realistic AI response options before API key is available
  const generateAISuggestion = (category: string, location: string, _desc: string): string => {
    switch (category) {
      case 'accessibility':
        return `Dispatch Assistant nearest to ${location}. Use elevator pathways to bypass congestion. Notify Guest Services.`;
      case 'crowd':
        return `Redirect incoming crowd to secondary gates. Update Wayfinding assistant instructions. Broadcast delay alert.`;
      case 'medical':
        return `Dispatch Medical Unit to ${location}. Open emergency vehicle access gate. Direct nearest Volunteer to secure area.`;
      case 'security':
        return `Alert Sector Security Command. Dispatch security patrol to ${location}. Monitor CCTV feed.`;
      default:
        return `Log incident. Notify stadium operations supervisor. Monitor updates.`;
    }
  };

  // Simulation loop (live ticks) to make the hackathon demo feel dynamic
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Tick scanner rates slightly
      setZones(prev => prev.map(zone => {
        if (zone.scannerRate > 0) {
          const delta = Math.floor(Math.random() * 5) - 2;
          return {
            ...zone,
            scannerRate: Math.max(5, zone.scannerRate + delta)
          };
        }
        return zone;
      }));

      // 2. Adjust concession wait times randomly
      setPois(prev => prev.map(poi => {
        if (poi.type === 'concession' && poi.waitMinutes !== undefined) {
          const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
          return {
            ...poi,
            waitMinutes: Math.max(1, poi.waitMinutes + delta)
          };
        }
        return poi;
      }));

      // 3. Fluctuations in transit ETA
      setTransit(prev => prev.map(t => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return {
          ...t,
          etaMinutes: Math.max(2, t.etaMinutes + delta)
        };
      }));

    }, 15000); // every 15s

    return () => clearInterval(interval);
  }, []);

  return (
    <SimulationContext.Provider value={{
      zones,
      pois,
      transit,
      incidents,
      greenScore,
      userRole,
      viewMode,
      geminiApiKey,
      activePersonaTab,
      setGeminiApiKey,
      setUserRole,
      setViewMode,
      setActivePersonaTab,
      reportIncident,
      updateIncidentStatus,
      addGreenScorePoints,
      updateZoneCrowd,
      triggerMockAlert
    }}>
      {children}
    </SimulationContext.Provider>
  );
};
