import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeTravelScrubBar from '../components/TimeTravelScrubBar';
import { useProfileStore } from '../stores/profileStore';

describe('TimeTravelScrubBar (Event Sourcing & Career Scrubbing R3)', () => {
  const initialBaseProfile = {
    age: 38,
    income: 90000,
    monthly_investment: 1200,
    num_children: 2,
    has_property: true,
    property_price: 380000,
    retirement_age: 67
  };

  beforeEach(() => {
    useProfileStore.setState({
      profile: { ...initialBaseProfile },
      scenarioOverrides: {}
    });
  });

  it('renders with Live Present Head active by default', () => {
    render(<TimeTravelScrubBar />);

    expect(screen.getByTestId('time-travel-scrub-bar')).toBeInTheDocument();
    expect(screen.getByText(/LIVE PRESENT HEAD \(ACTIVE\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Household Profile Head/i)).toBeInTheDocument();
  });

  it('scrubs to a historical career milestone and drives previewScenario without mutating primary profile', () => {
    render(<TimeTravelScrubBar />);

    const slider = screen.getByTestId('time-travel-slider');

    // Scrub to Milestone 0 (Career Entry Age 26, Junior Software Engineer)
    fireEvent.change(slider, { target: { value: '0' } });

    // Confirm UI indicates Time-Travel mode
    expect(screen.getByText(/TIME-TRAVEL PREVIEW \(HEAD PROTECTED\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Junior Software Engineer/i)).toBeInTheDocument();

    // Verify scenarioOverrides were populated with the replayed milestone state
    const currentOverrides = useProfileStore.getState().scenarioOverrides;
    expect(currentOverrides.age).toBe(26);
    expect(currentOverrides.income).toBe(48000);
    expect(currentOverrides.monthly_investment).toBe(300);

    // CRITICAL INTEGRITY CHECK: The primary profile (database head) must NOT be mutated!
    const activeHeadProfile = useProfileStore.getState().profile;
    expect(activeHeadProfile.age).toBe(38);
    expect(activeHeadProfile.income).toBe(90000);
    expect(activeHeadProfile.monthly_investment).toBe(1200);
  });

  it('updates live micro-gauges (tax zone, wealth velocity, Rentenlücke) during scrub', () => {
    render(<TimeTravelScrubBar />);

    const slider = screen.getByTestId('time-travel-slider');

    // Scrub to Milestone 4 (Staff Leadership Age 39, income €105k)
    fireEvent.change(slider, { target: { value: '4' } });

    expect(screen.getByText(/Staff Architect & bAV Activation/i)).toBeInTheDocument();
    
    // Live tax bracket reflects highest tariff bracket for €105k
    const taxBadge = screen.getByTestId('live-tax-bracket');
    expect(taxBadge.textContent).toBe('42.0%');

    // Live wealth velocity reflects €1,400/mo
    const velocityBadge = screen.getByTestId('live-wealth-velocity');
    expect(velocityBadge.textContent).toContain('1.400');
  });

  it('returns to live head and clears scenario overrides when clicking Return to Live Head', () => {
    render(<TimeTravelScrubBar />);

    const slider = screen.getByTestId('time-travel-slider');

    // Scrub to Milestone 1
    fireEvent.change(slider, { target: { value: '1' } });
    expect(useProfileStore.getState().scenarioOverrides.income).toBe(72000);

    // Click Return to Live Head button
    const returnBtn = screen.getByRole('button', { name: /return to live head/i });
    fireEvent.click(returnBtn);

    // Confirm state restored to live present head
    expect(screen.getByText(/LIVE PRESENT HEAD \(ACTIVE\)/i)).toBeInTheDocument();
    expect(useProfileStore.getState().scenarioOverrides).toEqual({});
  });
});
