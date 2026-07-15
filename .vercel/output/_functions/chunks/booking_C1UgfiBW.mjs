const TIMEZONE = "America/Toronto";
const OPEN_HOUR = 9;
const CLOSE_HOUR = 24;
const EARLY_END_HOUR = 16;
const MIN_LENGTH = 1;
const MAX_LENGTH = 6;
const CURRENCY = "cad";
const HOLD_MINUTES = 30;
const LENGTHS = Array.from(
  { length: MAX_LENGTH - MIN_LENGTH + 1 },
  (_, i) => MIN_LENGTH + i
);
function isValidLength(length) {
  return Number.isInteger(length) && length >= MIN_LENGTH && length <= MAX_LENGTH;
}
function possibleStartHours(length) {
  const out = [];
  for (let h = OPEN_HOUR; h <= CLOSE_HOUR - length; h++) out.push(h);
  return out;
}
function isValidStartHour(startHour, length) {
  return possibleStartHours(length).includes(startHour);
}
function isValidDateStr(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
function tzParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(get("minute"), 10);
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: hour + minute / 60
  };
}
function studioNow(now = /* @__PURE__ */ new Date()) {
  return tzParts(now);
}
function formatHour(hour) {
  const h = (hour % 24 + 24) % 24 | 0;
  const period = h < 12 ? "AM" : "PM";
  let display = h % 12;
  if (display === 0) display = 12;
  return `${display}:00 ${period}`;
}

export { CURRENCY as C, EARLY_END_HOUR as E, HOLD_MINUTES as H, LENGTHS as L, OPEN_HOUR as O, TIMEZONE as T, isValidLength as a, isValidStartHour as b, CLOSE_HOUR as c, formatHour as f, isValidDateStr as i, possibleStartHours as p, studioNow as s, tzParts as t };
