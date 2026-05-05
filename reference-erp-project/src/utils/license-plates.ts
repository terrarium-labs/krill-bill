/**
 * License plate validation utilities per country.
 *
 * Each entry defines:
 *  - `country`     ISO 3166-1 alpha-2 code (uppercase)
 *  - `countryName` Human-readable name
 *  - `pattern`     Regex the plate must match (already accounts for uppercase input)
 *  - `example`     Canonical example plate for that country
 *  - `hint`        Short human-readable format description shown as validation hint
 */
export interface LicensePlateRule {
    country: string;
    countryName: string;
    pattern: RegExp;
    example: string;
    hint: string;
}

export const LICENSE_PLATE_RULES: LicensePlateRule[] = [
    // Europe
    {
        country: "ES",
        countryName: "Spain",
        pattern: /^[0-9]{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$|^[A-Z]{1,2}[0-9]{4}[A-Z]{2}$|^[A-Z]{1,2}[0-9]{1,4}[A-Z]{0,2}$/,
        example: "1234BCD",
        hint: "e.g. 1234BCD or AB1234CD",
    },
    {
        country: "DE",
        countryName: "Germany",
        pattern: /^[A-ZÄÖÜ]{1,3}-[A-Z]{1,2}[0-9]{1,4}(H|E)?$/,
        example: "B-AB1234",
        hint: "e.g. B-AB1234 or MUC-XY999",
    },
    {
        country: "FR",
        countryName: "France",
        pattern: /^[A-Z]{2}-[0-9]{3}-[A-Z]{2}$|^[0-9]{1,4}[A-Z]{2,3}[0-9]{2,3}$/,
        example: "AB-123-CD",
        hint: "e.g. AB-123-CD",
    },
    {
        country: "IT",
        countryName: "Italy",
        pattern: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/,
        example: "AB123CD",
        hint: "e.g. AB123CD",
    },
    {
        country: "PT",
        countryName: "Portugal",
        pattern: /^[A-Z]{2}-[0-9]{2}-[0-9]{2}$|^[0-9]{2}-[A-Z]{2}-[0-9]{2}$|^[0-9]{2}-[0-9]{2}-[A-Z]{2}$|^[A-Z]{2}-[0-9]{2}-[A-Z]{2}$/,
        example: "AB-12-CD",
        hint: "e.g. AB-12-CD or 12-AB-34",
    },
    {
        country: "GB",
        countryName: "United Kingdom",
        pattern: /^[A-Z]{2}[0-9]{2}[A-Z]{3}$|^[A-Z][0-9]{1,3}[A-Z]{3}$|^[A-Z]{3}[0-9]{1,3}[A-Z]$/,
        example: "AB12CDE",
        hint: "e.g. AB12CDE",
    },
    {
        country: "NL",
        countryName: "Netherlands",
        pattern: /^[A-Z]{2}-[0-9]{2}-[0-9]{2}$|^[0-9]{2}-[A-Z]{2}-[0-9]{2}$|^[0-9]{2}-[0-9]{2}-[A-Z]{2}$|^[A-Z]{2}-[A-Z]{2}-[0-9]{2}$|^[0-9]{2}-[A-Z]{2}-[A-Z]{2}$|^[A-Z]{2}-[0-9]{2}-[A-Z]{2}$|^[0-9]{2}-[A-Z]{3}-[0-9]$|^[0-9]-[A-Z]{3}-[0-9]{2}$|^[A-Z]{3}-[0-9]{2}-[A-Z]$|^[A-Z]-[0-9]{2}-[A-Z]{3}$/,
        example: "AB-12-CD",
        hint: "e.g. AB-12-CD",
    },
    {
        country: "BE",
        countryName: "Belgium",
        pattern: /^[1-9]-[A-Z]{3}-[0-9]{3}$|^[A-Z]{3}-[0-9]{3}$/,
        example: "1-ABC-123",
        hint: "e.g. 1-ABC-123",
    },
    {
        country: "PL",
        countryName: "Poland",
        pattern: /^[A-Z]{2,3}[0-9]{4,5}$|^[A-Z]{2,3}\s[0-9]{4,5}$/,
        example: "WA12345",
        hint: "e.g. WA12345",
    },
    {
        country: "SE",
        countryName: "Sweden",
        pattern: /^[A-Z]{3}[0-9]{2}[A-Z0-9]$/,
        example: "ABC123",
        hint: "e.g. ABC123",
    },
    {
        country: "NO",
        countryName: "Norway",
        pattern: /^[A-Z]{2}[0-9]{4,5}$/,
        example: "AB12345",
        hint: "e.g. AB12345",
    },
    {
        country: "DK",
        countryName: "Denmark",
        pattern: /^[A-Z]{2}[0-9]{5}$/,
        example: "AB12345",
        hint: "e.g. AB12345",
    },
    {
        country: "FI",
        countryName: "Finland",
        pattern: /^[A-Z]{2,3}-[0-9]{1,3}$/,
        example: "ABC-123",
        hint: "e.g. ABC-123",
    },
    {
        country: "CH",
        countryName: "Switzerland",
        pattern: /^[A-Z]{2}[0-9]{1,6}$/,
        example: "ZH123456",
        hint: "e.g. ZH123456",
    },
    {
        country: "AT",
        countryName: "Austria",
        pattern: /^[A-Z]{1,2}-[A-Z]{1,5}[0-9]{1,4}$/,
        example: "W-AB1234",
        hint: "e.g. W-AB1234",
    },
    {
        country: "CZ",
        countryName: "Czech Republic",
        pattern: /^[0-9][A-Z]{1}[0-9]-[0-9]{4}$|^[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9]{4}$/,
        example: "1AB-1234",
        hint: "e.g. 1AB-1234",
    },
    {
        country: "HU",
        countryName: "Hungary",
        pattern: /^[A-Z]{3}-[0-9]{3}$/,
        example: "ABC-123",
        hint: "e.g. ABC-123",
    },
    {
        country: "RO",
        countryName: "Romania",
        pattern: /^[A-Z]{1,2}[0-9]{2}[A-Z]{3}$/,
        example: "B12ABC",
        hint: "e.g. B12ABC",
    },
    {
        country: "GR",
        countryName: "Greece",
        pattern: /^[A-Z]{3}-[0-9]{4}$/,
        example: "ABC-1234",
        hint: "e.g. ABC-1234",
    },
    // Americas
    {
        country: "US",
        countryName: "United States",
        pattern: /^[A-Z0-9]{1,8}$/,
        example: "ABC1234",
        hint: "1-8 alphanumeric characters (varies by state)",
    },
    {
        country: "CA",
        countryName: "Canada",
        pattern: /^[A-Z0-9]{2,8}$/,
        example: "ABCD123",
        hint: "2-8 alphanumeric characters (varies by province)",
    },
    {
        country: "MX",
        countryName: "Mexico",
        pattern: /^[A-Z]{3}-[0-9]{2}-[0-9]{2}$|^[A-Z0-9]{6,8}$/,
        example: "ABC-12-34",
        hint: "e.g. ABC-12-34",
    },
    {
        country: "BR",
        countryName: "Brazil",
        pattern: /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$|^[A-Z]{3}-[0-9]{4}$/,
        example: "ABC1D23",
        hint: "e.g. ABC1D23 (Mercosul) or ABC-1234",
    },
    {
        country: "AR",
        countryName: "Argentina",
        pattern: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$|^[A-Z]{3}[0-9]{3}$/,
        example: "AB123CD",
        hint: "e.g. AB123CD or ABC123",
    },
    // Asia-Pacific
    {
        country: "AU",
        countryName: "Australia",
        pattern: /^[A-Z0-9]{2,7}$/,
        example: "ABC123",
        hint: "2-7 alphanumeric characters (varies by state)",
    },
    {
        country: "JP",
        countryName: "Japan",
        pattern: /^[0-9]{3}-[0-9]{4}$|^[A-Z0-9]{4,7}$/,
        example: "123-4567",
        hint: "e.g. 123-4567",
    },
    {
        country: "CN",
        countryName: "China",
        pattern: /^[\u4E00-\u9FFF][A-Z][A-Z0-9]{5}$|^[A-Z][A-Z0-9]{5,6}$/,
        example: "A12345B",
        hint: "e.g. A12345B",
    },
    {
        country: "IN",
        countryName: "India",
        pattern: /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/,
        example: "MH12AB1234",
        hint: "e.g. MH12AB1234",
    },
    // Middle East & Africa
    {
        country: "AE",
        countryName: "United Arab Emirates",
        pattern: /^[A-Z0-9]{1,7}$/,
        example: "A12345",
        hint: "1-7 alphanumeric characters",
    },
    {
        country: "ZA",
        countryName: "South Africa",
        pattern: /^[A-Z]{2}[0-9]{2}[A-Z]{2}(GP|WC|EC|NC|FS|KZN|NW|LP|MP)$/,
        example: "AB12CDGP",
        hint: "e.g. AB12CDGP",
    },
];

/**
 * Look up the plate rule for a given ISO alpha-2 country code (case-insensitive).
 * Returns `undefined` if no specific rule is registered for that country.
 */
export const getLicensePlateRule = (countryCode: string): LicensePlateRule | undefined => {
    return LICENSE_PLATE_RULES.find(
        (r) => r.country.toUpperCase() === countryCode.toUpperCase()
    );
};

/**
 * Validate a license plate against the rule for the given country.
 *
 * @returns `true` when valid, or when no rule exists for the country (permissive fallback).
 * @returns `false` only when a rule exists and the plate does not match.
 */
export const validateLicensePlate = (plate: string, countryCode: string): boolean => {
    const rule = getLicensePlateRule(countryCode);
    if (!rule) return true; // no rule registered → allow any value
    return rule.pattern.test(plate.trim().toUpperCase());
};

/**
 * Return the human-readable format hint for a country, or `undefined` if unknown.
 */
export const getLicensePlateHint = (countryCode: string): string | undefined => {
    return getLicensePlateRule(countryCode)?.hint;
};

/**
 * Return an example plate for a country, or `undefined` if unknown.
 */
export const getLicensePlateExample = (countryCode: string): string | undefined => {
    return getLicensePlateRule(countryCode)?.example;
};

/**
 * Zod superRefine-compatible validator for plate_number cross-validated against
 * plate_country (the country selected in the license plate input).
 *
 * Usage in any Zod schema that contains plate_number / plate_country:
 *   const schema = z.object({ ... }).superRefine(refinePlateNumber);
 */
export const refinePlateNumber = (
    data: {
        plate_number?: string | null;
        plate_country?: string | null;
    },
    ctx: { addIssue: (arg: { code: "custom"; path: (string | number)[]; message: string }) => void }
): void => {
    const country = data.plate_country;
    if (!data.plate_number || !country) return;
    if (!validateLicensePlate(data.plate_number, country)) {
        const hint = getLicensePlateHint(country);
        ctx.addIssue({
            code: "custom",
            path: ["plate_number"],
            message: hint
                ? `Invalid plate format for this country \n (${hint})`
                : "Invalid license plate format for the selected country",
        });
    }
};

/**
 * Set of country codes derived from LICENSE_PLATE_RULES.
 * Used to narrow the country selector in plate input fields to only those
 * countries for which we have a registered plate format.
 * Adding a new entry to LICENSE_PLATE_RULES automatically makes it selectable.
 */
export const PLATE_COUNTRIES = new Set<string>(
    LICENSE_PLATE_RULES.map((r) => r.country)
);
