export function formatCurrency(amount: number): string {
  // Handle invalid numbers gracefully
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "$0";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Safely parses a date string and returns a Date object
 * Returns null if the date is invalid
 */
function parseDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== "string") {
    return null;
  }
  const date = new Date(dateString);
  // Check if date is valid (Invalid Date has NaN as time value)
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function formatDate(dateString: string): string {
  const date = parseDate(dateString);
  if (!date) {
    return "Invalid date";
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  const date = parseDate(dateString);
  if (!date) {
    return "Invalid date";
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Returns a relative time string (e.g., "2 hours ago", "yesterday", "3 days ago")
 * Falls back to formatted date for older dates
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseDate(dateString);
  if (!date) {
    return "Invalid date";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Just now (less than a minute)
  if (diffSeconds < 60) {
    return "just now";
  }

  // Minutes ago
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  }

  // Hours ago
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  // Yesterday
  if (diffDays === 1) {
    return "yesterday";
  }

  // Days ago (up to 7 days)
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  // Weeks ago (up to 4 weeks)
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }

  // Fall back to formatted date for older dates
  return formatDate(dateString);
}

/**
 * Formats a date for input fields (YYYY-MM-DD format)
 */
export function formatDateForInput(dateString: string): string {
  const date = parseDate(dateString);
  if (!date) {
    return "";
  }
  return date.toISOString().split("T")[0];
}

/**
 * Formats hours as a human-readable string
 * e.g., 1.5 => "1h 30m", 0.25 => "15m"
 */
export function formatHours(hours: number): string {
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours < 0) {
    return "0m";
  }

  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) {
    return `${m}m`;
  }

  if (m === 0) {
    return `${h}h`;
  }

  return `${h}h ${m}m`;
}

/**
 * Formats a number with thousand separators
 */
export function formatNumber(num: number): string {
  if (typeof num !== "number" || !Number.isFinite(num)) {
    return "0";
  }
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Formats a percentage with optional decimal places
 */
export function formatPercent(value: number, decimals: number = 0): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0%";
  }
  return `${value.toFixed(decimals)}%`;
}
