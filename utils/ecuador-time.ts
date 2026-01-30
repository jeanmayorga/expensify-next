import { toZonedTime, fromZonedTime, format } from "date-fns-tz";

const ECUADOR_TIMEZONE = "America/Guayaquil";

export function getEcuadorDate(date?: Date | string): Date {
  const now = date ? new Date(date) : new Date();
  const zonedDate = toZonedTime(now, ECUADOR_TIMEZONE);

  return zonedDate;
}

/**
 * Converts a UTC date to a datetime-local string in Ecuador timezone
 * Used for displaying dates in form inputs
 * @param date - UTC date (from DB or new Date())
 * @returns string in format "YYYY-MM-DDTHH:mm" in Ecuador time
 */
export function toEcuadorDateTimeLocal(date?: Date | string): string {
  const inputDate = date ? new Date(date) : new Date();
  // format with timeZone option directly converts to that timezone
  return format(inputDate, "yyyy-MM-dd'T'HH:mm", {
    timeZone: ECUADOR_TIMEZONE,
  });
}

/**
 * Converts a datetime-local string (assumed to be Ecuador time) to UTC ISO string
 * Used for sending dates to the server
 * @param dateTimeLocal - string in format "YYYY-MM-DDTHH:mm" in Ecuador time
 * @returns ISO UTC string
 */
export function fromEcuadorDateTimeLocalToUTC(dateTimeLocal: string): string {
  // Parse the datetime-local string as Ecuador time and convert to UTC
  const utcDate = fromZonedTime(dateTimeLocal, ECUADOR_TIMEZONE);
  return utcDate.toISOString();
}
