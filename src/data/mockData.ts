export interface POI {
  id: string;
  name: string;
  type: 'restroom' | 'concession' | 'medical' | 'sensory' | 'gate' | 'transit';
  location: string; // section number / gate name
  coordinates: { x: number; y: number }; // Percentage coordinate for SVG mapping
  isAccessible: boolean;
  waitMinutes?: number;
  tags: string[];
}

export interface TransitOption {
  id: string;
  name: string;
  type: 'train' | 'bus' | 'rideshare' | 'parking';
  status: 'normal' | 'delayed' | 'crowded' | 'suspended';
  statusDetails: string;
  etaMinutes: number;
  carbonKg: number;
  costEstimate: string;
}

export interface Incident {
  id: string;
  title: string;
  category: 'crowd' | 'medical' | 'security' | 'accessibility' | 'facilities';
  status: 'open' | 'assigned' | 'resolved';
  severity: 'low' | 'medium' | 'high';
  location: string;
  timestamp: string;
  description: string;
  assignedStaff?: string;
  aiSuggestedAction?: string;
}

export interface StadiumZone {
  id: string;
  name: string;
  crowdLevel: 'low' | 'medium' | 'high' | 'critical';
  densityPercentage: number; // 0-100
  scannerRate: number; // scans per minute
  waitMinutes: number;
}

export const STADIUM_ZONES: StadiumZone[] = [
  { id: 'gate-a', name: 'Gate A (MetLife)', crowdLevel: 'medium', densityPercentage: 45, scannerRate: 28, waitMinutes: 10 },
  { id: 'gate-b', name: 'Gate B (Verizon)', crowdLevel: 'low', densityPercentage: 20, scannerRate: 15, waitMinutes: 4 },
  { id: 'gate-c', name: 'Gate C (HCL)', crowdLevel: 'high', densityPercentage: 78, scannerRate: 45, waitMinutes: 22 },
  { id: 'gate-d', name: 'Gate D (Pepsi)', crowdLevel: 'critical', densityPercentage: 92, scannerRate: 55, waitMinutes: 35 },
  { id: 'concourse-n', name: 'North Concourse', crowdLevel: 'medium', densityPercentage: 55, scannerRate: 0, waitMinutes: 0 },
  { id: 'concourse-e', name: 'East Concourse', crowdLevel: 'high', densityPercentage: 80, scannerRate: 0, waitMinutes: 0 },
  { id: 'concourse-s', name: 'South Concourse', crowdLevel: 'medium', densityPercentage: 40, scannerRate: 0, waitMinutes: 0 },
  { id: 'concourse-w', name: 'West Concourse', crowdLevel: 'low', densityPercentage: 25, scannerRate: 0, waitMinutes: 0 },
];

