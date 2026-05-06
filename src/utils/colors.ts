/**
 * Color utility functions following Tailwind CSS best practices.
 * Inspired by the reference ERP project's color system.
 */

// Primary accent color for krill-bill
const PRIMARY_ACCENT = 'green'; // green-600: #16a34a
const ACCENT_SHADE = '600'; // Used for highlights and active states

/**
 * Tailwind color palette for various UI elements
 */
export const LIST_COLORS = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'slate',
  'gray',
  'zinc',
  'stone',
];

export const RATES_COLORS = [
  'green',
  'blue',
  'purple',
  'orange',
  'red',
  'yellow',
  'pink',
];

/**
 * Helper to convert text-* color class to bg-* color class
 */
export const textColorToBgColor = (textColor: string): string => {
  return textColor.replace(/^text-/, 'bg-');
};

/**
 * Get file type and icon info based on extension
 */
export const getFileTypeInfo = (
  fileName: string
): { icon: string; color: string; label: string } => {
  const ext = getFileExtension(fileName).toLowerCase();

  const typeMap: Record<
    string,
    { icon: string; color: string; label: string }
  > = {
    pdf: { icon: '📄', color: 'red', label: 'PDF' },
    doc: { icon: '📝', color: 'blue', label: 'Word' },
    docx: { icon: '📝', color: 'blue', label: 'Word' },
    xls: { icon: '📊', color: 'green', label: 'Excel' },
    xlsx: { icon: '📊', color: 'green', label: 'Excel' },
    ppt: { icon: '📈', color: 'orange', label: 'PowerPoint' },
    pptx: { icon: '📈', color: 'orange', label: 'PowerPoint' },
    jpg: { icon: '🖼️', color: 'purple', label: 'Image' },
    jpeg: { icon: '🖼️', color: 'purple', label: 'Image' },
    png: { icon: '🖼️', color: 'purple', label: 'Image' },
    gif: { icon: '🖼️', color: 'purple', label: 'Image' },
    zip: { icon: '📦', color: 'amber', label: 'Archive' },
    txt: { icon: '📄', color: 'slate', label: 'Text' },
  };

  return (
    typeMap[ext] || { icon: '📁', color: 'gray', label: 'File' }
  );
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

/**
 * Get color by file extension
 */
export const getColorByExtension = (fileName: string): string => {
  const ext = getFileExtension(fileName).toLowerCase();

  const colorMap: Record<string, string> = {
    pdf: 'red',
    doc: 'blue',
    docx: 'blue',
    xls: 'green',
    xlsx: 'green',
    ppt: 'orange',
    pptx: 'orange',
    jpg: 'purple',
    jpeg: 'purple',
    png: 'purple',
    gif: 'purple',
    zip: 'amber',
    txt: 'slate',
  };

  return colorMap[ext] || 'gray';
};

/**
 * Generate a beautiful, consistent color from a string (using hash)
 */
export const getColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const colorIndex = Math.abs(hash) % LIST_COLORS.length;
  return LIST_COLORS[colorIndex];
};

/**
 * Returns Tailwind text color classes (e.g., text-red-500, text-blue-600)
 */
export const getTextColorClasses = (colorToUse: string): string => {
  const colorMap: Record<string, string> = {
    red: 'text-red-600 dark:text-red-400',
    orange: 'text-orange-600 dark:text-orange-400',
    amber: 'text-amber-600 dark:text-amber-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    lime: 'text-lime-600 dark:text-lime-400',
    green: 'text-green-600 dark:text-green-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    teal: 'text-teal-600 dark:text-teal-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    sky: 'text-sky-600 dark:text-sky-400',
    blue: 'text-blue-600 dark:text-blue-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    violet: 'text-violet-600 dark:text-violet-400',
    purple: 'text-purple-600 dark:text-purple-400',
    fuchsia: 'text-fuchsia-600 dark:text-fuchsia-400',
    pink: 'text-pink-600 dark:text-pink-400',
    rose: 'text-rose-600 dark:text-rose-400',
    slate: 'text-slate-600 dark:text-slate-400',
    gray: 'text-gray-600 dark:text-gray-400',
    zinc: 'text-zinc-600 dark:text-zinc-400',
    stone: 'text-stone-600 dark:text-stone-400',
  };

  return colorMap[colorToUse] || colorMap.gray;
};

/**
 * Returns Tailwind background color classes (e.g., bg-red-500, bg-blue-600)
 */
