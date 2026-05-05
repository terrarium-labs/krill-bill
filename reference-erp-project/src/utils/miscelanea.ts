import i18n from "@/lib/i18n";
import { COUNTRIES } from "./countries";
import { TableFilters } from "@/types/general/filters";
import { InvoiceItem } from "@/types/invoices/invoices";
import { Location } from "@/types/general/location";
import { cn } from "@/lib/utils";

const DEBUG = process.env.NODE_ENV === "development";

const formatCurrency = (amount: number, currency: string = "EUR"): string => {
  return new Intl.NumberFormat(i18n.language, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatPercentage = (amount: number): string => {
  return new Intl.NumberFormat(i18n.language, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a number with locale-aware decimals (e.g. 1,5 in de vs 1.5 in en).
 */
const formatDecimal = (
  value: number,
  options?: { minFractionDigits?: number; maxFractionDigits?: number }
): string => {
  const min = options?.minFractionDigits ?? 2;
  const max = options?.maxFractionDigits ?? 2;
  return new Intl.NumberFormat(i18n.language, {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(value);
};

const formatAddress = (location: Location) => {
  if (!location) return null;
  const addressParts = [
    location.address_line_1,
    location.address_line_2,
    location.postal_code,
    location.city,
    location.state_province,
    location.country
  ].filter(Boolean);

  return addressParts.length > 0 ? addressParts.join(', ') : null;
};

const formatDate = (date: any, { showTime = true, showSeconds = false, showDay = true, showMonth = true, showYear = true, useUTC = false, showDayName = false, showMonthName = false }: { showTime?: boolean, showSeconds?: boolean, showDay?: boolean, showMonth?: boolean, showYear?: boolean, useUTC?: boolean, showDayName?: boolean, showMonthName?: boolean } = { showTime: true, showSeconds: false, showDay: true, showMonth: true, showYear: true, useUTC: false, showDayName: false, showMonthName: false }): string => {
  // date is in milliseconds e.g. 1740428287000
  const dateObject = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
  };
  if (showDay) {
    options.day = "2-digit";
  }
  if (showMonth) {
    options.month = "short";
  }
  if (showMonthName) {
    options.month = "long";
  }
  if (showDayName) {
    options.weekday = "long";
  }
  if (showYear) {
    options.year = "numeric";
  }
  if (showTime) {
    options.hour = "numeric";
    options.minute = "2-digit";
    showSeconds && (options.second = "2-digit");
  }
  // If useUTC is true, use UTC timezone to prevent local timezone conversion
  if (useUTC) {
    options.timeZone = "UTC";
  }
  return Intl.DateTimeFormat(i18n.language, options).format(dateObject);
};

const formatTime = (
  date: number | string | Date,
  { showSeconds = false, useUTC = false }: { showSeconds?: boolean, useUTC?: boolean } = {}
): string => {
  const dateObject = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
  };
  if (showSeconds) {
    options.second = "numeric";
  }
  // If useUTC is true, use UTC timezone to prevent local timezone conversion
  if (useUTC) {
    options.timeZone = "UTC";
  }
  return dateObject.toLocaleTimeString(i18n.language, options);
};

/**
 * Format time as HH:MM (24-hour, zero-padded) for timeline bars.
 */
const formatTimeHHMM = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
};

/**
 * Relative time label for a date (e.g. "just now", "5m ago", "2h ago", "3d ago").
 * Uses i18n for "just now" and "ago" when available.
 */
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const justNow = typeof i18n?.t === "function" ? i18n.t("common.justNow", "just now") : "just now";
  const ago = typeof i18n?.t === "function" ? i18n.t("common.ago", "ago") : "ago";
  if (diffMins < 1) return justNow;
  if (diffMins < 60) return `${diffMins}m ${ago}`;
  if (diffHours < 24) return `${diffHours}h ${ago}`;
  return `${diffDays}d ${ago}`;
};

/**
 * Date range for display (tables/modals): time range inline when not whole-day,
 * or date-only when 00:00–23:59:59. Same format as absences/time-records table "Date" column.
 * @param startStr - ISO start datetime
 * @param endStr - ISO end datetime (or same as start for single instant)
 * @param options.useUTC - use UTC for formatting (default true)
 * @param options.dateOnly - if true, always show date range without timestamps
 */
const formatDateRange = (
  startStr: string,
  endStr: string,
  options?: { useUTC?: boolean; dateOnly?: boolean }
): string => {
  const useUTC = options?.useUTC !== false;
  const dateOnly = options?.dateOnly === true;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()))
    return "-";
  const sh = start.getUTCHours(),
    smin = start.getUTCMinutes(),
    ss = start.getUTCSeconds();
  const eh = end.getUTCHours(),
    emin = end.getUTCMinutes(),
    es = end.getUTCSeconds();
  const isWholeDay =
    sh === 0 && smin === 0 && ss === 0 && eh === 23 && emin === 59 && es === 59;
  const sd = start.getUTCDate(),
    sm = start.getUTCMonth(),
    sy = start.getUTCFullYear();
  const ed = end.getUTCDate(),
    em = end.getUTCMonth(),
    ey = end.getUTCFullYear();
  const sameDay = sy === ey && sm === em && sd === ed;
  const sameMonth = sy === ey && sm === em;
  const opts = useUTC ? { useUTC: true as const } : { useUTC: false as const };
  const dateOnlyOpts = { showTime: false, showYear: false, ...opts };
  const short = (d: Date) =>
    formatDate(d, { ...dateOnlyOpts, showDay: true, showMonth: true });
  const dateTimeOpts = {
    showDay: true,
    showMonth: true,
    showYear: false,
    showTime: true,
    ...opts,
  };
  if (dateOnly || isWholeDay) {
    if (sameDay) return short(start);
    if (sameMonth) {
      const monthPart = formatDate(start, {
        ...dateOnlyOpts,
        showDay: false,
        showMonth: true,
      });
      return `${monthPart} ${sd} - ${ed}`;
    }
    return `${short(start)} - ${short(end)}`;
  }
  if (sameDay) {
    return `${formatDate(start, dateTimeOpts)} - ${formatTime(end, opts)}`;
  }
  // Different days with time - check if same month to avoid duplicate month names
  if (sameMonth) {
    const monthPart = formatDate(start, {
      ...dateOnlyOpts,
      showDay: false,
      showMonth: true,
    });
    const startTime = formatTime(start, opts);
    const endDayTime = `${ed}, ${formatTime(end, opts)}`;
    return `${monthPart} ${sd}, ${startTime} - ${endDayTime}`;
  }
  return `${formatDate(start, dateTimeOpts)} - ${formatDate(end, dateTimeOpts)}`;
};

