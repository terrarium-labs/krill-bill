import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChatContext } from "@/app/chat/context/ChatContext";

type FieldType = "text" | "number" | "email" | "textarea" | "select" | "date";

interface FormField {
    name: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    required?: boolean;
    options?: { label: string; value: string }[];
    defaultValue?: string;
}

export interface FormWidgetData {
    fields: FormField[];
    submitLabel?: string;
    /** Template for the message sent on submit. Use {field_name} placeholders. */
    messageTemplate: string;
}

const FormWidget = ({ data }: { data: FormWidgetData }) => {
    const chat = useChatContext();
    const { register, handleSubmit, setValue, formState: { errors } } = useForm<Record<string, string>>({
        defaultValues: Object.fromEntries(
            data.fields.map((f) => [f.name, f.defaultValue ?? ""])
        ),
    });

    const onSubmit = (values: Record<string, string>) => {
        let message = data.messageTemplate;
        Object.entries(values).forEach(([k, v]) => {
            message = message.replaceAll(`{${k}}`, v);
        });
        chat?.handleSendMessage(message);
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 p-3"
        >
            {data.fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                        {field.label}
                        {field.required && <span className="text-destructive ml-0.5">*</span>}
                    </Label>

                    {field.type === "textarea" ? (
                        <Textarea
                            {...register(field.name, { required: field.required })}
                            placeholder={field.placeholder}
                            className="text-xs min-h-16 resize-none"
                        />
                    ) : field.type === "select" ? (
                        <Select
                            defaultValue={field.defaultValue}
                            onValueChange={(v) => setValue(field.name, v)}
                        >
                            <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder={field.placeholder ?? "Select…"} />
                            </SelectTrigger>
                            <SelectContent>
                                {(field.options ?? []).map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input
                            {...register(field.name, { required: field.required })}
                            type={field.type}
                            placeholder={field.placeholder}
                            className="h-7 text-xs"
                        />
                    )}

                    {errors[field.name] && (
                        <span className="text-[11px] text-destructive">Required</span>
                    )}
                </div>
            ))}

            <Button type="submit" size="sm" className="h-7 text-xs self-end shadow-none">
                {data.submitLabel ?? "Submit"}
            </Button>
        </form>
    );
};

export default FormWidget;
