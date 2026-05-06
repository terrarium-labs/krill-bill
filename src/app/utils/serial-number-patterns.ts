/**
 * Validates a serial number pattern
 * @param value Pattern string to validate
 * @returns Object with valid flag and optional error message
 */
export function validatePattern(value: string): { valid: boolean; error?: string } {
  if (!value.trim()) {
    return { valid: false, error: 'Pattern is required' };
  }

  // Check if pattern contains at least one %
  if (!value.includes('%')) {
    return { valid: false, error: 'Pattern must contain at least one % sign' };
  }

  // Check that all % signs are consecutive (only one group)
  const percentGroups = value.match(/%+/g);
  if (!percentGroups || percentGroups.length > 1) {
    return { valid: false, error: 'All % signs must be consecutive (only one group allowed)' };
  }

  // Check if brackets are properly closed
  const openBrackets = (value.match(/\[/g) || []).length;
  const closeBrackets = (value.match(/]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    return { valid: false, error: 'Brackets must be properly closed' };
  }

  // If brackets exist, validate their content
  const bracketContents = value.match(/\[([^\]]+)\]/g);
  if (bracketContents) {
    const validBracketValues = new Set(['YY', 'YYYY', 'DD', 'MM']);
    for (const bracket of bracketContents) {
      const content = bracket.slice(1, -1);
      if (!validBracketValues.has(content)) {
        return {
          valid: false,
          error: `Invalid bracket content: ${content}. Only YY, YYYY, DD, MM are allowed`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Generates the next document number based on pattern and last number
 * @param pattern Pattern string (e.g., "INV-[YYYY]-%%%%")
 * @param lastNumber Last number used (defaults to 0)
 * @returns Generated document number example
 */
export function generateNextDocumentNumber(pattern: string, lastNumber: number = 0): string {
  if (!pattern.trim()) return '';

  const validation = validatePattern(pattern);
  if (!validation.valid) return '';

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
}
