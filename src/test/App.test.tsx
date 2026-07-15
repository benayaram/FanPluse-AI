import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock the Gemini service to avoid real API calls during tests
vi.mock('../services/gemini', () => ({
  askFanAssistant: vi.fn().mockResolvedValue('Mock fan response'),
  askVolunteerAssistant: vi.fn().mockResolvedValue('Mock volunteer response'),
  askOrganizerOps: vi.fn().mockResolvedValue('Mock ops response'),
  autoCategorizeIncident: vi.fn().mockResolvedValue({
    title: 'Test Incident',
    category: 'facilities',
    severity: 'low',
    aiSuggestedAction: 'Test action',
  }),
  quickTranslateText: vi.fn().mockResolvedValue('Translated text'),
  sanitizeInput: vi.fn((input: string) => input),
}));

describe('App Component', () => {
  it('renders the portal landing page with the correct title', () => {
    render(<App />);
    expect(screen.getByText('FanPulse AI')).toBeInTheDocument();
  });

  it('renders all four portal cards', () => {
    render(<App />);
    expect(screen.getByText('Fan Portal')).toBeInTheDocument();
    expect(screen.getByText('Volunteer Hub')).toBeInTheDocument();
    expect(screen.getByText('Staff Console')).toBeInTheDocument();
    expect(screen.getByText('Command Center')).toBeInTheDocument();
  });

  it('navigates to Fan Portal on card click', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const fanCard = screen.getByRole('button', { name: /Fan Portal/i });
    await user.click(fanCard);
    
    // After clicking, header should show Fan Portal badge  
    expect(screen.getByText('Fan Portal', { selector: 'span' })).toBeInTheDocument();
    // And the Back button should appear
    expect(screen.getByText('Back to Portal Hub')).toBeInTheDocument();
  });

  it('navigates back to portal hub when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Go to fan view
    await user.click(screen.getByRole('button', { name: /Fan Portal/i }));
    expect(screen.getByText('Back to Portal Hub')).toBeInTheDocument();
    
    // Go back
    await user.click(screen.getByLabelText('Go back to portal hub'));
    expect(screen.getByText('FanPulse AI')).toBeInTheDocument();
  });

  it('has skip navigation link for accessibility', () => {
    render(<App />);
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('portal cards are keyboard accessible', () => {
    render(<App />);
    const fanCard = screen.getByRole('button', { name: /Fan Portal/i });
    expect(fanCard).toHaveAttribute('tabIndex', '0');
    expect(fanCard).toHaveAttribute('role', 'button');
  });

  it('main content area has correct landmark role', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('id', 'main-content');
  });
});
