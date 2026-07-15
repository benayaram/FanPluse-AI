import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '../services/gemini';

describe('sanitizeInput', () => {
  it('strips HTML tags from user input', () => {
    const dirty = '<script>alert("xss")</script>Hello World';
    const result = sanitizeInput(dirty);
    expect(result).toBe('alert("xss")Hello World');
    expect(result).not.toContain('<script>');
  });

  it('strips control characters', () => {
    const input = 'Hello\x00\x01\x02World';
    expect(sanitizeInput(input)).toBe('HelloWorld');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('truncates to maxLength', () => {
    const long = 'a'.repeat(2000);
    expect(sanitizeInput(long, 100).length).toBe(100);
  });

  it('returns empty string for non-string input', () => {
    // @ts-expect-error testing runtime safety
    expect(sanitizeInput(null)).toBe('');
    // @ts-expect-error testing runtime safety
    expect(sanitizeInput(undefined)).toBe('');
    // @ts-expect-error testing runtime safety
    expect(sanitizeInput(42)).toBe('');
  });

  it('handles empty string input', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('preserves safe text with special characters', () => {
    expect(sanitizeInput('Where is Gate D? 🏟️')).toBe('Where is Gate D? 🏟️');
  });
});
