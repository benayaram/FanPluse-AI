/**
 * @file gemini.ts
 * @description Google Gemini AI service layer for the FanPulse AI platform.
 *
 * This module provides all GenAI integration functions used across the four
 * persona views (Fan, Volunteer, Staff, Organizer). Each function constructs
 * a context-aware system instruction with real-time stadium data and sends
 * the user's query to the Gemini 3.1 Flash Lite model.
 *
 * When no valid API key is configured, all functions gracefully fall back
 * to a comprehensive local heuristic engine that provides realistic mock
 * responses — ensuring the application works out-of-the-box.
 *
 * @see {@link https://ai.google.dev/gemini-api/docs} Gemini API Documentation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  FanAssistantContext,
  OrganizerOpsContext,
  IncidentCategorization,
  IncidentCategory,
  IncidentSeverity,
} from '../types/types';

/** Minimum key length threshold to consider an API key potentially valid. */
const MIN_KEY_LENGTH = 10;

/**
 * Validates whether a string could be a usable Gemini API key.
 * This is a lightweight format check, not a server-side validation.
 *
 * @param key - The API key string to validate.
 * @returns `true` if the key appears to be a valid format.
 */
const isValidKey = (key: string): boolean => {
  return typeof key === 'string' && key.trim().length > MIN_KEY_LENGTH;
};

/**
 * Sanitize user input to prevent XSS and prompt injection attacks.
 * Strips HTML tags, removes ASCII control characters, trims whitespace,
 * and truncates to a maximum length.
 *
 * @param input - The raw user input string.
 * @param maxLength - Maximum allowed character length (default: 1000).
 * @returns Sanitized string safe for display and API transmission.
 *
 * @example
 * ```ts
 * sanitizeInput('<script>alert("xss")</script>Hello'); // => 'alert("xss")Hello'
 * sanitizeInput('Hello\x00World'); // => 'HelloWorld'
 * ```
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // strip control chars
    .trim()
    .slice(0, maxLength);
}

/** A single message in the conversation history. */
export interface ChatMessage {
  /** The role of the message sender — 'user' for fan input, 'model' for AI responses. */
  role: 'user' | 'model';
  /** The text content of the message. */
  text: string;
}

/** The Gemini model identifier used across the platform. */
const GEMINI_MODEL = 'gemini-3.1-flash-lite';

/**
 * Low-level function to call the Google Gemini API with a system instruction,
 * user prompt, and optional conversation history.
 *
 * This is the core function used by all higher-level service functions.
 * If the API key is invalid, it falls back to `generateMockResponse()`.
 *
 * @param apiKey - The Google Gemini API key.
 * @param systemInstruction - The system instruction providing persona and context.
 * @param userPrompt - The user's input query.
 * @param history - Previous conversation messages for multi-turn support.
 * @returns The AI-generated response text.
 */
