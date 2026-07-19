/**
 * @file types.ts
 * @description Centralized TypeScript type definitions for the FanPulse AI platform.
 * Provides shared types used across services, context, and view components.
 */

import type { StadiumZone, POI, TransitOption, Incident } from '../data/mockData';

/** User persona roles available in the FanPulse AI platform. */
export type UserRole = 'fan' | 'organizer' | 'volunteer' | 'staff';

/** Dashboard layout modes for the Command Center. */
export type ViewMode = 'dashboard' | 'split';

/** Crowd density classification thresholds for stadium zones. */
export type CrowdLevel = 'low' | 'medium' | 'high' | 'critical';

/** Incident severity levels used by the AI categorization engine. */
export type IncidentSeverity = 'low' | 'medium' | 'high';

/** Incident category types recognized by the AI dispatcher. */
export type IncidentCategory = 'crowd' | 'medical' | 'security' | 'accessibility' | 'facilities';

/** Context data passed to the Fan AI assistant for grounded responses. */
export interface FanAssistantContext {
  /** Current crowd density data for all stadium zones. */
  zones: StadiumZone[];
  /** Points of interest including restrooms, food, medical, and sensory rooms. */
  pois: POI[];
  /** Live transit options with ETAs, costs, and carbon footprint data. */
  transit: TransitOption[];
  /** The fan's current sustainability score. */
  greenScore: number;
}

/** Context data passed to the Command Center AI ops co-pilot. */
export interface OrganizerOpsContext {
  /** Active and resolved incidents in the current session. */
  incidents: Incident[];
  /** Current zone crowd density data. */
  zones: StadiumZone[];
}

/** Result structure returned by the AI incident auto-categorization engine. */
export interface IncidentCategorization {
  /** Short 3-5 word summary title for the incident. */
  title: string;
  /** AI-determined incident category. */
  category: IncidentCategory;
  /** AI-determined severity level. */
  severity: IncidentSeverity;
  /** AI-recommended dispatch action for staff. */
  aiSuggestedAction: string;
}

/** Supported languages for the volunteer translation tool. */
export const SUPPORTED_LANGUAGES = [
  'Spanish', 'Portuguese', 'French', 'German',
  'Japanese', 'Korean', 'Arabic', 'Hindi'
] as const;

/** Type for supported translation target languages. */
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/** Crowd density threshold constants used for zone classification. */
export const CROWD_THRESHOLDS = {
  CRITICAL: 85,
  HIGH: 65,
  MEDIUM: 35,
} as const;

/** Maximum wait time (minutes) used for proportional wait-time calculation. */
export const MAX_WAIT_MINUTES = 40;

/** Simulation tick interval in milliseconds. */
export const SIMULATION_TICK_MS = 15_000;

/** localStorage keys used by the application. */
export const STORAGE_KEYS = {
  GREEN_SCORE: 'fanpulse_green_score',
  GEMINI_API_KEY: 'fanpulse_gemini_api_key',
} as const;

/** Default green score for new users. */
export const DEFAULT_GREEN_SCORE = 75;