export const getBgColorClasses = (colorToUse: string): string => {
  const colorMap: Record<string, string> = {
    red: 'bg-red-50 dark:bg-red-950',
    orange: 'bg-orange-50 dark:bg-orange-950',
    amber: 'bg-amber-50 dark:bg-amber-950',
    yellow: 'bg-yellow-50 dark:bg-yellow-950',
    lime: 'bg-lime-50 dark:bg-lime-950',
    green: 'bg-green-50 dark:bg-green-950',
    emerald: 'bg-emerald-50 dark:bg-emerald-950',
    teal: 'bg-teal-50 dark:bg-teal-950',
    cyan: 'bg-cyan-50 dark:bg-cyan-950',
    sky: 'bg-sky-50 dark:bg-sky-950',
    blue: 'bg-blue-50 dark:bg-blue-950',
    indigo: 'bg-indigo-50 dark:bg-indigo-950',
    violet: 'bg-violet-50 dark:bg-violet-950',
    purple: 'bg-purple-50 dark:bg-purple-950',
    fuchsia: 'bg-fuchsia-50 dark:bg-fuchsia-950',
    pink: 'bg-pink-50 dark:bg-pink-950',
    rose: 'bg-rose-50 dark:bg-rose-950',
    slate: 'bg-slate-50 dark:bg-slate-950',
    gray: 'bg-gray-50 dark:bg-gray-950',
    zinc: 'bg-zinc-50 dark:bg-zinc-950',
    stone: 'bg-stone-50 dark:bg-stone-950',
  };

  return colorMap[colorToUse] || colorMap.gray;
};

/**
 * Returns Tailwind border color classes (e.g., border-red-200, border-blue-300)
 */
export const getBorderColorClasses = (colorToUse: string): string => {
  const colorMap: Record<string, string> = {
    red: 'border-red-200 dark:border-red-800',
    orange: 'border-orange-200 dark:border-orange-800',
    amber: 'border-amber-200 dark:border-amber-800',
    yellow: 'border-yellow-200 dark:border-yellow-800',
    lime: 'border-lime-200 dark:border-lime-800',
    green: 'border-green-200 dark:border-green-800',
    emerald: 'border-emerald-200 dark:border-emerald-800',
    teal: 'border-teal-200 dark:border-teal-800',
    cyan: 'border-cyan-200 dark:border-cyan-800',
    sky: 'border-sky-200 dark:border-sky-800',
    blue: 'border-blue-200 dark:border-blue-800',
    indigo: 'border-indigo-200 dark:border-indigo-800',
    violet: 'border-violet-200 dark:border-violet-800',
    purple: 'border-purple-200 dark:border-purple-800',
    fuchsia: 'border-fuchsia-200 dark:border-fuchsia-800',
    pink: 'border-pink-200 dark:border-pink-800',
    rose: 'border-rose-200 dark:border-rose-800',
    slate: 'border-slate-200 dark:border-slate-800',
    gray: 'border-gray-200 dark:border-gray-800',
    zinc: 'border-zinc-200 dark:border-zinc-800',
    stone: 'border-stone-200 dark:border-stone-800',
  };

  return colorMap[colorToUse] || colorMap.gray;
};

/**
 * Returns Tailwind color classes based on type
 * Hides/omits specific color types when needed
 */
export const getColorClasses = (
  color: string,
  hide?: 'text' | 'txt' | 'border' | 'background' | 'bg'
) => {
  const textClasses = getTextColorClasses(color);
  const bgClasses = getBgColorClasses(color);
  const borderClasses = getBorderColorClasses(color);

  if (hide === 'text' || hide === 'txt') {
    return `${bgClasses} ${borderClasses}`;
  }
  if (hide === 'border') {
    return `${textClasses} ${bgClasses}`;
  }
  if (hide === 'background' || hide === 'bg') {
    return `${textClasses} ${borderClasses}`;
  }

  return `${textClasses} ${bgClasses} ${borderClasses}`;
};

/**
 * Get primary accent color classes for highlighted/active elements
 */
export const getAccentColorClasses = (): string => {
  return `text-${PRIMARY_ACCENT}-${ACCENT_SHADE} dark:text-${PRIMARY_ACCENT}-400`;
};

/**
 * Get primary accent background classes
 */
export const getAccentBgClasses = (): string => {
  return `bg-${PRIMARY_ACCENT}-${ACCENT_SHADE} hover:bg-${PRIMARY_ACCENT}-700 dark:hover:bg-${PRIMARY_ACCENT}-400`;
};
