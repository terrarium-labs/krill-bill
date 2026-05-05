/**
 * IBAN Validator
 * Validates International Bank Account Numbers according to the IBAN standard
 */

/**
 * IBAN country code lengths
 * Source: https://www.iban.com/structure
 */
const IBAN_LENGTHS: { [key: string]: number } = {
    AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22,
    BH: 22, BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22,
    DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27,
    GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28,
    IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
    LC: 32, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22,
    MK: 19, MR: 27, MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28,
    PS: 29, PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SE: 24, SI: 19,
    SK: 24, SM: 27, TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20,
};

/**
 * Removes spaces and converts to uppercase
 */
const normalizeIBAN = (iban: string): string => {
    return iban.replace(/\s/g, '').toUpperCase();
};

/**
 * Validates IBAN format and checksum
 */
export const validateIBAN = (iban: string): boolean => {
    if (!iban) return false;

    const normalized = normalizeIBAN(iban);

    // Check if it starts with 2 letters (country code)
    if (!/^[A-Z]{2}/.test(normalized)) {
        return false;
    }

    const countryCode = normalized.substring(0, 2);

    // Check if country code is valid
    if (!IBAN_LENGTHS[countryCode]) {
        return false;
    }

    // Check if length matches the expected length for the country
    if (normalized.length !== IBAN_LENGTHS[countryCode]) {
        return false;
    }

    // Check if it contains only alphanumeric characters
    if (!/^[A-Z0-9]+$/.test(normalized)) {
        return false;
    }

    // Validate checksum using mod-97 algorithm
    // Move first 4 characters to the end
    const rearranged = normalized.substring(4) + normalized.substring(0, 4);

    // Replace letters with numbers (A=10, B=11, ..., Z=35)
    const numericString = rearranged.replace(/[A-Z]/g, (char) => {
        return (char.charCodeAt(0) - 55).toString();
    });

    // Calculate mod 97
    const remainder = mod97(numericString);

    return remainder === 1;
};

/**
 * Calculate mod 97 for very large numbers (as strings)
 * This is needed because JavaScript can't handle the large integers in IBANs
 */
const mod97 = (numericString: string): number => {
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
        remainder = (remainder * 10 + parseInt(numericString[i], 10)) % 97;
    }
    return remainder;
};

/**
 * Formats IBAN with spaces for better readability
 * Example: ES9121000418450200051332 -> ES91 2100 0418 4502 0005 1332
 */
export const formatIBAN = (iban: string): string => {
    const normalized = normalizeIBAN(iban);
    return normalized.replace(/(.{4})/g, '$1 ').trim();
};

/**
 * Gets the country name from IBAN country code
 */
export const getIBANCountry = (iban: string): string | null => {
    const normalized = normalizeIBAN(iban);
    if (normalized.length < 2) return null;

    const countryCode = normalized.substring(0, 2);
    return IBAN_LENGTHS[countryCode] ? countryCode : null;
};