export const STADIUM_POIS: POI[] = [
  { id: 'restroom-1', name: 'Accessible Restroom 117', type: 'restroom', location: 'Sec 117', coordinates: { x: 30, y: 25 }, isAccessible: true, tags: ['wheelchair', 'all-gender', 'changing-table'] },
  { id: 'restroom-2', name: 'Family Restroom 143', type: 'restroom', location: 'Sec 143', coordinates: { x: 70, y: 75 }, isAccessible: true, tags: ['family', 'wheelchair'] },
  { id: 'restroom-3', name: 'Restroom 109', type: 'restroom', location: 'Sec 109', coordinates: { x: 15, y: 55 }, isAccessible: false, waitMinutes: 8, tags: ['men', 'women'] },
  { id: 'restroom-4', name: 'Restroom 132', type: 'restroom', location: 'Sec 132', coordinates: { x: 85, y: 45 }, isAccessible: false, waitMinutes: 15, tags: ['men', 'women', 'crowded'] },
  
  { id: 'food-1', name: 'Green Bites (Vegan & Eco)', type: 'concession', location: 'Sec 108', coordinates: { x: 22, y: 65 }, isAccessible: true, waitMinutes: 2, tags: ['vegan', 'vegetarian', 'eco-friendly', 'halal-friendly'] },
  { id: 'food-2', name: 'Taco Fiesta', type: 'concession', location: 'Sec 131', coordinates: { x: 78, y: 35 }, isAccessible: true, waitMinutes: 12, tags: ['halal', 'mexican', 'spicy'] },
  { id: 'food-3', name: 'Burger & Co', type: 'concession', location: 'Sec 114', coordinates: { x: 42, y: 20 }, isAccessible: false, waitMinutes: 18, tags: ['burgers', 'fries', 'beer'] },
  { id: 'food-4', name: 'Pizza Palace', type: 'concession', location: 'Sec 140', coordinates: { x: 60, y: 80 }, isAccessible: true, waitMinutes: 5, tags: ['pizza', 'vegetarian'] },
  
  { id: 'medical-1', name: 'First Aid Station 103', type: 'medical', location: 'Sec 103', coordinates: { x: 10, y: 40 }, isAccessible: true, tags: ['cpr', 'emergency', 'wheelchair'] },
  { id: 'medical-2', name: 'First Aid Station 233', type: 'medical', location: 'Sec 233', coordinates: { x: 90, y: 60 }, isAccessible: true, tags: ['defibrillator', 'emergency'] },
  
  { id: 'sensory-1', name: 'Sensory-Friendly Room 128', type: 'sensory', location: 'Sec 128', coordinates: { x: 50, y: 15 }, isAccessible: true, tags: ['sensory', 'quiet', 'autism-friendly'] },
  { id: 'sensory-2', name: 'Quiet Space 204', type: 'sensory', location: 'Sec 204', coordinates: { x: 50, y: 85 }, isAccessible: true, tags: ['quiet', 'sensory'] },
  
  { id: 'gate-poi-a', name: 'Gate A Entryway', type: 'gate', location: 'Gate A', coordinates: { x: 10, y: 20 }, isAccessible: true, tags: ['entry', 'security', 'tickets'] },
  { id: 'gate-poi-b', name: 'Gate B Entryway', type: 'gate', location: 'Gate B', coordinates: { x: 90, y: 20 }, isAccessible: true, tags: ['entry', 'security'] },
  { id: 'gate-poi-c', name: 'Gate C Entryway', type: 'gate', location: 'Gate C', coordinates: { x: 90, y: 80 }, isAccessible: true, tags: ['entry', 'security'] },
  { id: 'gate-poi-d', name: 'Gate D Entryway', type: 'gate', location: 'Gate D', coordinates: { x: 10, y: 80 }, isAccessible: true, tags: ['entry', 'security', 'wheelchair-ramp'] },
];

export const INITIAL_TRANSIT_OPTIONS: TransitOption[] = [
  { id: 'transit-1', name: 'NJ Transit Meadowlands Rail Link', type: 'train', status: 'crowded', statusDetails: 'Trains running every 10 mins from Secaucus. High volume post-match.', etaMinutes: 12, carbonKg: 0.4, costEstimate: '$4.25' },
  { id: 'transit-2', name: 'Coach USA Express Bus (Port Authority)', type: 'bus', status: 'normal', statusDetails: 'Direct shuttle buses boarding at Lot K.', etaMinutes: 8, carbonKg: 0.9, costEstimate: '$14.00' },
  { id: 'transit-3', name: 'Rideshare (Uber/Lyft) Lot E', type: 'rideshare', status: 'delayed', statusDetails: 'Surge pricing active. Heavy traffic around Route 3. Wait times ~30 mins.', etaMinutes: 28, carbonKg: 4.8, costEstimate: '$45.00 - $65.00' },
  { id: 'transit-4', name: 'Gold Parking Lot (Permit Required)', type: 'parking', status: 'normal', statusDetails: 'Parking lot 85% full. Access via Route 120.', etaMinutes: 5, carbonKg: 5.4, costEstimate: '$40.00' },
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    title: 'Wheelchair Assistance Request',
    category: 'accessibility',
    status: 'assigned',
    severity: 'medium',
    location: 'Gate D (Pepsi)',
    timestamp: '19:45',
    description: 'Elderly fan requires assistance to Section 112. Wheelchair dispatch needed.',
    assignedStaff: 'Diego (Staff)',
    aiSuggestedAction: 'Dispatch Assistant #4 with wheelchair to Gate D. Direct route: Elevators to Level 1, corridor South.'
  },
  {
    id: 'inc-2',
    title: 'Gate D Crowd Bottleneck',
    category: 'crowd',
    status: 'open',
    severity: 'high',
    location: 'Gate D Outer Plaza',
    timestamp: '20:02',
    description: 'Ticket scanning terminal #3 offline. Entry queues backing up into parking lot. Flow rate dropped by 40%.',
    aiSuggestedAction: 'Activate warning banner in Fan App for Gate D users. Redirect incoming transit passengers to Gate A/B. Send IT support to Terminal #3.'
  },
  {
    id: 'inc-3',
    title: 'Spill reported on Concourse Level 1',
    category: 'facilities',
    status: 'resolved',
    severity: 'low',
    location: 'East Concourse near Section 122',
    timestamp: '19:20',
    description: 'Soda spill reported near restroom entryway.',
    assignedStaff: 'Janitorial Team 2',
    aiSuggestedAction: 'Clean spill to avoid slipping hazard. Put up warning signs.'
  }
];

