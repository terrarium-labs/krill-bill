import { FlagComponent } from "../flag-component";
import { TAX_CODES } from "@/utils/taxes";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface TaxCodeInputProps {
    form: UseFormReturn<any>;
    name?: string;
    taxCodeTypeName?: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
}

export const TaxCodeInput = ({
    form,
    name = "tax_code",
    taxCodeTypeName = "tax_code_type",
    label,
    placeholder,
    disabled = false,
}: TaxCodeInputProps) => {
    const { t } = useTranslation();
    const [selectedTaxCode, setSelectedTaxCode] = useState(
        TAX_CODES.find(code => code.country === "es") || TAX_CODES[0]
    );
    const [taxCodeValue, setTaxCodeValue] = useState("");

    // Function to parse a tax code type and find the corresponding tax code configuration.
    // Only id is unique; tax_code is shared by many entries (e.g. "tin" for Albania, Armenia, etc.).
    // API stores tax_code_type as the id (e.g. "ve_rif").
    const parseTaxCodeType = (taxCodeType: string) => {
        if (!taxCodeType) {
            return {
                taxCode: TAX_CODES.find(code => code.country === "es") || TAX_CODES[0],
                value: ""
            };
        }

        const foundTaxCode = TAX_CODES.find(code => code.id === taxCodeType.toLowerCase());

        if (foundTaxCode) {
            return {
                taxCode: foundTaxCode,
                value: form.getValues(name) || ""
            };
        }

        // If not found, use Spain as default
        return {
            taxCode: TAX_CODES.find(code => code.country === "es") || TAX_CODES[0],
            value: form.getValues(name) || ""
        };
    };

    // Sync with form values
    useEffect(() => {
        const currentTaxCodeType = form.getValues(taxCodeTypeName);
        const currentTaxCode = form.getValues(name);

        if (currentTaxCodeType) {
            const parsed = parseTaxCodeType(currentTaxCodeType);
            setSelectedTaxCode(parsed.taxCode);
            setTaxCodeValue(currentTaxCode || "");
        } else if (currentTaxCode) {
            setTaxCodeValue(currentTaxCode);
        }
    }, [form.watch(taxCodeTypeName), form.watch(name), name, taxCodeTypeName]);

    const handleTaxCodeTypeChange = (taxCode: typeof TAX_CODES[0]) => {
        setSelectedTaxCode(taxCode);
        // Update the tax code type in the form (API expects id, e.g. "ve_rif")
        form.setValue(taxCodeTypeName, taxCode.id);
    };

    const handleTaxCodeChange = (value: string) => {
        setTaxCodeValue(value);
        form.setValue(name, value);
    };

    // Group tax codes by country for better organization
    const groupedTaxCodes = TAX_CODES.reduce((acc, taxCode) => {
        if (taxCode.country === "unknown") return acc;

        if (!acc[taxCode.country_name]) {
            acc[taxCode.country_name] = [];
        }
        acc[taxCode.country_name].push(taxCode);
        return acc;
    }, {} as Record<string, typeof TAX_CODES>);

    // Get common tax codes (Spain, EU, US, UK, etc.)
    const commonTaxCodes = TAX_CODES.filter(code =>
        ["es", "eu", "us", "gb", "de", "fr", "it"].includes(code.country)
    );

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label || t("tax.taxCode", "Tax Code")} *</FormLabel>
                    <div className="flex items-center gap-0">
                        {/* Tax Code Type Selector */}
                        {/* BUG: modal={true} must be true to work scroll SHADCN BUG */}
                        <Popover modal={true}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="justify-between rounded-r-none border-r-0 shadow-none"
                                    type="button"
                                >
                                    <div className="flex items-center gap-2">
                                        <FlagComponent
                                            country={selectedTaxCode.country}
                                            countryName={selectedTaxCode.country.toUpperCase()}
                                        />
                                        <span className="text-xs truncate">{selectedTaxCode.label}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-[320px] p-0 max-h-96 overflow-y-auto">
                                <Command>
                                    <CommandInput
                                        placeholder={t("tax.searchTaxCode", "Search tax code...")}
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            {t("tax.noTaxCodeFound", "No tax code found.")}
                                        </CommandEmpty>
                                        <CommandGroup heading={t("tax.commonTaxCodes", "Common Tax Codes")}>
                                            {commonTaxCodes.map((taxCode) => (
                                                <CommandItem
                                                    key={taxCode.id}
                                                    value={taxCode.id}
                                                    keywords={[taxCode.country, taxCode.label, taxCode.country_name]}
                                                    onSelect={(value) => {
                                                        const found = TAX_CODES.find((c) => c.id === value);
                                                        if (found) handleTaxCodeTypeChange(found);
                                                    }}
                                                    className="cursor-pointer justify-between text-foreground"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FlagComponent
                                                            country={taxCode.country}
                                                            countryName={taxCode.country.toUpperCase()}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-foreground font-medium">
                                                                {taxCode.label}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {taxCode.country_name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedTaxCode.id === taxCode.id
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandSeparator />
                                        {Object.entries(groupedTaxCodes)
                                            .sort(([a], [b]) => a.localeCompare(b))
                                            .map(([countryName, taxCodes]) => (
                                                <CommandGroup key={countryName} heading={countryName}>
                                                    {taxCodes.map((taxCode) => (
                                                        <CommandItem
                                                            key={taxCode.id}
                                                            value={taxCode.id}
                                                            keywords={[taxCode.country, taxCode.label, taxCode.country_name]}
                                                            onSelect={(value) => {
                                                                const found = TAX_CODES.find((c) => c.id === value);
                                                                if (found) handleTaxCodeTypeChange(found);
                                                            }}
                                                            className="cursor-pointer justify-between text-foreground"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <FlagComponent
                                                                    country={taxCode.country}
                                                                    countryName={taxCode.country.toUpperCase()}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="text-foreground font-medium">
                                                                        {taxCode.label}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {taxCode.tax_code.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedTaxCode.id === taxCode.id
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            ))}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {/* Tax Code Value Input */}
                        <FormControl>
                            <Input
                                placeholder={placeholder || t("tax.enterTaxCode", "Enter tax code")}
                                className="rounded-l-none"
                                value={taxCodeValue}
                                onChange={(e) => handleTaxCodeChange(e.target.value)}
                                onBlur={field.onBlur}
                                name={field.name}
                                disabled={disabled}
                            />
                        </FormControl>
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
