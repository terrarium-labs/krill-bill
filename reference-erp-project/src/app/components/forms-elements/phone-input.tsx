import { FlagComponent } from "../flag-component";
import { PHONE_COUNTRIES } from "@/utils/phones";
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

interface PhoneInputProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  required?: boolean | undefined;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const PhoneInput = ({
  form,
  name="tel",
  label,
  required = false,
  placeholder,
  disabled = false,
  className,
}: PhoneInputProps) => {
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState(PHONE_COUNTRIES.find(country => country.countryCode === "es") || PHONE_COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Función para parsear un número de teléfono completo
  const parsePhoneNumber = (fullPhone: string) => {
    if (!fullPhone || !fullPhone.startsWith('+')) {
      return {
        country: PHONE_COUNTRIES.find(country => country.countryCode === "es") || PHONE_COUNTRIES[0],
        number: ""
      };
    }

    // Crear una lista de países ordenada por longitud de dialCode descendente
    // Esto asegura que códigos como +1242 se detecten antes que +1
    const sortedCountries = [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    
    // Buscar el primer país que coincida (será el más específico)
    const phoneWithoutPlus = fullPhone.substring(1); // Quitar el +
    
    for (const country of sortedCountries) {
      if (phoneWithoutPlus.startsWith(country.dialCode)) {
        return {
          country: country,
          number: phoneWithoutPlus.substring(country.dialCode.length)
        };
      }
    }

    // Si no encuentra coincidencia, usar España por defecto
    return {
      country: PHONE_COUNTRIES.find(country => country.countryCode === "es") || PHONE_COUNTRIES[0],
      number: phoneWithoutPlus
    };
  };

  // Sincronizar con el valor del formulario
  useEffect(() => {
    const currentValue = form.getValues(name);
    if (currentValue) {
      const parsed = parsePhoneNumber(currentValue);
      setSelectedCountry(parsed.country);
      setPhoneNumber(parsed.number);
    }
  }, [form.watch(name), name]);

  const handleCountryChange = (country: (typeof PHONE_COUNTRIES)[0]) => {
    setSelectedCountry(country);
    // Actualizar el valor del formulario con el nuevo código de país
    const currentPhone = form.getValues(name);
    if (currentPhone) {
      form.setValue(name, `+${country.dialCode}${phoneNumber}`);
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    form.setValue(name, `+${selectedCountry.dialCode}${value}`);
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label || t("contacts.phone", "Teléfono")} {required ? "*" : ""}</FormLabel>
          <div className={cn("flex items-center gap-0", className)}>
          {/* //! BUG: modal={true} must be true to work scroll SHADCN BUG ######################################################### */}
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-32 justify-between rounded-r-none border-r-0 shadow-none"
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <FlagComponent
                      country={selectedCountry.countryCode}
                      countryName={selectedCountry.countryCode.toUpperCase()}
                    />
                    <span className="text-xs">+{selectedCountry.dialCode}</span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[280px] p-0 max-h-96 overflow-y-auto">
                <Command>
                  <CommandInput
                    placeholder={t("contacts.searchCountry", "Buscar país...")}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {t("contacts.noCountryFound", "No se encontró país.")}
                    </CommandEmpty>
                    <CommandGroup
                      heading={t("contacts.country", "Países comunes")}
                    >
                      {PHONE_COUNTRIES.filter((country) => country.common).map(
                        (country) => (
                          <CommandItem
                            key={country.countryCode}
                            value={`${country.countryCode} ${country.name} +${country.dialCode}`}
                            onSelect={() => handleCountryChange(country)}
                            className="cursor-pointer justify-between text-foreground"
                          >
                            <div className="flex items-center gap-3">
                              <FlagComponent
                                country={country.countryCode}
                                countryName={country.countryCode.toUpperCase()}
                              />
                              <span className="text-foreground">
                                +{country.dialCode}
                              </span>
                            </div>
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCountry.countryCode ===
                                  country.countryCode
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        )
                      )}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={t("contacts.country", "Países")}>
                      {PHONE_COUNTRIES.map((country) => (
                        <CommandItem
                          key={country.countryCode}
                          value={`${country.countryCode} ${country.name} +${country.dialCode}`}
                          onSelect={() => handleCountryChange(country)}
                          className="cursor-pointer justify-between text-foreground" 
                        >
                          <div className="flex items-center gap-3">
                            <FlagComponent
                              country={country.countryCode}
                              countryName={country.countryCode.toUpperCase()}
                            />
                            <span className="text-foreground">
                              +{country.dialCode}
                            </span>
                          </div>
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCountry.countryCode ===
                                country.countryCode
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
            <FormControl>
              <Input
                placeholder={placeholder || "123456789"}
                className="rounded-l-none"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
                maxLength={10}
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
