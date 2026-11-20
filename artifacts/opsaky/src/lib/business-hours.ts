import { BUSINESS_DAYS, type BusinessHours } from "./model";

const WEEKDAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone.trim()) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function validClockTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function isValidBusinessHours(schedule: BusinessHours, timeZone: string): boolean {
  return isValidTimeZone(timeZone) && BUSINESS_DAYS.every(({ id }) => {
    const day = schedule[id];
    return Boolean(day && (day.closed || (validClockTime(day.open) && validClockTime(day.close))));
  });
}

export function getBusinessStatus(
  schedule: BusinessHours,
  timeZone: string,
  now: Date = new Date(),
): { isOpen: boolean; hoursText: string; valid: boolean } {
  if (!isValidBusinessHours(schedule, timeZone) || Number.isNaN(now.getTime())) {
    return { isOpen: false, hoursText: "Hours unavailable", valid: false };
  }

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const weekday = parts.find((part) => part.type === "weekday")?.value;
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);
    const dayIndex = WEEKDAY_KEYS.indexOf(weekday as typeof WEEKDAY_KEYS[number]);
    if (dayIndex < 0 || !Number.isFinite(hour) || !Number.isFinite(minute)) {
      return { isOpen: false, hoursText: "Hours unavailable", valid: false };
    }

    const today = schedule[BUSINESS_DAYS[dayIndex]!.id];
    const previous = schedule[BUSINESS_DAYS[(dayIndex + 6) % 7]!.id];
    const currentMinutes = (hour % 24) * 60 + minute;
    const openAt = minutesOfDay(today.open);
    const closeAt = minutesOfDay(today.close);
    let isOpen = false;

    if (!today.closed && openAt !== closeAt) {
      isOpen = openAt < closeAt
        ? currentMinutes >= openAt && currentMinutes < closeAt
        : currentMinutes >= openAt;
    }
    if (!isOpen && !previous.closed) {
      const previousOpenAt = minutesOfDay(previous.open);
      const previousCloseAt = minutesOfDay(previous.close);
      isOpen = previousOpenAt > previousCloseAt && currentMinutes < previousCloseAt;
    }
    const previousCloseAt = minutesOfDay(previous.close);
    const stillOpenFromYesterday = isOpen && !previous.closed
      && minutesOfDay(previous.open) > previousCloseAt && currentMinutes < previousCloseAt;

    return {
      isOpen,
      hoursText: stillOpenFromYesterday ? `Open until ${previous.close}` : today.closed ? "Closed today" : `${today.open}–${today.close}`,
      valid: true,
    };
  } catch {
    return { isOpen: false, hoursText: "Hours unavailable", valid: false };
  }
}
