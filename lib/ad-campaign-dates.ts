const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidAdCampaignDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function adCampaignEndDate(startsOn: string, months: number): string | null {
  if (!isValidAdCampaignDate(startsOn) || !Number.isInteger(months) || months < 1) return null;

  const start = new Date(`${startsOn}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + months);
  end.setUTCDate(end.getUTCDate() - 1);
  return end.toISOString().slice(0, 10);
}
