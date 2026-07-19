/**
 * @file SimulationContext.tsx
 * @description Global state management for the FanPulse AI stadium simulation.
 *
 * Provides a React Context that manages:
 * - Stadium zone crowd densities with live simulation ticks
 * - Points of Interest (POIs) with fluctuating wait times
 * - Transit options with dynamic ETA updates
 * - Incident lifecycle (create, assign, resolve)
 * - Sustainability Green Score tracking
 * - Gemini API key management
 *
 * The simulation loop runs every 15 seconds to create a realistic
 * live-data experience for the hackathon demo.
 */

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
import type { UserRole, ViewMode, IncidentCategory } from '../types/types';
import {
  CROWD_THRESHOLDS,
  MAX_WAIT_MINUTES,
  SIMULATION_TICK_MS,
  STORAGE_KEYS,
  DEFAULT_GREEN_SCORE,
} from '../types/types';

/** Shape of the simulation context exposed to all consumer components. */
interface SimulationContextType {
  /** Current crowd data for all stadium zones. */
  zones: StadiumZone[];
  /** Points of interest with live wait time data. */
  pois: POI[];
  /** Transit options with live ETA data. */
  transit: TransitOption[];
  /** All incidents (active and resolved). */
  incidents: Incident[];
  /** Current sustainability score for the fan persona. */
  greenScore: number;
  /** Currently active user role. */
  userRole: UserRole;
  /** Dashboard layout mode. */
  viewMode: ViewMode;
  /** Gemini API key for AI features. */
  geminiApiKey: string;
  /** Currently selected persona tab. */
  activePersonaTab: UserRole;
  /** Update the Gemini API key (persisted to localStorage). */
  setGeminiApiKey: (key: string) => void;
  /** Switch the active user role (also updates persona tab). */
  setUserRole: (role: UserRole) => void;
  /** Toggle dashboard layout mode. */
  setViewMode: (mode: ViewMode) => void;
  /** Set the active persona tab directly. */
  setActivePersonaTab: (tab: UserRole) => void;
  /** Create a new incident from a partial incident record. */
  reportIncident: (incident: Omit<Incident, 'id' | 'timestamp' | 'status'>) => void;
  /** Update an incident's status and optionally assign staff. */
  updateIncidentStatus: (id: string, status: Incident['status'], assignedStaff?: string) => void;
  /** Add sustainability points to the fan's Green Score. */
  addGreenScorePoints: (points: number) => void;
  /** Adjust a zone's crowd density by a delta value. */
  updateZoneCrowd: (zoneId: string, deltaDensity: number) => void;
  /** Simulate a crowd surge event for demo purposes. */
  triggerMockAlert: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

/**
 * Custom hook to consume the simulation context.
 * Must be used within a `SimulationProvider`.
 *
 * @throws Error if used outside of SimulationProvider.
 * @returns The simulation context value.
 */
export const useSimulation = (): SimulationContextType => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

/**
 * SimulationProvider wraps the application and provides live stadium data
 * to all child components via React Context.
 *
 * Manages:
 * - State initialization from mock data and localStorage
 * - A 15-second simulation loop for dynamic crowd/transit updates
 * - Incident reporting with auto-generated AI suggestions
 * - Green Score persistence across sessions
 */
export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [zones, setZones] = useState<StadiumZone[]>(STADIUM_ZONES);
  const [pois, setPois] = useState<POI[]>(STADIUM_POIS);
  const [transit, setTransit] = useState<TransitOption[]>(INITIAL_TRANSIT_OPTIONS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [greenScore, setGreenScore] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GREEN_SCORE);
    return saved ? parseInt(saved, 10) : DEFAULT_GREEN_SCORE;
  });
  const [userRole, setUserRoleState] = useState<UserRole>('organizer');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activePersonaTab, setActivePersonaTab] = useState<UserRole>('fan');
  const [geminiApiKey, setGeminiApiKeyInternal] = useState<string>(
    import.meta.env.VITE_GEMINI_API_KEY || ''
  );

  /** Persist the API key to localStorage and update state. */
  const setGeminiApiKey = (key: string): void => {
    localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key);
    setGeminiApiKeyInternal(key);
  };

  /** Switch role and synchronize the persona tab. */
  const setUserRole = (role: UserRole): void => {
    setUserRoleState(role);
    setActivePersonaTab(role);
  };

  /** Add points to the Green Score and persist to localStorage. */
  const addGreenScorePoints = (points: number): void => {
    setGreenScore(prev => {
      const next = prev + points;
      localStorage.setItem(STORAGE_KEYS.GREEN_SCORE, next.toString());
      return next;
    });
  };

  /** Create a new incident with auto-generated ID, timestamp, and AI suggestion. */
  const reportIncident = (newInc: Omit<Incident, 'id' | 'timestamp' | 'status'>): void => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const createdIncident: Incident = {
      ...newInc,
      id: `inc-${Date.now()}`,
      status: 'open',
      timestamp: time,
      aiSuggestedAction: generateAISuggestion(newInc.category, newInc.location),
    };
    setIncidents(prev => [createdIncident, ...prev]);
  };

  /** Update the status of an existing incident, optionally assigning staff. */
  const updateIncidentStatus = (id: string, status: Incident['status'], assignedStaff?: string): void => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status,
          assignedStaff: assignedStaff || inc.assignedStaff,
        };
      }
      return inc;
    }));
  };

  /**
   * Adjust a zone's crowd density and recalculate its crowd level and wait time.
   * Density is clamped to [0, 100] range.
   */
  const updateZoneCrowd = (zoneId: string, deltaDensity: number): void => {
    setZones(prev => prev.map(zone => {
      if (zone.id === zoneId) {
        const nextDensity = Math.max(0, Math.min(100, zone.densityPercentage + deltaDensity));

        let level: StadiumZone['crowdLevel'] = 'low';
        if (nextDensity > CROWD_THRESHOLDS.CRITICAL) level = 'critical';
        else if (nextDensity > CROWD_THRESHOLDS.HIGH) level = 'high';
        else if (nextDensity > CROWD_THRESHOLDS.MEDIUM) level = 'medium';

        const nextWait = Math.round((nextDensity / 100) * MAX_WAIT_MINUTES);

        return {
          ...zone,
          densityPercentage: nextDensity,
          crowdLevel: level,
          waitMinutes: nextWait,
        };
      }
      return zone;
    }));
  };

  /** Simulate a crowd surge by randomly congesting a zone and creating an incident. */
  const triggerMockAlert = (): void => {
    const randomZone = zones[Math.floor(Math.random() * zones.length)];
    updateZoneCrowd(randomZone.id, 25);

    reportIncident({
      title: `${randomZone.name} Crowding Surge`,
      category: 'crowd',
      severity: 'high',
      location: randomZone.name,
      description: `Sudden influx of fans arriving at ${randomZone.name}. Local bottlenecks forming. Scanner rate at capacity.`,
    });
  };

  /**
   * Generate a deterministic AI suggestion based on incident category.
   * Used for immediate feedback before the Gemini API processes the incident.
   */
  const generateAISuggestion = (category: IncidentCategory | string, location: string): string => {
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

  /**
   * Simulation loop — Creates realistic live-data behavior for the demo.
   * Runs every 15 seconds to:
   * 1. Fluctuate gate scanner rates (±2 scans/min)
   * 2. Adjust concession wait times (±1 minute)
   * 3. Update transit ETAs (±1 minute)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Fluctuate scanner rates at gates
      setZones(prev => prev.map(zone => {
        if (zone.scannerRate > 0) {
          const delta = Math.floor(Math.random() * 5) - 2;
          return {
            ...zone,
            scannerRate: Math.max(5, zone.scannerRate + delta),
          };
        }
        return zone;
      }));

      // 2. Fluctuate concession wait times
      setPois(prev => prev.map(poi => {
        if (poi.type === 'concession' && poi.waitMinutes !== undefined) {
          const delta = Math.floor(Math.random() * 3) - 1;
          return {
            ...poi,
            waitMinutes: Math.max(1, poi.waitMinutes + delta),
          };
        }
        return poi;
      }));

      // 3. Fluctuate transit ETAs
      setTransit(prev => prev.map(t => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return {
          ...t,
          etaMinutes: Math.max(2, t.etaMinutes + delta),
        };
      }));
    }, SIMULATION_TICK_MS);

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
      triggerMockAlert,
    }}>
      {children}
    </SimulationContext.Provider>
  );
};
