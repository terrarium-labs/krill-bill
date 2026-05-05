import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { COUNTRIES } from "@/utils/countries"
import { FlagComponent } from "@/app/components/flag-component"

interface CountriesSelectProps {
    value: string[] | null;
    onChange: (value: string[]) => void;
    placeholder?: string;
    className?: string;
}

export default function CountriesSelect({
    value,
    onChange,
    placeholder,
    className,
}: CountriesSelectProps) {
    const { t } = useTranslation();

    // Ensure value is always an array
    const selectedValues = value || [];

    const handleSelect = (countryCode: string) => {
        if (selectedValues.includes(countryCode)) {
            onChange(selectedValues.filter((v) => v !== countryCode));
        } else {
            onChange([...selectedValues, countryCode]);
        }
    };

    return (
        <Popover modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                        "justify-between",
                        selectedValues.length === 0 && "text-muted-foreground",
                        className
                    )}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {selectedValues.length === 0 ? (
                            placeholder || t("clients.countryPlaceholder", "Select countries")
                        ) : selectedValues.length === 1 ? (
                            <>
                                <FlagComponent
                                    country={COUNTRIES.find((c) => c.code === selectedValues[0])?.code || ""}
                                    countryName={COUNTRIES.find((c) => c.code === selectedValues[0])?.name || ""}
                                />
                                <span className="truncate">
                                    {COUNTRIES.find((c) => c.code === selectedValues[0])?.name}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="truncate">{selectedValues.length} {t("clients.countriesSelected", "countries selected")}</span>
                            </>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
                <Command>
                    <CommandInput placeholder={t("clients.searchCountry", "Search country...")} />
                    <CommandList>
                        <CommandEmpty>{t("clients.noCountryFound", "No country found.")}</CommandEmpty>
                        <CommandGroup heading={t("clients.country", "Common countries")}>
                            {COUNTRIES.filter((country) => country.common).map((country) => (
                                <CommandItem
                                    value={country.code + " - " + country.name + " (" + country.code + ")"}
                                    key={country.code}
                                    className="cursor-pointer justify-between"
                                    onSelect={() => {
                                        handleSelect(country.code);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <FlagComponent country={country.code} countryName={country.name} />
                                        <span>{country.name}</span>
                                    </div>
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedValues.includes(country.code) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading={t("clients.country", "All countries")}>
                            {COUNTRIES.map((country) => (
                                <CommandItem
                                    value={country.code + " - " + country.name + " (" + country.code + ")"}
                                    key={country.code}
                                    className="cursor-pointer justify-between"
                                    onSelect={() => {
                                        handleSelect(country.code);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <FlagComponent country={country.code} countryName={country.name} />
                                        <span>{country.name}</span>
                                    </div>
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedValues.includes(country.code) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
