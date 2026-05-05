import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface SimpleDatePickerProps {
    date: Date | null;
    setDate: (date: Date | null) => void;
    id?: string;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export const SimpleDatePicker: React.FC<SimpleDatePickerProps> = ({
    date,
    setDate,
    id,
    className,
    disabled = false,
    placeholder = "Pick a date",
}) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal h-8 shadow-none",
                        !date && "text-muted-foreground",
                        className,
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date || undefined}
                    onSelect={(selectedDate) => setDate(selectedDate || null)}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
};
