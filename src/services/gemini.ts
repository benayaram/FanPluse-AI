import { GoogleGenerativeAI } from '@google/generative-ai';

// Simple check for valid key format
const isValidKey = (key: string) => {
  return typeof key === 'string' && key.trim().length > 10;
};

/**
 * Sanitize user input to prevent XSS and prompt injection.
 * Strips HTML tags, limits length, and trims whitespace.
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // strip control chars
    .trim()
    .slice(0, maxLength);
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Low-level generic call to Gemini using SDK
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
    // Correct usage of the SDK
    const ai = new GoogleGenerativeAI(apiKey);
    
    // We will use gemini-3.1-flash-lite as the standard fast conversational model
    const model = ai.getGenerativeModel({ 
      model: 'gemini-3.1-flash-lite',
      systemInstruction: systemInstruction,
    });

    // Format chat history for the SDK. The SDK strictly expects the history to start with a 'user' message.
    // We filter out any initial welcome/system messages from 'model'.
    const firstUserIndex = history.findIndex(msg => msg.role === 'user');
    const cleanHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

    const formattedHistory = cleanHistory.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    const sanitizedPrompt = sanitizeInput(userPrompt, 2000);
    const result = await chat.sendMessage(sanitizedPrompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return `[Gemini API Error: ${error.message || error}]. Falling back to simulated answer:\n\n` + generateMockResponse(systemInstruction, userPrompt);
  }
}

// Context-aware AI queries
export async function askFanAssistant(
  apiKey: string,
  query: string,
  context: { zones: any[]; pois: any[]; transit: any[]; greenScore: number },
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

export async function askOrganizerOps(
  apiKey: string,
  query: string,
  context: { incidents: any[]; zones: any[] }
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

export async function autoCategorizeIncident(
  apiKey: string, 
  description: string
): Promise<{ title: string; category: string; severity: string; aiSuggestedAction: string }> {
  const systemInstruction = `
You are an AI dispatcher. Analyze the security/operations incident report description and return a JSON object with:
- title: A short 3-5 word summary title.
- category: One of 'crowd' | 'medical' | 'security' | 'accessibility' | 'facilities'.
- severity: One of 'low' | 'medium' | 'high'.
- aiSuggestedAction: A brief, direct command recommendation for dispatchers.

Return ONLY a valid JSON string. Do not wrap in markdown \`\`\`json blocks.
`;

  if (!isValidKey(apiKey)) {
    // Quick local heuristic
    const descLower = description.toLowerCase();
    let category = 'facilities';
    let severity = 'low';
    let title = 'Facility issue';
    let action = 'Notify stadium maintenance.';

    if (descLower.includes('wheelchair') || descLower.includes('ada') || descLower.includes('handicap') || descLower.includes('elderly')) {
      category = 'accessibility';
      severity = 'medium';
      title = 'Accessibility Support Request';
      action = 'Dispatch wheelchair transport volunteer to location.';
    } else if (descLower.includes('fight') || descLower.includes('stole') || descLower.includes('theft') || descLower.includes('gate crash') || descLower.includes('trespass')) {
      category = 'security';
      severity = 'high';
      title = 'Security Incident';
      action = 'Alert Sector Security Command. Dispatch security patrol to check site.';
    } else if (descLower.includes('heart') || descLower.includes('injur') || descLower.includes('bleed') || descLower.includes('faint') || descLower.includes('sick')) {
      category = 'medical';
      severity = 'high';
      title = 'Medical Emergency';
      action = 'Dispatch nearest Medical Unit with defibrillator. Clear entry lane.';
    } else if (descLower.includes('crowd') || descLower.includes('jam') || descLower.includes('bottleneck') || descLower.includes('queue')) {
      category = 'crowd';
      severity = 'medium';
      title = 'Crowd Surge';
      action = 'Open secondary gates. Trigger crowd congestion alert banner in Fan App.';
    }

    return {
      title,
      category,
      severity,
      aiSuggestedAction: action
    };
  }

  try {
    const rawResult = await callGemini(apiKey, systemInstruction, `Analyze description: "${description}"`);
    // Clean up response if Gemini wrapped it in markdown code blocks
    let jsonStr = rawResult;
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Incident categorization parse error:', e);
    return {
      title: 'Incident Logged',
      category: 'facilities',
      severity: 'medium',
      aiSuggestedAction: 'Inspect location and assign appropriate staff.'
    };
  }
}

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
    // Simple mock translation for demo purposes
    if (targetLang.toLowerCase() === 'spanish' || targetLang.toLowerCase() === 'es') {
      return `[Traducido al Español]: ${text} (Active su clave API de Gemini en la barra de configuración para traducción real de IA)`;
    }
    return `[Translated to ${targetLang}]: ${text} (Configure Gemini API Key for actual AI translation)`;
  }

  return callGemini(apiKey, systemInstruction, text);
}

// Fallback Mock Responses to let the application work immediately out-of-the-box
function generateMockResponse(systemInstruction: string, query: string): string {
  const q = query.toLowerCase();
  
  // If it's the fan assistant
  if (systemInstruction.includes('FanPulse')) {
    if (q.includes('restroom') || q.includes('bathroom') || q.includes('toilet')) {
      return `🚻 **MetLife Stadium Restrooms:**\n\n- The nearest **accessible restroom** is at **Section 117** (near Gate A) and **Section 143** (near Gate D).\n- General restrooms at Section 109 currently have a **8-minute wait**, while Section 132 is busy with a **15-minute wait**.\n\n*Eco Tip: Wash your hands at sensors to save water!*`;
    }
    if (q.includes('food') || q.includes('eat') || q.includes('burger') || q.includes('vegan') || q.includes('taco')) {
      return `🍔 **Food & Beverage (Section 100s):**\n\n- **Green Bites (Vegan & Eco)** at **Section 108** has a **2-minute wait**. Choosing this eco-friendly option earns you **+25 Green Points**!\n- **Taco Fiesta (Halal)** at **Section 131** has a **12-minute wait**.\n- **Burger & Co** at **Section 114** has a **18-minute wait**.\n- **Pizza Palace** at **Section 140** has a **5-minute wait**.`;
    }
    if (q.includes('transit') || q.includes('bus') || q.includes('train') || q.includes('ride') || q.includes('uber') || q.includes('parking')) {
      return `🚇 **Transit & Transportation Options:**\n\n1. **NJ Transit Train ( Meadowlands Link):** Heavy traffic post-match. Running every 10 mins. ETA: **12 mins** to board. Cost: **$4.25**. Carbon footprint: **0.4kg CO2** (Recommended! 🌱 +50 Green Points).\n2. **Coach USA Express Bus:** Departs Lot K. Running smoothly. ETA: **8 mins**. Cost: **$14.00**. Carbon footprint: **0.9kg CO2** (+30 Green Points).\n3. **Rideshare (Uber/Lyft):** Lot E. Delay: **30 mins** due to traffic on Route 3. Cost: **$45 - $65** (Surge active). Carbon footprint: **4.8kg CO2**.`;
    }
    if (q.includes('accessible') || q.includes('sensory') || q.includes('quiet') || q.includes('wheelchair')) {
      return `♿ **Accessibility Services:**\n\n- **Sensory-Friendly Room:** Located at **Section 128** (West side, KultureCity certified). Quiet space to decompress. Sensory bags are available at Guest Services booths.\n- **Step-free Ramp Entry:** Nearest is at **Gate D (Pepsi)**, which features a dedicated accessibility pathway.\n- **Accessible Toilets:** Section 117 and 143 companion restrooms have step-free entries and emergency alert buttons.`;
    }
    if (q.includes('sustainability') || q.includes('green') || q.includes('compost') || q.includes('score')) {
      return `🌱 **Sustainability Hub & Green Score:**\n\nYour current Green Score is active. You can earn points by:\n- Taking NJ Transit Train (+50 points)\n- Eating at Green Bites Sec 108 (+25 points)\n- Using Composting bins (Green) for food wrappers (+15 points)\n\n*Fun Fact: MetLife Stadium is a zero-waste stadium for FIFA 2026. Every item from concessions is compostable!*`;
    }
    return `👋 Hello! I am **FanPulse**, your AI stadium guide. How can I help you today? \n\nTry asking me:\n- *"Where is the nearest wheelchair restroom?"*\n- *"What is the fastest food option with a low line?"*\n- *"How do I get back to Manhattan post-match?"*\n\n*(Note: To enable live Gemini responses, please enter your Gemini API Key in the settings gear above).*`;
  }

  // If it's the volunteer assistant
  if (systemInstruction.includes('Volunteer')) {
    if (q.includes('medical') || q.includes('heart') || q.includes('injur') || q.includes('sick')) {
      return `🚨 **EMERGENCY WARNING:**\n\nIf a fan is having a medical emergency, **do not attempt to move them**. Immediately call **Medical Dispatch** or direct them to the **First Aid Station at Section 103 or Section 233**. Notify security command immediately.`;
    }
    if (q.includes('uniform') || q.includes('wear') || q.includes('polo')) {
      return `👕 **Uniform Policy:**\n\nAll volunteers must wear the official **green FIFA volunteer polo**, khaki pants, and comfortable closed-toe athletic shoes. Your credential badge must be visible at all times.`;
    }
    if (q.includes('check') || q.includes('shift') || q.includes('late')) {
      return `⏰ **Shift Check-in Protocol:**\n\nCheck-in is at the **Volunteer Center (under the South Ramp near Gate C)**. Please arrive exactly **1 hour** before your shift starts to receive security briefs and food vouchers.`;
    }
    return `Volunteers, how can I assist you? Ask me about policies, check-in, uniform, or what to do in case of incidents.\n\n*(Note: Enter your Gemini API Key in the settings gear to activate live Gemini policies assistance).*`;
  }

  // If it's organizer ops
  if (systemInstruction.includes('Command Center')) {
    return `📊 **Operations Analysis Summary:**\n\n- **Crowd flow alert:** Gate D queue wait times are at **35 minutes** (Critical) due to Scanner Terminal #3 being offline. Entry rates have dropped to 15 scans/min.\n- **Pending incidents:** There are **2 active incidents** (inc-1: ADA transport at Gate D; inc-2: Terminal offline at Gate D).\n- **Suggested Operations Action:** Redirect fans arriving on NJ Transit towards Gate A/B. Dispatched technician to Gate D terminal #3.`;
  }

  return `This is a simulated AI response for the prompt: "${query}". (Provide a Gemini API Key to see real-time custom model answers).`;
}
