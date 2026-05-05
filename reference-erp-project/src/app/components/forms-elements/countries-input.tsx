import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { UseFormReturn } from "react-hook-form"
import { COUNTRIES } from "@/utils/countries"
import { FlagComponent } from "../flag-component"
import { useEffect } from "react"

export default function CountriesInput({
    form,
    name,
    label,
    defaultValue,
}: {
    form: UseFormReturn<any>,
    name: string,
    label: string,
    required?: boolean,
    defaultValue?: string,
}) {
    const { t } = useTranslation();

    useEffect(() => {
        if (defaultValue) {
            form.setValue(name, defaultValue);
        }
    }, [defaultValue]);

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex-1 min-w-0 space-y-0">
                    <FormLabel>{label}</FormLabel>
                    <Popover modal={true}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "justify-between",
                                        !field.value && "text-muted-foreground",
                                        "shadow-none"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {field.value && <FlagComponent country={COUNTRIES.find((c) => c.code === field.value)?.code || ""} countryName={COUNTRIES.find((c) => c.code === field.value)?.name || ""} />}
                                        {field.value
                                            ? COUNTRIES.find((c) => c.code === field.value)?.name
                                            : t("clients.countryPlaceholder", "Select country")}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent align="start" className=" p-0">
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
                                                    field.onChange(country.code);
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FlagComponent country={country.code} countryName={country.name} />
                                                    <span>{country.name}</span>
                                                </div>
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        country.code === field.value ? "opacity-100" : "opacity-0"
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
                                                    field.onChange(country.code);
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FlagComponent country={country.code} countryName={country.name} />
                                                    <span>{country.name}</span>
                                                </div>
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        country.code === field.value ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}
        />)
}