export const VENUE_KNOWLEDGE_BASE = `
FANPULSE AI - METLIFE STADIUM KNOWLEDGE BASE (FIFA WORLD CUP 2026 EDITION)

STADIUM DETAILS:
- Venue: MetLife Stadium, East Rutherford, NJ.
- Capacity: 82,500.
- Host City details: Part of New York/New Jersey Host Region.
- Total Gates: 4 Main Gates.
  * Gate A (MetLife): North-West corner.
  * Gate B (Verizon): North-East corner.
  * Gate C (HCL): South-East corner.
  * Gate D (Pepsi): South-West corner. Wheelchair-accessible ramps and dedicated shuttle drop-off are here.

ACCESSIBILITY & INCLUSION:
- Step-free access is available at all gates. Gate D has the gentlest slope and closest proximity to ADA parking.
- Elevators: Located at Gate A, Gate C, and inside the VIP entrances.
- Sensory-Friendly Rooms: Provided by KultureCity. Located on the Plaza Level at Section 128 (West) and Upper Concourse Section 204 (East). Sensory bags containing noise-canceling headphones, fidget tools, and weighted lap pads are available at Guest Services Booths (Sections 124 and 224).
- Assistive Listening: Available at all Guest Services booths. Free of charge.
- Companion restrooms (all-gender, wheelchair-accessible): Section 104, 117, 128, 143, 204, 224, 303, 332.

SUSTAINABILITY RULES & GREEN INITIATIVES:
- MetLife Stadium is a zero-waste-to-landfill facility for FIFA 2026.
- Compostable packaging: All food items from official concessions are served in 100% compostable containers. Place them in GREEN composting bins.
- Recyclable plastic cups: Place in BLUE recycling bins.
- Water Refill Stations: Fans can bring an empty, clear plastic water bottle (up to 20 oz) and refill it at stations near Sections 101, 117, 129, 144, 202, 224.
- Sustainability Score (Green Score):
  * Commute by Train (NJ Transit): +50 Points.
  * Commute by Coach Bus: +30 Points.
  * Bringing reusable container / using refill station: +20 Points.
  * Composting/Recycling waste: +15 Points.
  * Eco-friendly food choice (Green Bites): +25 Points.

TRANSPORTATION & PARKING GUIDELINES:
- Train: NJ Transit Meadowlands Rail Link. Runs between Secaucus Junction and Meadowlands Station (stadium). Boarding begins immediately post-match. Composting cup / can is required before entering platform.
- Bus: Coach USA Express Bus. Departs from Port Authority Bus Terminal (NYC) directly to Lot K.
- Rideshare: Lot E (West of stadium). Expect heavy surge pricing and 30-45 min delays post-event.
- Bicycle Valet: Free bicycle parking is located near Lot A.

VOLUNTEER & STAFF POLICIES:
- Shift check-in: Volunteers check in at the Volunteer Center (located under the South Ramp near Gate C) 1 hour before gate opening.
- Uniform: Official green FIFA volunteer polo, khaki pants, credentials visible at all times.
- Escalation Protocol:
  * Minor issues (spills, trash, seating queries): Resolve locally or log in Staff App.
  * Medical emergencies: Call Medical Dispatch immediately or alert nearest Medical Station. Do not attempt to move an injured person.
  * Security breaches / arguments: Back away, do not engage. Alert Security Command via Staff Console or call Channel 1.
  * Accessibility support: Request companion assistance dispatch via Staff Console.
- Free translation: Volunteers can use the translation tool to support languages (Spanish, Portuguese, German, French, Japanese, Korean, Arabic, Hindi).
`;
