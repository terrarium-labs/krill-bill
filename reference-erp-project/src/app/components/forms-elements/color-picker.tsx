import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { UseFormReturn } from "react-hook-form"
import { LIST_COLORS } from "@/utils/miscelanea"
import { useEffect, useState } from "react"
import ColorLabel from "@/app/components/labels/color-label"

interface ColorPickerProps {
    form: UseFormReturn<any>
    name: string
    label: string
    required?: boolean
    defaultValue?: string
    placeholder?: string
    disabled?: boolean
    className?: string
    description?: string
}

export default function ColorPicker({
    form,
    name,
    label,
    required = false,
    defaultValue,
    placeholder,
    disabled = false,
    className = "",
    description,
}: ColorPickerProps) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (defaultValue && LIST_COLORS.includes(defaultValue)) {
            form.setValue(name, defaultValue)
        }
    }, [defaultValue, form, name])

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>
                        {label} {required && "*"}
                    </FormLabel>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                    <Popover open={open} onOpenChange={setOpen} modal={true}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    disabled={disabled}
                                    className={cn(
                                        "w-full justify-between",
                                        className,
                                        !field.value && "text-muted-foreground",
                                        "shadow-none"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {field.value ? (
                                            <>
                                                <ColorLabel data={field.value} />
                                            </>
                                        ) : (
                                            <>
                                                <Palette className="h-4 w-4 text-muted-foreground" />
                                                <span>{placeholder || t("forms.selectColor", "Select a color")}</span>
                                            </>
                                        )}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command>
                                <CommandInput
                                    placeholder={t("forms.searchColor", "Search color...")}
                                    className="h-9"
                                />
                                <CommandList>
                                    <CommandEmpty>
                                        {t("forms.noColorFound", "No color found.")}
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {LIST_COLORS.map((color) => (
                                            <CommandItem
                                                key={color}
                                                value={color}
                                                onSelect={() => {
                                                    field.onChange(color)
                                                    setOpen(false)
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <ColorLabel data={color} />
                                                </div>
                                                <Check
                                                    className={cn(
                                                        "ml-2 h-4 w-4",
                                                        color === field.value ? "opacity-100" : "opacity-0"
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
        />
    )
}
