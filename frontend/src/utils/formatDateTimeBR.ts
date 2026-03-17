export const formatDateTimeBR = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(value)
      .replace(",", " -");
  }

  if (typeof value !== "string") {
    return String(value);
  }

  const rawValue = value.trim();
  if (!rawValue) {
    return "-";
  }

  const brDateMatch = rawValue.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s*-\s*(\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (brDateMatch) {
    const [, day, month, year, hour = "00", minute = "00", second = "00"] =
      brDateMatch;
    return `${day}/${month}/${year} - ${hour}:${minute}:${second}`;
  }

  const normalizedValue =
    rawValue.includes(" ") && !rawValue.includes("T")
      ? rawValue.replace(" ", "T")
      : rawValue;

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return rawValue;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(parsedDate)
    .replace(",", " -");
};
