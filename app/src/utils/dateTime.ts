export function mergeDatePart(current: Date, selectedDate: Date): Date {
  const next = new Date(current);
  next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  return next;
}

export function mergeTimePart(current: Date, selectedTime: Date): Date {
  const next = new Date(current);
  next.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
  return next;
}

/**
 * Fælles dato- og tidsformatering. Skærmene kalder disse i stedet for at
 * gentage `toLocaleTimeString`-kald med hver sit options-objekt, så samme
 * slags tidspunkt altid ser ens ud i hele appen.
 */

/** "09:30" */
export const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** "3. jun. 2026" */
export const formatShortDate = (date: Date) => date.toLocaleDateString([], { dateStyle: 'medium' });

/** "3. jun. 2026, 09.30" */
export const formatDateTime = (date: Date) =>
  date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

/** "onsdag 09.30" – bruges når ugedagen er vigtigere end datoen. */
export const formatWeekdayTime = (date: Date) =>
  date.toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });

/** "3. juni" */
export const formatDayMonth = (date: Date) =>
  date.toLocaleDateString([], { day: 'numeric', month: 'long' });

/** "3. juni 2026" */
export const formatLongDate = (date: Date) =>
  date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Formaterer en ISO-streng fra databasen. Falder tilbage til den rå streng,
 * hvis værdien ikke kan parses, så en dårlig række ikke vælter listen.
 */
export const formatIsoDate = (iso: string, format: (date: Date) => string = formatDayMonth) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : format(date);
};

/** Dansk hilsen der passer til tidspunktet på dagen. */
export function getGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return 'Godnat';
  if (hour < 11) return 'Godmorgen';
  if (hour < 18) return 'Goddag';
  return 'Godaften';
}

const pad = (value: number) => value.toString().padStart(2, '0');

/**
 * Formaterer en varighed som m:ss – fx en kaffes løbetid. Minuttallet får
 * ikke foranstillet nul, så "2:30" ser ud som på et brygskema.
 */
export function formatMinutesSeconds(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  return `${Math.floor(safeSeconds / 60)}:${pad(safeSeconds % 60)}`;
}

/**
 * Formaterer tiden indtil `target` som tt:mm:ss. Tidspunkter i fortiden
 * vises som 00:00:00 i stedet for at tælle negativt.
 */
export function formatCountdown(target: Date, now = new Date()): string {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return '00:00:00';

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
