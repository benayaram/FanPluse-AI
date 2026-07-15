import { describe, it, expect } from 'vitest';
import {
  STADIUM_ZONES,
  STADIUM_POIS,
  INITIAL_TRANSIT_OPTIONS,
  INITIAL_INCIDENTS,
} from '../data/mockData';
import type { StadiumZone, POI, TransitOption, Incident } from '../data/mockData';

describe('Mock Data Integrity', () => {
  describe('STADIUM_ZONES', () => {
    it('contains at least 4 zones (one per gate)', () => {
      expect(STADIUM_ZONES.length).toBeGreaterThanOrEqual(4);
    });

    it('each zone has required properties', () => {
      STADIUM_ZONES.forEach((zone: StadiumZone) => {
        expect(zone.id).toBeTruthy();
        expect(zone.name).toBeTruthy();
        expect(['low', 'medium', 'high', 'critical']).toContain(zone.crowdLevel);
        expect(zone.densityPercentage).toBeGreaterThanOrEqual(0);
        expect(zone.densityPercentage).toBeLessThanOrEqual(100);
        expect(zone.scannerRate).toBeGreaterThanOrEqual(0);
        expect(zone.waitMinutes).toBeGreaterThanOrEqual(0);
      });
    });

    it('each zone has a unique ID', () => {
      const ids = STADIUM_ZONES.map(z => z.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('STADIUM_POIS', () => {
    it('includes accessible restrooms', () => {
      const accessibleRestrooms = STADIUM_POIS.filter(
        (p: POI) => p.type === 'restroom' && p.isAccessible
      );
      expect(accessibleRestrooms.length).toBeGreaterThanOrEqual(1);
    });

    it('includes medical facilities', () => {
      const medical = STADIUM_POIS.filter((p: POI) => p.type === 'medical');
      expect(medical.length).toBeGreaterThanOrEqual(1);
    });

    it('includes sensory-friendly rooms', () => {
      const sensory = STADIUM_POIS.filter((p: POI) => p.type === 'sensory');
      expect(sensory.length).toBeGreaterThanOrEqual(1);
    });

    it('each POI has valid coordinates within SVG bounds (0-100)', () => {
      STADIUM_POIS.forEach((poi: POI) => {
        expect(poi.coordinates.x).toBeGreaterThanOrEqual(0);
        expect(poi.coordinates.x).toBeLessThanOrEqual(100);
        expect(poi.coordinates.y).toBeGreaterThanOrEqual(0);
        expect(poi.coordinates.y).toBeLessThanOrEqual(100);
      });
    });

    it('each POI has a non-empty tags array', () => {
      STADIUM_POIS.forEach((poi: POI) => {
        expect(Array.isArray(poi.tags)).toBe(true);
        expect(poi.tags.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('INITIAL_TRANSIT_OPTIONS', () => {
    it('contains at least 3 transport modes', () => {
      expect(INITIAL_TRANSIT_OPTIONS.length).toBeGreaterThanOrEqual(3);
    });

    it('includes train, bus, and rideshare options', () => {
      const types = INITIAL_TRANSIT_OPTIONS.map((t: TransitOption) => t.type);
      expect(types).toContain('train');
      expect(types).toContain('bus');
      expect(types).toContain('rideshare');
    });

    it('each option has positive carbon emissions value', () => {
      INITIAL_TRANSIT_OPTIONS.forEach((t: TransitOption) => {
        expect(t.carbonKg).toBeGreaterThan(0);
      });
    });

    it('each option has a cost estimate string', () => {
      INITIAL_TRANSIT_OPTIONS.forEach((t: TransitOption) => {
        expect(typeof t.costEstimate).toBe('string');
        expect(t.costEstimate.length).toBeGreaterThan(0);
      });
    });
  });

  describe('INITIAL_INCIDENTS', () => {
    it('contains at least one initial incident', () => {
      expect(INITIAL_INCIDENTS.length).toBeGreaterThanOrEqual(1);
    });

    it('each incident has valid category', () => {
      const validCategories = ['crowd', 'medical', 'security', 'accessibility', 'facilities'];
      INITIAL_INCIDENTS.forEach((inc: Incident) => {
        expect(validCategories).toContain(inc.category);
      });
    });

    it('each incident has valid severity', () => {
      INITIAL_INCIDENTS.forEach((inc: Incident) => {
        expect(['low', 'medium', 'high']).toContain(inc.severity);
      });
    });

    it('each incident has valid status', () => {
      INITIAL_INCIDENTS.forEach((inc: Incident) => {
        expect(['open', 'assigned', 'resolved']).toContain(inc.status);
      });
    });

    it('each incident has AI suggested action', () => {
      INITIAL_INCIDENTS.forEach((inc: Incident) => {
        expect(inc.aiSuggestedAction).toBeTruthy();
        expect(typeof inc.aiSuggestedAction).toBe('string');
      });
    });
  });
});
