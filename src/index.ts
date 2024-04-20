export interface Interval {
  start: Date;
  end: Date;
}

export function tzScan(tz: string, interval: Interval) {
  const changes: any[] = [];
  const date = new Date(interval.start);
  date.setUTCSeconds(0, 0);
  const endDate = new Date(interval.end);
  endDate.setUTCSeconds(0, 0);
  const endTime = +endDate;

  const { format } = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour12: false,
  });

  let lastValues = formatToValues(format(date));
  let lastOffset = calcOffset(lastValues, date);
  while (+date < endTime) {
    date.setUTCHours(date.getUTCHours() + 1);

    const values = formatToValues(format(date));
    const offset = calcOffset(values, date);

    if (offset != lastOffset) {
      changes.push({
        date: new Date(date),
        change: offset - lastOffset,
        offset,
      });
    }

    lastValues = values;
    lastOffset = offset;
  }

  return changes;
}

const formatCache: Record<string, Intl.DateTimeFormat["format"]> = {};

export function tzOffset(tz: string, date: Date) {
  const format = (formatCache[tz] ||= new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "numeric",
    timeZoneName: "longOffset",
  }).format);
  const [hours, minutes] = format(date).slice(6).split(":").map(Number);
  return hours! * 60 + minutes!;
}

function calcOffset(values: DateValues, date: Date) {
  return (Date.UTC(...values) - +date) / 60000;
}

type DateValues = [number, number, number, number, number];

function formatToValues(formatResult: string): DateValues {
  const [month, day, year, hours, minutes] = formatResult
    .match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+)/)
    ?.slice(1)
    .map(Number) as DateValues;
  return [year, month - 1, day, hours === 24 ? 0 : hours, minutes];
}
