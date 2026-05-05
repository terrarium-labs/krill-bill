import React from "react";
import { FlagComponent } from "@/app/components/flag-component";
import { COUNTRIES } from "@/utils/countries";

interface CountryLabelProps {
    data: string | null | undefined;
    showFlag?: boolean;
}

/**
 * CountryLabel component - Displays a country with optional flag
 * 
 * @param data - Country code (e.g., "ES", "US") as string, null, or undefined
 * @param showFlag - Whether to display the flag icon (default: true)
 * 
 * Behavior:
 * - If null/undefined/empty string: displays "-"
 * - If valid country code: displays flag (optional) and country name
 * - If invalid country code: displays the code as-is
 */
const CountryLabel: React.FC<CountryLabelProps> = ({ data, showFlag = true }) => {
    // Handle null, undefined, or empty string
    if (!data) {
        return <span className="text-muted-foreground">-</span>;
    }

    // Find country by code
    const country = COUNTRIES.find((c) => c.code === data);
    
    // If country not found, just display the code
    if (!country) {
        return <div>{data}</div>;
    }

    // Display with flag if showFlag is true
    if (showFlag) {
        return (
            <div className="flex items-center gap-2">
                <FlagComponent country={country.code} countryName={country.name} />
                <span>{country.name}</span>
            </div>
        );
    }

    // Display without flag
    return <div>{country.name}</div>;
};

export default CountryLabel;
