import '@testing-library/jest-dom/vitest';

// Mock scrollIntoView for jsdom (not supported natively)
Element.prototype.scrollIntoView = () => {};