export async function callGemini(
  apiKey: string,
  systemInstruction: string,
  userPrompt: string,
  history: ChatMessage[] = []
): Promise<string> {
  if (!isValidKey(apiKey)) {
    return generateMockResponse(systemInstruction, userPrompt);
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction,
    });

    // The SDK requires history to start with a 'user' message.
    // Filter out any initial welcome/system messages from 'model'.
    const firstUserIndex = history.findIndex(msg => msg.role === 'user');
    const cleanHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

    const formattedHistory = cleanHistory.map(msg => ({
      role: msg.role === 'model' ? ('model' as const) : ('user' as const),
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({ history: formattedHistory });
    const sanitizedPrompt = sanitizeInput(userPrompt, 2000);
    const result = await chat.sendMessage(sanitizedPrompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Gemini API Error]:', errorMessage);
    return (
      `[Gemini API Error: ${errorMessage}]. Falling back to simulated answer:\n\n` +
      generateMockResponse(systemInstruction, userPrompt)
    );
  }
}

/**
 * Fan AI Assistant — Provides context-aware stadium guidance using live data.
 *
 * Handles wayfinding, food recommendations, transit planning, accessibility info,
 * sustainability scoring, and multilingual support for fans at MetLife Stadium.
 *
 * @param apiKey - The Gemini API key.
 * @param query - The fan's natural language question.
 * @param context - Live stadium data (zones, POIs, transit, green score).
 * @param history - Conversation history for multi-turn dialogue.
 * @returns AI-generated response grounded in live stadium data.
 */
export async function askFanAssistant(
  apiKey: string,
  query: string,
  context: FanAssistantContext,
  history: ChatMessage[] = []
): Promise<string> {
  const systemInstruction = `
You are FanPulse, the official GenAI multi-lingual assistant for fans at MetLife Stadium during FIFA World Cup 2026.
You are running in the context of a live stadium. Here is the current live data you must use:
- Zones & Gate Crowd Status: ${JSON.stringify(context.zones)}
- Points of Interest (Restrooms, Concessions, Medical, Sensory Rooms): ${JSON.stringify(context.pois)}
- Live Transit Options & Delays: ${JSON.stringify(context.transit)}
- Current Fan's Sustainability Points (Green Score): ${context.greenScore}

Your tone is helpful, energetic, and highly professional. 
Follow these guidelines strictly:
1. Use the live data above to answer. If a fan asks about wait times, gates, food, restrooms, or transit, give exact, specific live answers.
2. If they ask about accessibility (wheelchairs, quiet rooms, companion toilets, elevators), always point them to the nearest accessible location (like Sensory Room at Sec 128, Restroom at Sec 117).
3. If they ask about food, recommend green choices like 'Green Bites' at Sec 108 and mention they earn +25 Green Points for eco-friendly foods.
4. Advise on transit choices based on delay. NJ Transit Meadowlands Rail Link is high capacity but crowded. Coach USA Express Bus is in Lot K and has normal delays. Rideshare at Lot E is delayed 30 mins and surge priced (+5.4kg CO2).
5. If they ask in a different language (Spanish, Portuguese, French, Arabic, Hindi, etc.), detect the language and respond in the same language. Keep it brief.
`;

  return callGemini(apiKey, systemInstruction, query, history);
}

/**
 * Volunteer AI Co-Pilot — Provides policy guidance and shift support.
 *
 * Answers questions about volunteer protocols, uniform policies, escalation
 * procedures, and emergency response using the official Volunteer Handbook.
 *
 * @param apiKey - The Gemini API key.
 * @param query - The volunteer's question.
 * @param volunteerKnowledge - The full Volunteer Handbook text as context.
 * @param history - Conversation history for multi-turn dialogue.
 * @returns AI-generated policy-grounded response.
 */
export async function askVolunteerAssistant(
  apiKey: string,
  query: string,
  volunteerKnowledge: string,
  history: ChatMessage[] = []
): Promise<string> {
  const systemInstruction = `
You are Volunteer Co-Pilot, an AI coach helping volunteers at MetLife Stadium during FIFA 2026.
Here is the official Volunteer Handbook and Knowledge Base:
${volunteerKnowledge}

Guidelines:
1. Answer volunteer questions regarding policies, shift check-ins, uniforms, and escalation protocols.
2. Be supportive and concise. Provide clear actionable instructions.
3. If a volunteer reports a medical emergency or security breach, instruct them immediately: "MED: Call Medical Dispatch or alert First Aid. SEC: Back away and contact Security Command."
`;

  return callGemini(apiKey, systemInstruction, query, history);
}

/**
 * Command Center AI Ops Co-Pilot — Provides operational intelligence for organizers.
 *
 * Analyzes live incident data and crowd densities to support the Command Center Lead
 * with data-driven operational recommendations and situational awareness.
 *
 * @param apiKey - The Gemini API key.
 * @param query - The organizer's operational question.
 * @param context - Live incident and zone density data.
 * @returns AI-generated operations analysis with specific incident/zone references.
 */
export async function askOrganizerOps(
  apiKey: string,
  query: string,
  context: OrganizerOpsContext
): Promise<string> {
  const systemInstruction = `
You are the Command Center Operations Co-Pilot for MetLife Stadium.
Current live status:
- Active Incidents: ${JSON.stringify(context.incidents)}
- Zone densities: ${JSON.stringify(context.zones)}

Your job is to analyze queries from the Organizer Command Center Lead (Marcus).
Provide direct, analytical answers. Cite specific incident IDs (e.g., inc-1) or zones when explaining bottlenecks.
Synthesize recommended operational choices. Be structured, using bullet points for clarity.
`;

  return callGemini(apiKey, systemInstruction, query);
}

/**
 * AI Incident Auto-Categorizer — Classifies incident reports using GenAI.
 *
 * Analyzes free-text incident descriptions from staff and automatically determines:
 * - A short title
 * - The incident category (crowd, medical, security, accessibility, facilities)
 * - Severity level (low, medium, high)
 * - A recommended dispatch action
 *
 * When no API key is available, uses keyword-based heuristic detection.
 *
 * @param apiKey - The Gemini API key.
 * @param description - The free-text incident description from staff.
 * @returns Structured incident categorization with AI-suggested action.
 */
export async function autoCategorizeIncident(
  apiKey: string,
  description: string
): Promise<IncidentCategorization> {
  const systemInstruction = `
You are an AI dispatcher. Analyze the security/operations incident report description and return a JSON object with:
- title: A short 3-5 word summary title.
- category: One of 'crowd' | 'medical' | 'security' | 'accessibility' | 'facilities'.
- severity: One of 'low' | 'medium' | 'high'.
- aiSuggestedAction: A brief, direct command recommendation for dispatchers.

Return ONLY a valid JSON string. Do not wrap in markdown \`\`\`json blocks.
`;

  if (!isValidKey(apiKey)) {
    return categorizeByHeuristic(description);
  }

  try {
    const rawResult = await callGemini(
      apiKey,
      systemInstruction,
      `Analyze description: "${description}"`
    );
    // Clean up response if Gemini wrapped it in markdown code blocks
    let jsonStr = rawResult;
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    return JSON.parse(jsonStr) as IncidentCategorization;
  } catch (parseError: unknown) {
    const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    console.error('[Incident Categorization Parse Error]:', errorMessage);
    return {
      title: 'Incident Logged',
      category: 'facilities',
      severity: 'medium',
      aiSuggestedAction: 'Inspect location and assign appropriate staff.',
    };
  }
}

/**
 * Keyword-based heuristic for incident categorization when no API key is available.
 * Maps common keywords to incident categories and severity levels.
 *
 * @param description - The raw incident description text.
 * @returns Structured categorization based on keyword matching.
 */
function categorizeByHeuristic(description: string): IncidentCategorization {
  const descLower = description.toLowerCase();

  /** Keyword-to-category mapping rules, ordered by priority. */
  const rules: Array<{
    keywords: string[];
    category: IncidentCategory;
    severity: IncidentSeverity;
    title: string;
    action: string;
  }> = [
    {
      keywords: ['wheelchair', 'ada', 'handicap', 'elderly'],
      category: 'accessibility',
      severity: 'medium',
      title: 'Accessibility Support Request',
      action: 'Dispatch wheelchair transport volunteer to location.',
    },
    {
      keywords: ['fight', 'stole', 'theft', 'gate crash', 'trespass'],
      category: 'security',
      severity: 'high',
      title: 'Security Incident',
      action: 'Alert Sector Security Command. Dispatch security patrol to check site.',
    },
    {
      keywords: ['heart', 'injur', 'bleed', 'faint', 'sick'],
      category: 'medical',
      severity: 'high',
      title: 'Medical Emergency',
      action: 'Dispatch nearest Medical Unit with defibrillator. Clear entry lane.',
    },
    {
      keywords: ['crowd', 'jam', 'bottleneck', 'queue'],
      category: 'crowd',
      severity: 'medium',
      title: 'Crowd Surge',
      action: 'Open secondary gates. Trigger crowd congestion alert banner in Fan App.',
    },
  ];

  // Find the first matching rule
  for (const rule of rules) {
    if (rule.keywords.some(keyword => descLower.includes(keyword))) {
      return {
        title: rule.title,
        category: rule.category,
        severity: rule.severity,
        aiSuggestedAction: rule.action,
      };
    }
  }

  // Default fallback for unrecognized descriptions
  return {
    title: 'Facility issue',
    category: 'facilities',
    severity: 'low',
    aiSuggestedAction: 'Notify stadium maintenance.',
  };
}

/**
 * Quick Translation Tool — Translates text for multilingual fan support.
 *
 * Used by volunteers to translate common phrases into supported languages.
 * Falls back to a labeled mock translation when no API key is configured.
 *
 * @param apiKey - The Gemini API key.
 * @param text - The source text to translate.
 * @param targetLang - The target language name (e.g., 'Spanish', 'Arabic').
 * @returns The translated text string.
 */
export async function quickTranslateText(
  apiKey: string,
  text: string,
  targetLang: string
): Promise<string> {
  const systemInstruction = `
You are a fast translation bot for FIFA stadium volunteers. 
Translate the text to: "${targetLang}".
Provide ONLY the translated text. Do not add explanations, notes, or greeting prefix.
`;

  if (!isValidKey(apiKey)) {
    if (targetLang.toLowerCase() === 'spanish' || targetLang.toLowerCase() === 'es') {
      return `[Traducido al Español]: ${text} (Active su clave API de Gemini para traducción real de IA)`;
    }
    return `[Translated to ${targetLang}]: ${text} (Configure Gemini API Key for AI translation)`;
  }

  return callGemini(apiKey, systemInstruction, text);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Response Engine — Provides realistic fallback responses for demos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates context-aware mock responses when no API key is available.
 * Routes the query to the appropriate persona mock handler based on
 * keywords in the system instruction.
 *
 * @param systemInstruction - The system instruction identifying the persona.
 * @param query - The user's query to generate a response for.
 * @returns A realistic mock response string with formatted markdown.
 */
function generateMockResponse(systemInstruction: string, query: string): string {
  const q = query.toLowerCase();

  if (systemInstruction.includes('FanPulse')) {
    return generateFanMockResponse(q);
  }

  if (systemInstruction.includes('Volunteer')) {
    return generateVolunteerMockResponse(q);
  }

  if (systemInstruction.includes('Command Center')) {
    return `📊 **Operations Analysis Summary:**\n\n- **Crowd flow alert:** Gate D queue wait times are at **35 minutes** (Critical) due to Scanner Terminal #3 being offline. Entry rates have dropped to 15 scans/min.\n- **Pending incidents:** There are **2 active incidents** (inc-1: ADA transport at Gate D; inc-2: Terminal offline at Gate D).\n- **Suggested Operations Action:** Redirect fans arriving on NJ Transit towards Gate A/B. Dispatched technician to Gate D terminal #3.`;
  }

  return `This is a simulated AI response for the prompt: "${query}". (Provide a Gemini API Key to see real-time custom model answers).`;
}

/**
 * Mock response handler for the Fan AI Assistant persona.
 * Returns formatted stadium information based on query keywords.
 */
function generateFanMockResponse(query: string): string {
  if (query.includes('restroom') || query.includes('bathroom') || query.includes('toilet')) {
    return `🚻 **MetLife Stadium Restrooms:**\n\n- The nearest **accessible restroom** is at **Section 117** (near Gate A) and **Section 143** (near Gate D).\n- General restrooms at Section 109 currently have a **8-minute wait**, while Section 132 is busy with a **15-minute wait**.\n\n*Eco Tip: Wash your hands at sensors to save water!*`;
  }
  if (query.includes('food') || query.includes('eat') || query.includes('burger') || query.includes('vegan') || query.includes('taco')) {
    return `🍔 **Food & Beverage (Section 100s):**\n\n- **Green Bites (Vegan & Eco)** at **Section 108** has a **2-minute wait**. Choosing this eco-friendly option earns you **+25 Green Points**!\n- **Taco Fiesta (Halal)** at **Section 131** has a **12-minute wait**.\n- **Burger & Co** at **Section 114** has a **18-minute wait**.\n- **Pizza Palace** at **Section 140** has a **5-minute wait**.`;
  }
  if (query.includes('transit') || query.includes('bus') || query.includes('train') || query.includes('ride') || query.includes('uber') || query.includes('parking')) {
    return `🚇 **Transit & Transportation Options:**\n\n1. **NJ Transit Train (Meadowlands Link):** Heavy traffic post-match. Running every 10 mins. ETA: **12 mins** to board. Cost: **$4.25**. Carbon footprint: **0.4kg CO2** (Recommended! 🌱 +50 Green Points).\n2. **Coach USA Express Bus:** Departs Lot K. Running smoothly. ETA: **8 mins**. Cost: **$14.00**. Carbon footprint: **0.9kg CO2** (+30 Green Points).\n3. **Rideshare (Uber/Lyft):** Lot E. Delay: **30 mins** due to traffic on Route 3. Cost: **$45 - $65** (Surge active). Carbon footprint: **4.8kg CO2**.`;
  }
  if (query.includes('accessible') || query.includes('sensory') || query.includes('quiet') || query.includes('wheelchair')) {
    return `♿ **Accessibility Services:**\n\n- **Sensory-Friendly Room:** Located at **Section 128** (West side, KultureCity certified). Quiet space to decompress. Sensory bags are available at Guest Services booths.\n- **Step-free Ramp Entry:** Nearest is at **Gate D (Pepsi)**, which features a dedicated accessibility pathway.\n- **Accessible Toilets:** Section 117 and 143 companion restrooms have step-free entries and emergency alert buttons.`;
  }
  if (query.includes('sustainability') || query.includes('green') || query.includes('compost') || query.includes('score')) {
    return `🌱 **Sustainability Hub & Green Score:**\n\nYour current Green Score is active. You can earn points by:\n- Taking NJ Transit Train (+50 points)\n- Eating at Green Bites Sec 108 (+25 points)\n- Using Composting bins (Green) for food wrappers (+15 points)\n\n*Fun Fact: MetLife Stadium is a zero-waste stadium for FIFA 2026. Every item from concessions is compostable!*`;
  }
  return `👋 Hello! I am **FanPulse**, your AI stadium guide. How can I help you today? \n\nTry asking me:\n- *"Where is the nearest wheelchair restroom?"*\n- *"What is the fastest food option with a low line?"*\n- *"How do I get back to Manhattan post-match?"*\n\n*(Note: To enable live Gemini responses, please enter your Gemini API Key in the settings gear above).*`;
}

/**
 * Mock response handler for the Volunteer Co-Pilot persona.
 * Returns volunteer policy information based on query keywords.
 */
function generateVolunteerMockResponse(query: string): string {
  if (query.includes('medical') || query.includes('heart') || query.includes('injur') || query.includes('sick')) {
    return `🚨 **EMERGENCY WARNING:**\n\nIf a fan is having a medical emergency, **do not attempt to move them**. Immediately call **Medical Dispatch** or direct them to the **First Aid Station at Section 103 or Section 233**. Notify security command immediately.`;
  }
  if (query.includes('uniform') || query.includes('wear') || query.includes('polo')) {
    return `👕 **Uniform Policy:**\n\nAll volunteers must wear the official **green FIFA volunteer polo**, khaki pants, and comfortable closed-toe athletic shoes. Your credential badge must be visible at all times.`;
  }
  if (query.includes('check') || query.includes('shift') || query.includes('late')) {
    return `⏰ **Shift Check-in Protocol:**\n\nCheck-in is at the **Volunteer Center (under the South Ramp near Gate C)**. Please arrive exactly **1 hour** before your shift starts to receive security briefs and food vouchers.`;
  }
  return `Volunteers, how can I assist you? Ask me about policies, check-in, uniform, or what to do in case of incidents.\n\n*(Note: Enter your Gemini API Key in the settings gear to activate live Gemini policies assistance).*`;
}