// Check if a day is in the future
const isFutureDay = (dayString: string): boolean => {
  const dayDate = new Date(dayString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dayDate.setHours(0, 0, 0, 0);
  return dayDate > today;
};

// Check if a date is in the current month
const isCurrentMonth = (date: Date): boolean => {
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

// Helper function to get first day of a month
const getFirstDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Helper function to get last day of a month
const getLastDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""
    }`.toUpperCase();
};

/**
 * Parse a YYYY-MM-DD string as a local date (avoids UTC interpretation)
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Parsed Date object using local timezone
 */
const parseLocalDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format a date for API requests. Uses local date components to avoid timezone issues.
 * @param date - The date to format. If undefined, returns undefined.
 * @param includeTime - Controls how much of the timestamp to include:
 *   - undefined: date only (YYYY-MM-DD)
 *   - "start": date with start of day (YYYY-MM-DDT00:00:00)
 *   - "end": date with end of day (YYYY-MM-DDT23:59:59)
 *   - "year": year only (YYYY)
 *   - "month": year and month (YYYY-MM)
 *   - "day": date only, same as undefined (YYYY-MM-DD)
 *   - "hour": date and hour (YYYY-MM-DDTHH:00:00)
 *   - "minute": date, hour and minute (YYYY-MM-DDTHH:MM:00)
 *   - "second": date, hour, minute and second (YYYY-MM-DDTHH:MM:SS)
 *   - "ms": full timestamp with milliseconds (YYYY-MM-DDTHH:MM:SS.mmmZ)
 * @returns Formatted date string or undefined if date is undefined
 *
 * NOTE: This function uses 4 declarations (3 overloads + 1 implementation) for proper TypeScript type narrowing:
 *   1. (Date) → string: When you definitely have a Date
 *   2. (undefined) → undefined: When you definitely have undefined
 *   3. (Date | undefined) → string | undefined: When the variable could be either (e.g., selectedDate?: Date)
 *   4. Implementation: The actual function body
 * All 3 overloads are necessary. Without overload #3, passing a variable typed as `Date | undefined`
 * would fail to match either overload #1 or #2, forcing verbose ternary checks like:
 *   `selectedDate ? formatDateForAPI(selectedDate) : undefined`
 */

type DateFormatOptions = "start" | "end" | "year" | "month" | "day" | "hour" | "minute" | "second" | "ms";

function formatDateForAPI(
  date: Date,
  includeTime?: DateFormatOptions
): string;
function formatDateForAPI(
  date: undefined,
  includeTime?: DateFormatOptions
): undefined;
function formatDateForAPI(
  date: Date | undefined,
  includeTime?: DateFormatOptions
): string | undefined;
function formatDateForAPI(
  date: Date | undefined,
  includeTime?: DateFormatOptions
): string | undefined {
  if (!date) return undefined;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");

  switch (includeTime) {
    case "year":
      return `${year}`;
    case "month":
      return `${year}-${month}`;
    case "day":
      return `${year}-${month}-${day}`;
    case "start":
      return `${year}-${month}-${day}T00:00:00`;
    case "end":
      return `${year}-${month}-${day}T23:59:59`;
    case "hour":
      return `${year}-${month}-${day}T${hours}:00:00`;
    case "minute":
      return `${year}-${month}-${day}T${hours}:${minutes}:00`;
    case "second":
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    case "ms":
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
    default:
      return `${year}-${month}-${day}`;
  }
}

const formatDateLog = (date: number | string | Date): string => {
  const dateObject = new Date(date);
  const day = dateObject.getDate().toString().padStart(2, "0");
  const month = (dateObject.getMonth() + 1).toString().padStart(2, "0");
  const hours = dateObject.getHours().toString().padStart(2, "0");
  const minutes = dateObject.getMinutes().toString().padStart(2, "0");
  const seconds = dateObject.getSeconds().toString().padStart(2, "0");

  return `${day}/${month} ${hours}:${minutes}:${seconds}`;
};

const formatSize = (size: number): string => {
  if (!size) return `${formatDecimal(0)} B`;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = 0;
  let sizeNumber = size;
  while (sizeNumber >= 1024 && index < units.length - 1) {
    sizeNumber /= 1024;
    index++;
  }
  return `${formatDecimal(sizeNumber)} ${units[index]}`;
};

const getFileIcon = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  switch (extension) {
    case "pdf":
      return "proicons:pdf";
    case "doc":
    case "docx":
      return "file-icons:microsoft-word";
    case "xls":
    case "xlsx":
    case "csv":
      return "file-icons:microsoft-excel";
    case "ppt":
    case "pptx":
      return "file-icons:microsoft-powerpoint";
    case "json":
      return "si:json-duotone";
    case "png":
    case "jpg":
    case "jpeg":
      return "solar:album-linear";
    default:
      return "solar:file-linear";
  }
};

// Get file extension from filename
const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

// Helper to convert text-* color class to bg-* color class
const textColorToBgColor = (textColor: string): string => {
  return textColor.replace('text-', 'bg-');
};

// Get file type and icon info based on extension
const getFileTypeInfo = (fileName: string): { icon: string; color: string; label: string } => {
  const ext = getFileExtension(fileName);
  const textColor = getColorByExtension(fileName);
  const bgColor = textColorToBgColor(textColor);

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return {
      icon: "teenyicons:image-outline",
      color: bgColor,
      label: ext.toUpperCase()
    };
  }

  // PDF
  if (['pdf'].includes(ext)) {
    return {
      icon: "proicons:pdf",
      color: bgColor,
      label: ext.toUpperCase()
    };
  }

  // Documents
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
    return {
      icon: "teenyicons:ms-word-outline",
      color: bgColor,
      label: ext.toUpperCase()
    };
  }

  // Video
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
    return {
      icon: "lucide:play",
      color: bgColor,
      label: ext.toUpperCase()
    };
  }

  // Audio
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) {
    return {
      icon: "lucide:play",
      color: bgColor,
      label: ext.toUpperCase()
    };
  }

  // Code (including xlsx, xls, csv)
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'css', 'html', 'json', 'xml', 'xlsx', 'xls', 'csv'].includes(ext)) {
    return {
      icon: "proicons:code-square",
      color: bgColor,
      label: ext.toUpperCase()
    };
  }

  // Default
  return {
    icon: "proicons:file",
    color: bgColor,
    label: ext ? ext.toUpperCase() : 'FILE'
  };
};

const getColorByExtension = (fileName: string): string => {
  const extension = getFileExtension(fileName);
  switch (extension) {
    case "pdf":
      return "text-red-500";
    case "doc":
    case "docx":
      return "text-blue-600";
    case "xls":
    case "xlsx":
    case "csv":
      return "text-green-600";
    case "ppt":
    case "pptx":
      return "text-orange-600";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
      return "text-purple-500";
    case "zip":
    case "rar":
    case "7z":
      return "text-gray-600";
    case "txt":
      return "text-gray-700";
    case "json":
      return "text-yellow-600";
    default:
      return "text-gray-500";
  }
};

// Generate a beautiful, consistent color from a string
const getColorFromString = (str: string): string => {
  // Simple hash function to get a consistent number from the string
  let hash = 0;
  if (!str) return "#3B82F6";
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use the hash to pick from a predefined set of beautiful colors
  // These colors are carefully chosen to be visually appealing and accessible
  const colors = [
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#8B5CF6", // Violet
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#06B6D4", // Cyan
    "#84CC16", // Lime
    "#F97316", // Orange
    "#EC4899", // Pink
    "#6366F1", // Indigo
    "#14B8A6", // Teal
    "#A855F7", // Purple
    "#22C55E", // Green
    "#F472B6", // Hot Pink
    "#8B5A2B", // Brown
    "#6B7280", // Gray
    "#DC2626", // Dark Red
    "#059669", // Dark Green
    "#7C3AED", // Dark Violet
    "#D97706", // Dark Orange
  ];

  // Use the absolute value of the hash to pick a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const safeNavigateBack = (navigate: any, orgId: string) => {
  if (window.history.length > 1 && window.history.state?.idx > 0) {
    navigate(-1);
  } else {
    navigate(`/${orgId}`);
  }
};

// Spanish provinces for the select
const SPANISH_PROVINCES = [
  "A Coruña",
  "Álava",
  "Albacete",
  "Alicante",
  "Almería",
  "Asturias",
  "Ávila",
  "Badajoz",
  "Baleares",
  "Barcelona",
  "Burgos",
  "Cáceres",
  "Cádiz",
  "Cantabria",
  "Castellón",
  "Ciudad Real",
  "Córdoba",
  "Cuenca",
  "Girona",
  "Granada",
  "Guadalajara",
  "Guipúzcoa",
  "Huelva",
  "Huesca",
  "Jaén",
  "La Rioja",
  "Las Palmas",
  "León",
  "Lleida",
  "Lugo",
  "Madrid",
  "Málaga",
  "Murcia",
  "Navarra",
  "Ourense",
  "Palencia",
  "Pontevedra",
  "Salamanca",
  "Santa Cruz de Tenerife",
  "Segovia",
  "Sevilla",
  "Soria",
  "Tarragona",
  "Teruel",
  "Toledo",
  "Valencia",
  "Valladolid",
  "Vizcaya",
  "Zamora",
  "Zaragoza",
];

const TAX_CODE_TYPES = [
  { country: "ES", type: "ES VAT" },
  { country: "ES", type: "ES CIF" },
];

export const LIST_COLORS = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "slate",
  "gray",
  "zinc",
  "stone",
];

export const RATES_COLORS = [
  "green",
  "blue",
  "purple",
  "orange",
  "red",
  "yellow",
  "pink",
  "orange",
  "red"
];

/**
 * Returns Tailwind stroke classes for a "painted" look (visible stroke/border color, not text).
 * Use for SVG strokes (e.g. progress arcs) so the arc looks filled/bordered, not text-colored.
 */
const getStrokeColorClasses = (colorToUse: string) => {
  if (colorToUse === "primary") return "stroke-primary";
  const strokeMap: Record<string, string> = {
    "red": "stroke-red-500 dark:stroke-red-400",
    "orange": "stroke-orange-500 dark:stroke-orange-400",
    "amber": "stroke-amber-500 dark:stroke-amber-400",
    "yellow": "stroke-yellow-500 dark:stroke-yellow-400",
    "lime": "stroke-lime-500 dark:stroke-lime-400",
    "green": "stroke-green-500 dark:stroke-green-400",
    "emerald": "stroke-emerald-500 dark:stroke-emerald-400",
    "teal": "stroke-teal-500 dark:stroke-teal-400",
    "cyan": "stroke-cyan-500 dark:stroke-cyan-400",
    "sky": "stroke-sky-500 dark:stroke-sky-400",
    "blue": "stroke-blue-500 dark:stroke-blue-400",
    "indigo": "stroke-indigo-500 dark:stroke-indigo-400",
    "violet": "stroke-violet-500 dark:stroke-violet-400",
    "purple": "stroke-purple-500 dark:stroke-purple-400",
    "fuchsia": "stroke-fuchsia-500 dark:stroke-fuchsia-400",
    "pink": "stroke-pink-500 dark:stroke-pink-400",
    "rose": "stroke-rose-500 dark:stroke-rose-400",
    "slate": "stroke-slate-500 dark:stroke-slate-400",
    "gray": "stroke-gray-500 dark:stroke-gray-400",
    "zinc": "stroke-zinc-500 dark:stroke-zinc-400",
    "stone": "stroke-stone-500 dark:stroke-stone-400",
    "hotpink": "stroke-hotpink-500 dark:stroke-hotpink-400",
    "brown": "stroke-brown-500 dark:stroke-brown-400",
    "darkred": "stroke-darkred-500 dark:stroke-darkred-400",
    "darkgreen": "stroke-darkgreen-500 dark:stroke-darkgreen-400",
    "darkviolet": "stroke-darkviolet-500 dark:stroke-darkviolet-400",
    "darkorange": "stroke-darkorange-500 dark:stroke-darkorange-400",
  };
  return strokeMap[colorToUse] || "stroke-gray-500 dark:stroke-gray-400";
};

const getTextColorClasses = (colorToUse: string) => {
  if (colorToUse === "primary") return "text-primary";
  const textColorMap: Record<string, string> = {
    "red": "text-red-900 dark:text-red-100",
    "orange": "text-orange-900 dark:text-orange-100",
    "amber": "text-amber-900 dark:text-amber-100",
    "yellow": "text-yellow-900 dark:text-yellow-100",
    "lime": "text-lime-900 dark:text-lime-100",
    "green": "text-green-900 dark:text-green-100",
    "emerald": "text-emerald-900 dark:text-emerald-100",
    "teal": "text-teal-900 dark:text-teal-100",
    "cyan": "text-cyan-900 dark:text-cyan-100",
    "hotpink": "text-hotpink-900 dark:text-hotpink-100",
    "brown": "text-brown-900 dark:text-brown-100",
    "darkred": "text-darkred-900 dark:text-darkred-100",
    "darkgreen": "text-darkgreen-900 dark:text-darkgreen-100",
    "darkviolet": "text-darkviolet-900 dark:text-darkviolet-100",
    "darkorange": "text-darkorange-900 dark:text-darkorange-100",
    "sky": "text-sky-900 dark:text-sky-100",
    "blue": "text-blue-900 dark:text-blue-100",
    "indigo": "text-indigo-900 dark:text-indigo-100",
    "violet": "text-violet-900 dark:text-violet-100",
    "purple": "text-purple-900 dark:text-purple-100",
    "fuchsia": "text-fuchsia-900 dark:text-fuchsia-100",
    "pink": "text-pink-900 dark:text-pink-100",
    "rose": "text-rose-900 dark:text-rose-100",
    "slate": "text-slate-900 dark:text-slate-100",
    "gray": "text-gray-900 dark:text-gray-100",
    "zinc": "text-zinc-900 dark:text-zinc-100",
    "stone": "text-stone-900 dark:text-stone-100",
  };
  return textColorMap[colorToUse] || "text-gray-900 dark:text-gray-100";
};

const getBgColorClasses = (colorToUse: string) => {
  if (colorToUse === "primary") return "bg-primary/20";
  const bgColorMap: Record<string, string> = {
    "red": "bg-red-500/10",
    "orange": "bg-orange-500/10",
    "amber": "bg-amber-500/10",
    "yellow": "bg-yellow-500/10",
    "lime": "bg-lime-500/10",
    "green": "bg-green-500/10",
    "emerald": "bg-emerald-500/10",
    "teal": "bg-teal-500/10",
    "cyan": "bg-cyan-500/10",
    "sky": "bg-sky-500/10",
    "blue": "bg-blue-500/10",
    "indigo": "bg-indigo-500/10",
    "violet": "bg-violet-500/10",
    "purple": "bg-purple-500/10",
    "fuchsia": "bg-fuchsia-500/10",
    "pink": "bg-pink-500/10",
    "rose": "bg-rose-500/10",
    "slate": "bg-slate-500/10",
    "gray": "bg-gray-500/10",
    "zinc": "bg-zinc-500/10",
    "stone": "bg-stone-500/10",
    "hotpink": "bg-hotpink-500/10",
    "brown": "bg-brown-500/10",
    "darkred": "bg-darkred-500/10",
    "darkgreen": "bg-darkgreen-500/10",
    "darkviolet": "bg-darkviolet-500/10",
    "darkorange": "bg-darkorange-500/10",
  };
  return bgColorMap[colorToUse] || "bg-gray-500/10";
};

const getBorderColorClasses = (colorToUse: string) => {
  if (colorToUse === "primary") return "border-primary";
  const borderColorMap: Record<string, string> = {
    "red": "border-red-500/40",
    "orange": "border-orange-500/40",
    "amber": "border-amber-500/40",
    "yellow": "border-yellow-500/40",
    "lime": "border-lime-500/40",
    "green": "border-green-500/40",
    "emerald": "border-emerald-500/40",
    "teal": "border-teal-500/40",
    "cyan": "border-cyan-500/40",
    "sky": "border-sky-500/40",
    "blue": "border-blue-500/40",
    "indigo": "border-indigo-500/40",
    "violet": "border-violet-500/40",
    "purple": "border-purple-500/40",
    "fuchsia": "border-fuchsia-500/40",
    "pink": "border-pink-500/40",
    "rose": "border-rose-500/40",
    "slate": "border-slate-500/40",
    "gray": "border-gray-500/40",
    "zinc": "border-zinc-500/40",
    "stone": "border-stone-500/40",
    "hotpink": "border-hotpink-500/40",
    "brown": "border-brown-500/40",
    "darkred": "border-darkred-500/40",
    "darkgreen": "border-darkgreen-500/40",
    "darkviolet": "border-darkviolet-500/40",
    "darkorange": "border-darkorange-500/40",
  };
  return borderColorMap[colorToUse] || "border-gray-500/40";
};


const getColorClasses = (color: string, hide?: "text" | "txt" | "border" | "background" | "bg") => {
  const parts: string[] = [];
  const colorToUse = color.toLowerCase();
  if (hide !== "background" && hide !== "bg") {
    parts.push(getBgColorClasses(colorToUse));
  }
  if (hide !== "border") {
    parts.push(getBorderColorClasses(colorToUse));
  }
  if (hide !== "text" && hide !== "txt" && colorToUse !== "gray") {
    parts.push(getTextColorClasses(colorToUse));
  }
  return cn(parts);
};

const getCountryCode = (countryValue: string): string => {
  if (!countryValue) return "ES";
  // Si ya es un código válido
  if (COUNTRIES.some((c) => c.code === countryValue)) return countryValue;
  // Buscar por nombre (case-insensitive)
  const found = COUNTRIES.find(
    (c) => c.name.toLowerCase() === countryValue.toLowerCase()
  );
  return found ? found.code : "ES";
};

const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case "EUR":
      return "€";
    case "USD":
      return "$";
  }
  return currency;
};

// Format measure
const formatMeasure = (measure?: string | null) => {
  if (!measure) return "-";
  const measureMap: Record<string, string> = {
    "cm": "cm",
    "m": "m",
    "kg": "kg",
    "g": "g",
    "l": "L",
    "ml": "mL",
    "uts": "units"
  };
  return measureMap[measure] || measure;
};

// Format distance in kilometers
const formatDistance = (distance?: number | null): string => {
  if (!distance || distance <= 0) return "-";

  // If less than 1 km, show in meters
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }

  // Otherwise show in kilometers with 1 decimal
  return `${formatDecimal(distance, { minFractionDigits: 1, maxFractionDigits: 1 })} km`;
};

// Format time to travel in minutes
const formatTimeToTravel = (timeInMinutes?: number | null): string => {
  if (!timeInMinutes || timeInMinutes <= 0) return "-";

  // If less than 60 minutes, show in minutes
  if (timeInMinutes < 60) {
    return `${Math.round(timeInMinutes)} min`;
  }

  // Otherwise show in hours and minutes
  const hours = Math.floor(timeInMinutes / 60);
  const minutes = Math.round(timeInMinutes % 60);

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
};

const formatTimeDelta = (timeDelta: number): string => {
  if (!timeDelta) return '0 ms';
  const diffMs = timeDelta;

  // 0-999 ms -> show milliseconds
  if (diffMs < 1000) {
    return `${Math.round(diffMs)} ms`;
  }

  // 999ms - 180s -> show seconds
  if (diffMs < 180000) {
    return `${formatDecimal(diffMs / 1000, { minFractionDigits: 1, maxFractionDigits: 1 })} s`;
  }

  // More than 180s -> show minutes
  return `${formatDecimal(diffMs / 60000, { minFractionDigits: 1, maxFractionDigits: 1 })} min`;
};

const calculateParams = (params: TableFilters): string => {
  const paramsObject = {
    global_operator: params.global_operator || "AND",
    filters: params.filters,
    order_by: params.order_by,
  };
  return btoa(JSON.stringify(paramsObject));
};

// Convert camelCase to snake_case
const camelToSnake = (key: string): string =>
  key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// Convert camelCase to snake_case for all keys in an object
function keysToSnakeCase<T extends Record<string, any>>(
  obj: T
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      camelToSnake(key),
      value,
    ])
  );
}

// Replace placeholders in a string with values from an object
function replacePlaceholders(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return key in values ? String(values[key]) : `{{${key}}}`;
  });
}
// Function to generate next document number from pattern and last number
const generateNextDocumentNumber = (pattern: string, lastNumber: number = 0): string => {
  if (!pattern) return "";

  const now = new Date();
  let result = pattern;

  // Replace date placeholders
  result = result.replace(/\[YYYY\]/g, now.getFullYear().toString());
  result = result.replace(/\[YY\]/g, now.getFullYear().toString().slice(-2));
  result = result.replace(/\[MM\]/g, (now.getMonth() + 1).toString().padStart(2, '0'));
  result = result.replace(/\[DD\]/g, now.getDate().toString().padStart(2, '0'));

  // Replace % sequence with next number
  const percentMatch = result.match(/%+/);
  if (percentMatch) {
    const numDigits = percentMatch[0].length;
    const nextNumber = lastNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(numDigits, '0');
    result = result.replace(/%+/, paddedNumber);
  }

  return result;
};

// Format item price with currency, units, and billing period
const formatItemPrice = (
  price: {
    price_quantity?: number | null;
    price_currency?: string | null;
    billing_type?: string;
    billing_period?: string | null;
  },
  measure?: string | null
): string => {
  if (!price || price.price_quantity === null || price.price_quantity === undefined) {
    return "-";
  }

  const currency = price.price_currency || "EUR";
  const amount = price.price_quantity;

  // Format the amount using Intl for proper currency formatting
  const formattedAmount = new Intl.NumberFormat(i18n.language, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  // Format measure unit
  let measureUnit = "";
  if (measure) {
    const measureMap: Record<string, string> = {
      "cm": "cm",
      "m": "m",
      "kg": "kg",
      "g": "g",
      "l": "L",
      "ml": "mL",
      "uts": "ud",
      "pcs": "pcs",
      "hrs": "h"
    };
    measureUnit = ` / ${measureMap[measure] || measure}`;
  }

  // Build the price string with measure
  let priceString = formattedAmount + measureUnit;

  // If it's a one-off payment, return with measure only
  if (price.billing_type === "one-off" || !price.billing_period) {
    return priceString;
  }

  // For recurring payments, add the period
  const periodMap: Record<string, Record<string, string>> = {
    "en": {
      "daily": "day",
      "weekly": "week",
      "monthly": "month",
      "yearly": "year",
    },
    "es": {
      "daily": "día",
      "weekly": "semana",
      "monthly": "mes",
      "yearly": "año",
    },
    "ca": {
      "daily": "dia",
      "weekly": "setmana",
      "monthly": "mes",
      "yearly": "any",
    }
  };

  const currentLang = i18n.language || "en";
  const langPeriods = periodMap[currentLang] || periodMap["en"];
  const period = price.billing_period ? langPeriods[price.billing_period] || price.billing_period : "";

  if (period) {
    return `${priceString} / ${period}`;
  }

  return priceString;
};

/**
 * Calculate header line values from its children (recursively includes nested headers)
 * Headers aggregate values from all child items and child headers
 */
const calculateHeaderLineValues = (
  headerLine: InvoiceItem,
  allLines: InvoiceItem[],
  itemDiscountEnabled: boolean
): {
  quantity: number;
  price: number;
  discount: number;
  taxesAmount: number;
  total: number;
  costPrice: number | null;
  margin: number | null;
} => {
  // Find all direct children of this header (both items and sub-headers)
  // Match by ID if header has one, otherwise match by temporary ID based on order
  const headerId = headerLine.id || `temp-${headerLine.order}`;
  const directChildren = allLines.filter(
    line => line.parent?.id === headerId
  );

  // Separate headers and items
  const childHeaders = directChildren.filter(line => line.is_header);
  const childItems = directChildren.filter(line => !line.is_header);

  // For nested headers, get all items recursively
  const allItems: InvoiceItem[] = [...childItems];

  // Get all items from nested header recursively
  const getNestedItems = (header: InvoiceItem): InvoiceItem[] => {
    const hId = header.id || `temp-${header.order}`;
    const children = allLines.filter(line => line.parent?.id === hId);
    const items = children.filter(line => !line.is_header);
    const headers = children.filter(line => line.is_header);
    return [...items, ...headers.flatMap(getNestedItems)];
  };

  childHeaders.forEach(childHeader => {
    allItems.push(...getNestedItems(childHeader));
  });

  // Now calculate from all items (including from nested headers)
  const children = allItems;

  if (children.length === 0) {
    return {
      quantity: 0,
      price: 0,
      discount: 0,
      taxesAmount: 0,
      total: 0,
      costPrice: null,
      margin: null,
    };
  }

  // Calculate totals from children
  let totalQuantity = 0;
  let subtotalBeforeDiscount = 0;
  let totalDiscount = 0;
  let taxesAmount = 0;
  let grandTotal = 0;
  let totalCost = 0;
  let hasCostPrice = false;

  children.forEach(child => {
    const quantity = child.quantity ?? 0;
    const price = child.price ?? 0;
    const discount = itemDiscountEnabled ? (child.discount ?? 0) : 0;

    const itemSubtotal = quantity * price;
    const itemDiscountAmount = itemSubtotal * (discount / 100);
    const itemSubtotalAfterDiscount = itemSubtotal - itemDiscountAmount;

    // Calculate taxes for this item
    const taxRate = child.taxes?.reduce((sum, tax) =>
      sum + (tax.is_negative ? -tax.amount : tax.amount), 0
    ) || 0;
    const itemTaxAmount = itemSubtotalAfterDiscount * (taxRate / 100);
    const itemTotal = itemSubtotalAfterDiscount + itemTaxAmount;

    totalQuantity += quantity;
    subtotalBeforeDiscount += itemSubtotal;
    totalDiscount += itemDiscountAmount;
    taxesAmount += itemTaxAmount;
    grandTotal += itemTotal;

    // Accumulate cost price
    if (child.cost_price != null) {
      hasCostPrice = true;
      totalCost += child.cost_price * quantity;
    }
  });

  // Calculate average price (weighted by quantity)
  const averagePrice = totalQuantity > 0 ? subtotalBeforeDiscount / totalQuantity : 0;

  // Calculate average discount percentage
  const averageDiscount = subtotalBeforeDiscount > 0
    ? (totalDiscount / subtotalBeforeDiscount) * 100
    : 0;

  // Calculate cost price and margin
  const costPrice = hasCostPrice ? parseFloat(totalCost.toFixed(2)) : null;
  const subtotalAfterDiscount = subtotalBeforeDiscount - totalDiscount;
  const margin = hasCostPrice && subtotalAfterDiscount > 0
    ? parseFloat((1 - (totalCost / subtotalAfterDiscount)).toFixed(4))
    : null;

  return {
    quantity: parseFloat(totalQuantity.toFixed(2)),
    price: parseFloat(averagePrice.toFixed(2)),
    discount: parseFloat(averageDiscount.toFixed(2)),
    taxesAmount: parseFloat(taxesAmount.toFixed(2)),
    total: parseFloat(grandTotal.toFixed(2)),
    costPrice,
    margin,
  };
};

/**
 * Get all direct children of a header line (both items and sub-headers)
 */
const getHeaderChildren = (
  headerLine: InvoiceItem,
  allLines: InvoiceItem[]
): InvoiceItem[] => {
  // Match by ID if header has one, otherwise match by temporary ID based on order
  const headerId = headerLine.id || `temp-${headerLine.order}`;
  return allLines.filter(
    line => line.parent?.id === headerId
  );
};

/**
 * Check if a line is a child of any header
 */
const hasParent = (line: InvoiceItem): boolean => {
  return line.parent !== null;
};

export {
  DEBUG,
  formatMeasure,
  formatCurrency,
  formatItemPrice,
  formatDecimal,
  formatAddress,
  formatDate,
  formatDateRange,
  formatDateForAPI,
  isFutureDay,
  isCurrentMonth,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  parseLocalDateString,
  formatTime,
  formatTimeHHMM,
  getTimeAgo,
  formatDateLog,
  formatSize,
  formatDistance,
  formatTimeToTravel,
  formatTimeDelta,
  getFileIcon,
  getFileExtension,
  getFileTypeInfo,
  getColorByExtension,
  getColorFromString,
  safeNavigateBack,
  SPANISH_PROVINCES,
  TAX_CODE_TYPES,
  getCountryCode,
  getInitials,
  getTextColorClasses,
  getColorClasses,
  getStrokeColorClasses,
  getBgColorClasses,
  getBorderColorClasses,
  getCurrencySymbol,
  calculateParams,
  camelToSnake,
  keysToSnakeCase,
  replacePlaceholders,
  generateNextDocumentNumber,
  calculateHeaderLineValues,
  getHeaderChildren,
  hasParent,
  formatPercentage,
};
