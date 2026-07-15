import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoCategorizeIncident } from '../services/gemini';

// We test the LOCAL heuristic categorization (when no API key is provided)
describe('autoCategorizeIncident — Local Heuristic Fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('categorizes wheelchair requests as accessibility', async () => {
    const result = await autoCategorizeIncident('', 'Elderly fan in wheelchair needs help at Gate D');
    expect(result.category).toBe('accessibility');
    expect(result.severity).toBe('medium');
  });

  it('categorizes fights as security incidents', async () => {
    const result = await autoCategorizeIncident('', 'Fight broke out near Section 200');
    expect(result.category).toBe('security');
    expect(result.severity).toBe('high');
  });

  it('categorizes injuries as medical emergencies', async () => {
    const result = await autoCategorizeIncident('', 'Fan fainted and is bleeding near concourse');
    expect(result.category).toBe('medical');
    expect(result.severity).toBe('high');
  });

  it('categorizes bottlenecks as crowd issues', async () => {
    const result = await autoCategorizeIncident('', 'Huge crowd bottleneck at the main entrance');
    expect(result.category).toBe('crowd');
    expect(result.severity).toBe('medium');
  });

  it('defaults to facilities for unrecognized descriptions', async () => {
    const result = await autoCategorizeIncident('', 'Lights flickering in section 300');
    expect(result.category).toBe('facilities');
    expect(result.severity).toBe('low');
  });

  it('returns all required fields for any description', async () => {
    const result = await autoCategorizeIncident('', 'Something happened');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('severity');
    expect(result).toHaveProperty('aiSuggestedAction');
    expect(typeof result.title).toBe('string');
    expect(typeof result.aiSuggestedAction).toBe('string');
  });

  it('handles ADA keyword detection', async () => {
    const result = await autoCategorizeIncident('', 'ADA accessibility ramp is blocked');
    expect(result.category).toBe('accessibility');
  });

  it('handles theft keyword detection', async () => {
    const result = await autoCategorizeIncident('', 'Someone stole a bag near Gate B');
    expect(result.category).toBe('security');
    expect(result.severity).toBe('high');
  });
});
