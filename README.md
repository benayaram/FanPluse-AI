# FanPulse AI — Smart Stadium Operations for FIFA World Cup 2026

> **Challenge Vertical:** [Challenge 4] Smart Stadiums & Tournament Operations  
> **Deployed App:** [https://fan-pluse-ai.vercel.app](https://fan-pluse-ai.vercel.app)  
> **Tech Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Google Gemini 3.1 Flash Lite

---

## 🎯 Chosen Vertical

**Smart Stadiums & Tournament Operations** — A GenAI-enabled web platform that enhances stadium operations and the overall tournament experience for **fans, organizers, volunteers, and venue staff** at MetLife Stadium during FIFA World Cup 2026.

---

## 🧠 Approach & Logic

FanPulse AI is a **role-based operations platform** built around four distinct personas, each with tailored GenAI-powered features:

### Architecture

```
┌─────────────────────────────────────────────────┐
│                  Portal Hub                      │
│  (Role Selection: Fan / Volunteer / Staff / Ops) │
└─────────┬──────────┬──────────┬─────────────────┘
          │          │          │
    ┌─────▼───┐ ┌───▼────┐ ┌──▼──────┐ ┌──────────┐
    │  Fan    │ │Volunteer│ │ Staff   │ │ Command  │
    │ Portal  │ │  Hub    │ │Console  │ │ Center   │
    └─────────┘ └────────┘ └─────────┘ └──────────┘
          │          │          │            │
          └──────────┴──────────┴────────────┘
                         │
              ┌──────────▼──────────┐
              │  Google Gemini API  │
              │  (3.1 Flash Lite)   │
              └─────────────────────┘
```

### Decision Logic

1. **Context-Aware AI:** Each persona sends real-time stadium data (crowd densities, gate wait times, active incidents, transit delays) as structured context to Gemini, enabling responses grounded in live operational state rather than generic answers.

2. **Graceful Fallback:** When no API key is configured, the app falls back to a comprehensive local heuristic engine that provides realistic mock responses — ensuring the demo always works.

3. **Cross-View Synchronization:** Incidents reported by Staff are instantly visible in the Command Center. Crowd management actions in the Command Center update zone densities across all views in real-time via React Context.

4. **Input Sanitization:** All user inputs are sanitized (HTML stripping, control character removal, length limiting) before being sent to the AI to prevent XSS and prompt injection attacks.

---

## 🚀 How the Solution Works

### 1. Fan Portal (Persona: Priya)
- **AI Wayfinding Chat:** Conversational assistant for finding restrooms, food, medical stations, and sensory rooms with real-time wait times.
- **Live Transit Planner:** Shows NJ Transit train, bus, rideshare, and parking options with ETA, cost, and carbon footprint.
- **Green Score Gamification:** Tracks sustainability points for eco-friendly choices (transit, composting, green food).
- **Multilingual Support:** Gemini detects input language and responds in kind (Spanish, Portuguese, French, Arabic, Hindi, etc.).

### 2. Volunteer Hub (Persona: Aisha)
- **AI Policy Assistant:** Answers questions about shift check-in, uniform policy, and escalation protocols using the official Volunteer Handbook as context.
- **Task Checklist:** Pre-loaded volunteer tasks with completion tracking.
- **Instant Translation Tool:** Translates phrases to 8+ languages to help multilingual fans.

### 3. Staff & Security Console (Persona: Diego)
- **Incident Reporting:** Submit incident descriptions that are **auto-categorized by AI** into severity levels (low/medium/high) and categories (crowd/medical/security/accessibility/facilities).
- **AI-Generated Action Recommendations:** Each incident gets an AI-suggested dispatch action.
- **ADA Accessibility Queue:** Dedicated panel showing accessibility requests requiring staff dispatch.
- **Gate Crowd Management:** One-click staff deployment to reduce crowd density at congested gates.

### 4. Command Center (Persona: Marcus)
- **Live SVG Stadium Heatmap:** Interactive venue map showing zone crowd densities with color-coded zones (green → red).
- **Operations Analytics:** Real-time metrics for active incidents, gate congestion, concession wait times, and carbon savings.
- **AI Ops Co-Pilot:** Natural language queries analyzed against live incident and crowd data using Gemini.
- **Broadcast Alerts:** Push stadium-wide alert banners to all personas.
- **Crowd Surge Simulation:** Trigger realistic crowd events to test operational response.

---

## 🛡️ Security Measures

| Measure | Implementation |
|---------|---------------|
| **Input Sanitization** | `sanitizeInput()` strips HTML tags, control characters, and enforces max length on all user inputs before API calls |
| **CSP Headers** | Content-Security-Policy meta tag restricts script sources, API connections, and font loading |
| **API Key Protection** | Keys loaded from environment variables only; `.env` is gitignored; no hardcoded secrets |
| **XSS Prevention** | React's built-in JSX escaping + explicit HTML tag stripping in sanitization layer |
| **Error Boundaries** | All API calls wrapped in try/catch with graceful fallback responses |

---

## ♿ Accessibility Features

- **Skip Navigation Link** — Hidden link to bypass header and jump to main content
- **ARIA Labels** — All interactive elements (buttons, cards, inputs) have descriptive `aria-label` attributes
- **Keyboard Navigation** — Portal cards support Enter/Space key activation with visible `focus:ring` indicators
- **Semantic HTML** — Proper use of `<header>`, `<main>`, `<nav>`, `<section>`, `<article>` landmarks
- **Screen Reader Support** — `role="button"`, `role="main"`, `role="banner"` attributes on key elements
- **Color Contrast** — High-contrast light theme with WCAG-compliant text-to-background ratios
- **Sensory Room Awareness** — In-app support for finding KultureCity sensory-friendly rooms

---

## 🧪 Testing

We use **Vitest** with **React Testing Library** for comprehensive testing:

```bash
npm run test     # Run all tests
npm run test:watch  # Watch mode
```

### Test Coverage (39 tests across 4 test suites):

| Suite | Tests | Coverage |
|-------|-------|----------|
| `sanitize.test.ts` | 7 | Input sanitization: XSS stripping, control chars, length limits, type safety |
| `mockData.test.ts` | 17 | Data integrity: unique IDs, valid categories, coordinate bounds, accessibility POIs |
| `gemini.test.ts` | 8 | AI heuristic categorization: keyword detection for all 5 incident categories |
| `App.test.tsx` | 7 | Component rendering, navigation, accessibility (skip-nav, ARIA, keyboard) |

---

## 🏗️ Project Structure

```
src/
├── App.tsx                    # Portal hub + routing
├── index.css                  # Design system (glassmorphism, animations)
├── main.tsx                   # React entry point
├── components/
│   └── StadiumMap.tsx         # Interactive SVG venue heatmap
├── context/
│   └── SimulationContext.tsx  # Global state (zones, incidents, transit)
├── data/
│   └── mockData.ts            # Stadium data (zones, POIs, transit, incidents)
├── services/
│   └── gemini.ts              # Gemini API integration + sanitization
├── views/
│   ├── FanView.tsx            # Fan wayfinding portal
│   ├── VolunteerView.tsx      # Volunteer task hub
│   ├── StaffView.tsx          # Staff security console
│   └── OrganizerView.tsx      # Command center dashboard
└── test/
    ├── setup.ts               # Vitest setup (jest-dom matchers)
    ├── App.test.tsx            # Component + accessibility tests
    ├── gemini.test.ts          # AI service tests
    ├── mockData.test.ts        # Data validation tests
    └── sanitize.test.ts        # Security tests
```

---

## 📦 Setup & Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/benayaram/FanPluse-AI.git
cd FanPluse-AI

# 2. Install dependencies
npm install

# 3. (Optional) Add your Gemini API key
echo "VITE_GEMINI_API_KEY=your-key-here" > .env

# 4. Start the development server
npm run dev

# 5. Run tests
npm run test
```

> **Note:** The app works fully without an API key using intelligent local fallback responses.

---

## 🔑 Assumptions Made

1. **Single-Stadium Scope:** The solution models MetLife Stadium (East Rutherford, NJ) as the host venue, with realistic gate names, section numbers, and transit options.
2. **Simulated Real-Time Data:** Since we don't have access to actual stadium IoT sensors, crowd densities and wait times are simulated with periodic randomized ticks (every 15 seconds) to demonstrate dynamic behavior.
3. **Role-Based Access:** In production, each persona would require authentication. For this hackathon demo, roles are accessed through the portal hub cards.
4. **Gemini Model:** Uses `gemini-3.1-flash-lite` for cost-effective, low-latency responses. The system gracefully degrades to local heuristics if the API is unavailable.

---

## 📄 License

MIT License — Built for the Google AI Hackathon 2026.
