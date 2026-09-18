// Domain: Business Hours - Structured Mon-Sun, multiple intervals, holidays, overnight, timezone
// Never hardcoded isOpen, per point 15

export interface BusinessHours {
  id?: string;
  shopId: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ... 6=Sat
  openTime: string | null; // HH:MM
  closeTime: string | null; // HH:MM
  isClosed: boolean;
  isOvernight: boolean;
  sortOrder: number;
}

export interface Holiday {
  id?: string;
  shopId: string;
  date: Date;
  name?: string | null;
  isWeekly: boolean;
  isClosed: boolean;
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Invalid time format ${time}, expected HH:MM`);
  }
  return h * 60 + m;
}

export function isShopOpen(
  businessHours: BusinessHours[],
  holidays: Holiday[],
  timezone: string = 'Asia/Kolkata',
  now: Date = new Date()
): boolean {
  // Check holiday first
  const todayStr = now.toISOString().split('T')[0];
  const todayHoliday = holidays.find(h => {
    const hDateStr = new Date(h.date).toISOString().split('T')[0];
    return hDateStr === todayStr && h.isClosed;
  });
  if (todayHoliday) return false;

  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  // Multiple intervals per day per point 15
  const todayHours = businessHours
    .filter(bh => bh.dayOfWeek === day && !bh.isClosed)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (todayHours.length === 0) return false;

  for (const bh of todayHours) {
    if (!bh.openTime || !bh.closeTime) continue;
    try {
      const openMinutes = parseTimeToMinutes(bh.openTime);
      const closeMinutes = parseTimeToMinutes(bh.closeTime);

      if (bh.isOvernight) {
        // Overnight: 20:00-02:00
        if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) return true;
      } else {
        if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

export function getNextOpenTime(
  businessHours: BusinessHours[],
  holidays: Holiday[],
  timezone: string = 'Asia/Kolkata',
  from: Date = new Date()
): Date | null {
  // Find next open time within 7 days
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(from);
    checkDate.setDate(from.getDate() + i);
    const day = checkDate.getDay();

    const todayHoliday = holidays.find(h => {
      const hDateStr = new Date(h.date).toISOString().split('T')[0];
      const checkStr = checkDate.toISOString().split('T')[0];
      return hDateStr === checkStr && h.isClosed;
    });
    if (todayHoliday) continue;

    const dayHours = businessHours
      .filter(bh => bh.dayOfWeek === day && !bh.isClosed && bh.openTime)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (dayHours.length > 0) {
      const firstOpen = dayHours[0];
      const [h, m] = firstOpen.openTime!.split(':').map(Number);
      checkDate.setHours(h, m, 0, 0);
      if (checkDate > from) return checkDate;
      if (i > 0) return checkDate;
    }
  }

  return null;
}

export function formatBusinessHours(businessHours: BusinessHours[]): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const grouped: Record<number, BusinessHours[]> = {};

  for (const bh of businessHours) {
    if (!grouped[bh.dayOfWeek]) grouped[bh.dayOfWeek] = [];
    grouped[bh.dayOfWeek].push(bh);
  }

  const parts: string[] = [];
  for (let day = 0; day < 7; day++) {
    const dayHours = grouped[day];
    if (!dayHours || dayHours.length === 0) {
      parts.push(`${days[day]}: Closed`);
    } else {
      const intervals = dayHours
        .filter(bh => !bh.isClosed && bh.openTime && bh.closeTime)
        .map(bh => `${bh.openTime}-${bh.closeTime}${bh.isOvernight ? ' (overnight)' : ''}`)
        .join(', ');
      parts.push(`${days[day]}: ${intervals || 'Closed'}`);
    }
  }

  return parts.join(' | ');
}

export function validateBusinessHours(businessHours: BusinessHours[]): void {
  for (const bh of businessHours) {
    if (bh.dayOfWeek < 0 || bh.dayOfWeek > 6) throw new Error(`Invalid dayOfWeek ${bh.dayOfWeek}`);
    if (!bh.isClosed) {
      if (!bh.openTime || !bh.closeTime) throw new Error(`Open/close time required if not closed for day ${bh.dayOfWeek}`);
      parseTimeToMinutes(bh.openTime);
      parseTimeToMinutes(bh.closeTime);
    }
  }
}
