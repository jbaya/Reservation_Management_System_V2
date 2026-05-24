// Resolves the correct rate for a booking based on agent + season + category
// Returns { rate, extraPersonRate, source: 'agent'|'season'|'default' }
export function resolveRate({ travelAgentRates, seasons, agent, category, arrival, departure, baseRate }) {
  if (!agent || !travelAgentRates?.length) return { rate: baseRate || 0, extraPersonRate: 0, source: 'default' };

  const agentRates = travelAgentRates.filter(r => r.agentId === agent.id && r.category === category);
  if (!agentRates.length) return { rate: baseRate || 0, extraPersonRate: 0, source: 'default' };

  // Try to match a season
  const arrDate = new Date(arrival);
  const matchedSeason = seasons?.find(s =>
    new Date(s.startDate) <= arrDate && new Date(s.endDate) >= arrDate
  );

  const seasonalRate = matchedSeason
    ? agentRates.find(r => r.seasonId === matchedSeason.id)
    : null;

  const offSeasonRate = agentRates.find(r => !r.seasonId || r.seasonId === 'off');

  const resolved = seasonalRate || offSeasonRate || agentRates[0];

  return {
    rate: resolved.ratePerNight ?? 0,
    extraPersonRate: resolved.extraPersonRate ?? 0,
    source: 'agent',
    agentName: agent.name,
    seasonName: matchedSeason?.name || 'Off-Season',
    rateId: resolved.id,
  };
}

// Calculates totals for a booking
export function calcTotals({ arrival, departure, rate, extraPersonRate, occupancy = 1, extraPersons = 0, advanceParticulars = 0 }) {
  const nights = Math.max(1, Math.round((new Date(departure) - new Date(arrival)) / 86400000));
  const roomTotal = rate * nights;
  const extraTotal = extraPersonRate * extraPersons * nights;
  const totalAmount = roomTotal + extraTotal;
  const balance = Math.max(0, totalAmount - (Number(advanceParticulars) || 0));
  return { nights, roomTotal, extraTotal, totalAmount, balance };
}