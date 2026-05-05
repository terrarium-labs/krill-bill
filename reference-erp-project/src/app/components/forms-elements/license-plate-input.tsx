import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Info, Check, ChevronsUpDown } from "lucide-react";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FlagComponent } from "@/app/components/flag-component";
import { COUNTRIES } from "@/utils/countries";
import { getLicensePlateExample, getLicensePlateHint, PLATE_COUNTRIES } from "@/utils/license-plates";
import { useOrg } from "@/app/contexts/OrgContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/** COUNTRIES filtered to only those that operate a vehicle registration system */
const PLATE_COUNTRY_LIST = COUNTRIES.filter((c) => PLATE_COUNTRIES.has(c.code.toUpperCase()));

interface LicensePlateInputProps {
    form: UseFormReturn<any>;
    /** Form field name for the plate string value */
    name: string;
    /** Optional form field name to sync the selected country code into */
    countryName?: string;
    label: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    /** Override the initial country. Falls back to org country, then "ES". */
    defaultCountry?: string;
}

export const LicensePlateInput = ({
    form,
    name,
    countryName,
    label,
    required = false,
    disabled = false,
    className,
    defaultCountry,
}: LicensePlateInputProps) => {
    const { t } = useTranslation();
    const { org } = useOrg();

    const resolveInitialCountry = () => {
        if (countryName) {
            const fromForm = form.getValues(countryName) as string | undefined;
            if (fromForm) return fromForm.toUpperCase();
        }
        if (defaultCountry) return defaultCountry.toUpperCase();
        if (org?.country) return org.country.toUpperCase();
        return "ES";
    };

    const [selectedCountry, setSelectedCountry] = useState<string>(resolveInitialCountry);

    // Re-sync when the countryName field is reset externally (e.g. form.reset)
    useEffect(() => {
        if (countryName) {
            const fromForm = form.getValues(countryName) as string | undefined;
            if (fromForm) setSelectedCountry(fromForm.toUpperCase());
        }
    }, [form.watch(countryName ?? "")]);

    const selectedCountryData = COUNTRIES.find(
        (c) => c.code.toUpperCase() === selectedCountry
    );

    const hint = getLicensePlateHint(selectedCountry);
    const example = getLicensePlateExample(selectedCountry);

    const handleCountryChange = (code: string) => {
        const upper = code.toUpperCase();
        setSelectedCountry(upper);
        if (countryName) {
            form.setValue(countryName, upper, { shouldDirty: true });
        }
        // Re-validate the plate against the newly selected country
        form.trigger(name);
    };

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>
                        {label}
                        {required ? " *" : ""}
                    </FormLabel>
                    <div className={cn("flex items-center", className)}>
                        {/* Country selector */}
                        <Popover modal={true}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    type="button"
                                    disabled={disabled}
                                    className="shrink-0 justify-between rounded-r-none border-r-0 shadow-none px-2 gap-1"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <FlagComponent
                                            country={selectedCountry.toLowerCase()}
                                            countryName={selectedCountryData?.name ?? selectedCountry}
                                        />
                                        <span className="text-xs font-medium">{selectedCountry}</span>
                                        {hint && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        {/* Non-interactive span — stops the click reaching the Popover trigger */}
                                                        <span
                                                            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                            }}
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                        >
                                                            <Info className="h-3 w-3" />
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="max-w-52">
                                                        <p className="text-xs">{hint}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-[260px] p-0">
                                <Command>
                                    <CommandInput
                                        placeholder={t("common.searchCountry", "Search country...")}
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            {t("common.noCountryFound", "No country found.")}
                                        </CommandEmpty>
                                        <CommandGroup
                                            heading={t("common.commonCountries", "Common countries")}
                                        >
                                            {PLATE_COUNTRY_LIST.filter((c) => c.common).map((country) => (
                                                <CommandItem
                                                    key={country.code}
                                                    value={`${country.code} ${country.name}`}
                                                    onSelect={() => handleCountryChange(country.code)}
                                                    className="cursor-pointer justify-between"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <FlagComponent
                                                            country={country.code.toLowerCase()}
                                                            countryName={country.name}
                                                        />
                                                        <span className="text-sm">{country.name}</span>
                                                    </div>
                                                    <Check
                                                        className={cn(
                                                            "h-4 w-4",
                                                            selectedCountry === country.code.toUpperCase()
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandSeparator />
                                        <CommandGroup
                                            heading={t("common.allCountries", "All countries")}
                                        >
                                            {PLATE_COUNTRY_LIST.map((country) => (
                                                <CommandItem
                                                    key={country.code}
                                                    value={`${country.code} ${country.name}`}
                                                    onSelect={() => handleCountryChange(country.code)}
                                                    className="cursor-pointer justify-between"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <FlagComponent
                                                            country={country.code.toLowerCase()}
                                                            countryName={country.name}
                                                        />
                                                        <span className="text-sm">{country.name}</span>
                                                    </div>
                                                    <Check
                                                        className={cn(
                                                            "h-4 w-4",
                                                            selectedCountry === country.code.toUpperCase()
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Plate text input */}
                        <FormControl>
                            <Input
                                {...field}
                                placeholder={example ?? "ABC1234"}
                                disabled={disabled}
                                className="rounded-l-none"
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                onBlur={() => {
                                    field.onBlur();
                                    // Trigger full Zod resolution (including superRefine) for live feedback
                                    form.trigger(name);
                                }}
                            />
                        </FormControl>
                    </div>
                    <FormMessage className="whitespace-pre-line" />
                </FormItem>
            )}
        />
    );
};
