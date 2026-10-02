// The calendar year the model treats as "now": it labels year 1 of every
// projection and is the reference for a used car's age. This module is the only
// place that reads the clock. Domain functions take the year as a parameter that
// defaults to currentYear(), so tests can pin it while the UI uses the real one.

/** The current calendar year, from the system clock. */
export const currentYear = () => new Date().getFullYear();

/** Calendar year of projection year `n` (1-based) when "now" is `year`. */
export const projectionYear = (n, year = currentYear()) => year + n - 1;
