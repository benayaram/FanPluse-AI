import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import type { POI, StadiumZone } from '../data/mockData';

interface StadiumMapProps {
  onPoiClick?: (poi: POI) => void;
  onZoneClick?: (zone: StadiumZone) => void;
  highlightedPoiId?: string;
  showHeatmap?: boolean;
  interactive?: boolean;
}

export const StadiumMap: React.FC<StadiumMapProps> = ({ 
  onPoiClick, 
  onZoneClick, 
  highlightedPoiId, 
  showHeatmap = true,
  interactive = true
}) => {
  const { zones, pois, incidents } = useSimulation();
  const [hoveredItem, setHoveredItem] = useState<{
    name: string;
    details: string;
    x: number;
    y: number;
  } | null>(null);

  // Helper to map crowd status to tailwind classes/colors
  const getZoneColor = (zone: StadiumZone) => {
    if (!showHeatmap) return 'fill-slate-800 stroke-slate-700';
    switch (zone.crowdLevel) {
      case 'low': return 'fill-emerald-950/70 hover:fill-emerald-900/80 stroke-emerald-500/50';
      case 'medium': return 'fill-amber-950/70 hover:fill-amber-900/80 stroke-amber-500/50';
      case 'high': return 'fill-orange-950/80 hover:fill-orange-900/90 stroke-orange-500/50';
      case 'critical': return 'fill-red-950/90 hover:fill-red-900/100 stroke-red-500/50 animate-pulse-slow';
      default: return 'fill-slate-800 stroke-slate-700';
    }
  };

  const getPoiColor = (poi: POI) => {
    const isHighlighted = highlightedPoiId === poi.id;
    if (isHighlighted) return 'bg-fifa-gold border-white scale-125 shadow-[0_0_15px_rgba(197,160,89,1)]';
    
    switch (poi.type) {
      case 'restroom': return poi.isAccessible ? 'bg-indigo-600 border-indigo-300' : 'bg-slate-600 border-slate-400';
      case 'concession': return poi.tags.includes('vegan') ? 'bg-emerald-600 border-emerald-300' : 'bg-amber-600 border-amber-300';
      case 'medical': return 'bg-rose-600 border-rose-300';
      case 'sensory': return 'bg-cyan-500 border-cyan-200';
      case 'gate': return 'bg-blue-600 border-blue-300';
      default: return 'bg-slate-500 border-slate-300';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<any>, name: string, details: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItem({
      name,
      details,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 45
    });
  };

  return (
    <div className="relative w-full h-full bg-[#03050c] border border-fifa-border rounded-2xl overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Map Legend */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10 text-[10px] bg-slate-950/80 p-2 rounded-lg border border-fifa-border max-w-[90%]">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> <span>Low Flow</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span> <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> <span>Critical</span>
        </div>
        <div className="h-3 w-[1px] bg-slate-800 mx-1"></div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span> <span>ADA Restroom</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span> <span>Sensory Rm</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span> <span>Eco Food</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> <span>Medical</span>
        </div>
      </div>

      <div className="relative w-full aspect-[4/3] max-w-lg select-none">
        {/* Stadium SVG */}
        <svg 
          viewBox="0 0 400 300" 
          className="w-full h-full"
        >
          {/* outer perimeter ring */}
          <ellipse cx="200" cy="150" rx="190" ry="140" className="fill-transparent stroke-slate-800 stroke-[4] stroke-dasharray-[5]" />

          {/* Stadium Stands Sections - 4 quadrants representing Concourse Zones */}
          {/* North Concourse (top) */}
          <path 
            d="M 50 100 A 180 120 0 0 1 350 100 L 290 125 A 110 70 0 0 0 110 125 Z" 
            className={`${getZoneColor(zones[4])} transition-colors duration-300 stroke-[1.5] cursor-pointer`}
            onClick={() => interactive && onZoneClick && onZoneClick(zones[4])}
            onMouseMove={(e) => handleMouseMove(e, zones[4].name, `Density: ${zones[4].densityPercentage}% | Status: ${zones[4].crowdLevel.toUpperCase()}`)}
            onMouseLeave={() => setHoveredItem(null)}
          />

          {/* East Concourse (right) */}
          <path 
            d="M 350 100 A 180 120 0 0 1 350 200 L 290 175 A 110 70 0 0 0 290 125 Z" 
            className={`${getZoneColor(zones[5])} transition-colors duration-300 stroke-[1.5] cursor-pointer`}
            onClick={() => interactive && onZoneClick && onZoneClick(zones[5])}
            onMouseMove={(e) => handleMouseMove(e, zones[5].name, `Density: ${zones[5].densityPercentage}% | Status: ${zones[5].crowdLevel.toUpperCase()}`)}
            onMouseLeave={() => setHoveredItem(null)}
          />

          {/* South Concourse (bottom) */}
          <path 
            d="M 350 200 A 180 120 0 0 1 50 200 L 110 175 A 110 70 0 0 0 290 175 Z" 
            className={`${getZoneColor(zones[6])} transition-colors duration-300 stroke-[1.5] cursor-pointer`}
            onClick={() => interactive && onZoneClick && onZoneClick(zones[6])}
            onMouseMove={(e) => handleMouseMove(e, zones[6].name, `Density: ${zones[6].densityPercentage}% | Status: ${zones[6].crowdLevel.toUpperCase()}`)}
            onMouseLeave={() => setHoveredItem(null)}
          />

          {/* West Concourse (left) */}
          <path 
            d="M 50 200 A 180 120 0 0 1 50 100 L 110 125 A 110 70 0 0 0 110 175 Z" 
            className={`${getZoneColor(zones[7])} transition-colors duration-300 stroke-[1.5] cursor-pointer`}
            onClick={() => interactive && onZoneClick && onZoneClick(zones[7])}
            onMouseMove={(e) => handleMouseMove(e, zones[7].name, `Density: ${zones[7].densityPercentage}% | Status: ${zones[7].crowdLevel.toUpperCase()}`)}
            onMouseLeave={() => setHoveredItem(null)}
          />

          {/* Inner Stadium Oval (Field Outline) */}
          <ellipse cx="200" cy="150" rx="90" ry="55" className="fill-[#1b3a24]/90 stroke-emerald-500 stroke-[2]" />
          
          {/* Soccer pitch lines */}
          <rect x="140" y="115" width="120" height="70" className="fill-transparent stroke-emerald-100/30 stroke-[1.5]" />
          <line x1="200" y1="115" x2="200" y2="185" className="stroke-emerald-100/30 stroke-[1.5]" />
          <circle cx="200" cy="150" r="15" className="fill-transparent stroke-emerald-100/30 stroke-[1.5]" />

          {/* Main Gates (outer points) */}
          {/* Gate A (Top Left) */}
          <g 
            onClick={() => interactive && onZoneClick && onZoneClick(zones[0])}
            onMouseMove={(e) => handleMouseMove(e, zones[0].name, `Queue wait: ${zones[0].waitMinutes} mins | Entry Rate: ${zones[0].scannerRate} scans/min`)}
            onMouseLeave={() => setHoveredItem(null)}
            className="cursor-pointer group"
          >
            <circle cx="65" cy="80" r="14" className={`${getZoneColor(zones[0])} stroke-[2] transition-all`} />
            <text x="65" y="84" textAnchor="middle" className="fill-slate-100 text-[10px] font-bold pointer-events-none">A</text>
          </g>

          {/* Gate B (Top Right) */}
          <g 
            onClick={() => interactive && onZoneClick && onZoneClick(zones[1])}
            onMouseMove={(e) => handleMouseMove(e, zones[1].name, `Queue wait: ${zones[1].waitMinutes} mins | Entry Rate: ${zones[1].scannerRate} scans/min`)}
            onMouseLeave={() => setHoveredItem(null)}
            className="cursor-pointer group"
          >
            <circle cx="335" cy="80" r="14" className={`${getZoneColor(zones[1])} stroke-[2] transition-all`} />
            <text x="335" y="84" textAnchor="middle" className="fill-slate-100 text-[10px] font-bold pointer-events-none">B</text>
          </g>

          {/* Gate C (Bottom Right) */}
          <g 
            onClick={() => interactive && onZoneClick && onZoneClick(zones[2])}
            onMouseMove={(e) => handleMouseMove(e, zones[2].name, `Queue wait: ${zones[2].waitMinutes} mins | Entry Rate: ${zones[2].scannerRate} scans/min`)}
            onMouseLeave={() => setHoveredItem(null)}
            className="cursor-pointer group"
          >
            <circle cx="335" cy="220" r="14" className={`${getZoneColor(zones[2])} stroke-[2] transition-all`} />
            <text x="335" y="224" textAnchor="middle" className="fill-slate-100 text-[10px] font-bold pointer-events-none">C</text>
          </g>

          {/* Gate D (Bottom Left) */}
          <g 
            onClick={() => interactive && onZoneClick && onZoneClick(zones[3])}
            onMouseMove={(e) => handleMouseMove(e, zones[3].name, `Queue wait: ${zones[3].waitMinutes} mins | Entry Rate: ${zones[3].scannerRate} scans/min`)}
            onMouseLeave={() => setHoveredItem(null)}
            className="cursor-pointer group"
          >
            <circle cx="65" cy="220" r="14" className={`${getZoneColor(zones[3])} stroke-[2] transition-all`} />
            <text x="65" y="224" textAnchor="middle" className="fill-slate-100 text-[10px] font-bold pointer-events-none">D</text>
          </g>
        </svg>

        {/* POI Markers overlay using relative coordinates */}
        {pois.map((poi) => (
          <button
            key={poi.id}
            onClick={() => interactive && onPoiClick && onPoiClick(poi)}
            onMouseMove={(e) => {
              const details = poi.type === 'concession' && poi.waitMinutes !== undefined
                ? `Wait: ${poi.waitMinutes} mins | ${poi.location} | Tags: ${poi.tags.join(', ')}`
                : `${poi.location} | Features: ${poi.tags.join(', ')}`;
              handleMouseMove(e, poi.name, details);
            }}
            onMouseLeave={() => setHoveredItem(null)}
            style={{ 
              left: `${poi.coordinates.x}%`, 
              top: `${poi.coordinates.y}%` 
            }}
            className={`absolute w-3.5 h-3.5 rounded-full border stroke-none -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 flex items-center justify-center transition-all ${getPoiColor(poi)}`}
          >
            <span className="sr-only">{poi.name}</span>
          </button>
        ))}

        {/* Active Incidents overlays */}
        {incidents.filter(inc => inc.status !== 'resolved').map(inc => {
          // Determine rough coordinate based on location
          let coords = { x: 50, y: 50 };
          const locLower = inc.location.toLowerCase();
          if (locLower.includes('gate a')) coords = { x: 18, y: 32 };
          else if (locLower.includes('gate b')) coords = { x: 82, y: 32 };
          else if (locLower.includes('gate c')) coords = { x: 82, y: 68 };
          else if (locLower.includes('gate d')) coords = { x: 18, y: 68 };
          else if (locLower.includes('north')) coords = { x: 50, y: 35 };
          else if (locLower.includes('east')) coords = { x: 75, y: 50 };
          else if (locLower.includes('south')) coords = { x: 50, y: 65 };
          else if (locLower.includes('west')) coords = { x: 25, y: 50 };

          return (
            <div
              key={inc.id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer animate-ping pointer-events-none w-6 h-6 rounded-full border ${
                inc.severity === 'high' ? 'bg-red-500 border-red-200' : 'bg-amber-500 border-amber-200'
              }`}
            />
          );
        })}
      </div>

      {/* Tooltip render */}
      {hoveredItem && (
        <div 
          style={{ left: hoveredItem.x, top: hoveredItem.y }}
          className="absolute pointer-events-none z-50 glass-premium text-[11px] p-2 rounded-lg max-w-[200px]"
        >
          <div className="font-bold text-fifa-gold">{hoveredItem.name}</div>
          <div className="text-slate-300 mt-0.5">{hoveredItem.details}</div>
        </div>
      )}

      {/* Map Interactive note */}
      {interactive && (
        <div className="text-[10px] text-slate-400 mt-2 italic text-center">
          💡 Click gates or POIs to inquire or center in the Fan App.
        </div>
      )}
    </div>
  );
};
