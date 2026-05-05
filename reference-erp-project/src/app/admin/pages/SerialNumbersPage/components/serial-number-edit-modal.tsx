import { useState, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { SerialNumber, SerialNumberEntity } from "@/types/general/serial-numbers";
import IdBadge from "@/app/components/id-badge";
import TipsCard from "@/app/components/cards/tips-card";
interface SerialNumberEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    entity: SerialNumberEntity;
    name: string;
    value: string;
    last_num_value: number;
  }) => Promise<void>;
  mode: "create" | "edit";
  serialNumber?: SerialNumber | null;
  renderActions?: () => ReactNode;
}

// Validation function for the pattern value
const validatePattern = (value: string): { valid: boolean; error?: string } => {
  // Check if pattern contains at least one %
  if (!value.includes("%")) {
    return { valid: false, error: "Pattern must contain at least one % sign" };
  }

  // Check that all % signs are consecutive (only one group)
  const percentGroups = value.match(/%+/g);
  if (!percentGroups || percentGroups.length > 1) {
    return { valid: false, error: "All % signs must be consecutive (only one group allowed)" };
  }

  // Check if brackets are properly closed
  const openBrackets = (value.match(/\[/g) || []).length;
  const closeBrackets = (value.match(/]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    return { valid: false, error: "Brackets must be properly closed" };
  }

  // If brackets exist, validate their content
  const bracketContents = value.match(/\[([^\]]+)\]/g);
  if (bracketContents) {
    const validBracketValues = new Set(["YY", "YYYY", "DD", "MM"]);
    for (const bracket of bracketContents) {
      const content = bracket.slice(1, -1); // Remove [ and ]
      if (!validBracketValues.has(content)) {
        return {
          valid: false,
          error: `Invalid bracket content: ${content}. Only YY, YYYY, DD, MM are allowed`
        };
      }
    }
  }

  // Check for forbidden special characters: Ñ, ñ, Ç, ç
  if (/[ÑñÇç]/.test(value)) {
    return { valid: false, error: "Forbidden characters: Ñ, ñ, Ç, ç are not allowed" };
  }

  // Check for accented characters
  if (/[àáâãäåèéêëìíîïòóôõöùúûüýÿÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ]/.test(value)) {
    return { valid: false, error: "Accented characters are not allowed" };
  }

  // Check for emojis and other high Unicode characters
  if (/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(value)) {
    return { valid: false, error: "Emojis and special Unicode characters are not allowed" };
  }

  return { valid: true };
};

// Function to generate next document number from pattern and last number
const generateNextDocumentNumber = (pattern: string, lastNumber: number = 0): string => {
  if (!pattern) return "";

  const validation = validatePattern(pattern);
  if (!validation.valid) return "";

  const now = new Date();
  let result = pattern;

  // Replace date placeholders
  result = result.replace(/\[YYYY\]/g, now.getFullYear().toString());
  result = result.replace(/\[YY\]/g, now.getFullYear().toString().slice(-2));
  result = result.replace(/\[MM\]/g, (now.getMonth() + 1).toString().padStart(2, '0'));
  result = result.replace(/\[DD\]/g, now.getDate().toString().padStart(2, '0'));

  // Replace % sequence with next number
  const percentMatch = result.match(/%+/);
  if (percentMatch) {
    const numDigits = percentMatch[0].length;
    const nextNumber = lastNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(numDigits, '0');
    result = result.replace(/%+/, paddedNumber);
  }

  return result;
};

const SerialNumberEditModal = ({
  open,
  onOpenChange,
  onSubmit,
  mode,
  serialNumber,
  renderActions,
}: SerialNumberEditModalProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patternValidation, setPatternValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });

  const formSchema = z.object({
    entity: z.enum(["orders", "sales_invoices", "purchase_invoices"]),
    name: z
      .string()
      .min(1, t("admin.serialNumbers.validation.nameRequired", "Name is required"))
      .max(100, t("admin.serialNumbers.validation.nameMaxLength", "Name must be less than 100 characters")),
    value: z
      .string()
      .min(1, t("admin.serialNumbers.validation.valueRequired", "Pattern is required"))
      .refine(
        (val) => {
          const result = validatePattern(val);
          return result.valid;
        },
        {
          message: t("admin.serialNumbers.validation.invalidPattern", "Invalid pattern format"),
        }
      )
      .superRefine((val, ctx) => {
        const result = validatePattern(val);
        if (!result.valid && result.error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: result.error,
          });
        }
      }),
    last_num_value: z.number().int().min(0, t("admin.serialNumbers.validation.lastNumberMin", "Last number must be 0 or greater")).default(0),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      entity: "sales_invoices",
      name: "",
      value: "",
      last_num_value: 0,
    },
  });

  useEffect(() => {
    if (open && mode === "edit" && serialNumber) {
      form.reset({
        entity: serialNumber.entity,
        name: serialNumber.name,
        value: serialNumber.value,
        last_num_value: serialNumber.last_num_value || 0,
      });
    } else if (open && mode === "create") {
      form.reset({
        entity: "sales_invoices",
        name: "",
        value: "",
        last_num_value: 0,
      });
    }
  }, [open, mode, serialNumber, form]);

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting serial number:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  // Watch the value field to provide real-time validation feedback
  const patternValue = form.watch("value");
  const last_num_value = form.watch("last_num_value");

  useEffect(() => {
    if (patternValue) {
      setPatternValidation(validatePattern(patternValue));
    } else {
      setPatternValidation({ valid: true });
    }
  }, [patternValue]);

  // Generate next document number preview
  const nextDocumentNumber = generateNextDocumentNumber(patternValue, last_num_value || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-xl md:min-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
            <span>
              {mode === "create"
                ? t("admin.serialNumbers.createTitle", "Create Serial Number")
                : t("admin.serialNumbers.editTitle", "Edit Serial Number")}
            </span>
            {mode === "edit" && serialNumber && (
              <div className="flex items-center gap-2">
                <IdBadge id={serialNumber.id} />
                {renderActions?.()}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-start items-start">
              <FormField
                control={form.control}
                name="entity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.serialNumbers.entity", "Entity")} *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={mode === "edit"}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("admin.serialNumbers.selectEntity", "Select an entity")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="orders">
                          {t("admin.serialNumbers.entityOrder", "Order")}
                        </SelectItem>
                        <SelectItem value="sales_invoices">
                          {t("admin.serialNumbers.entityInvoice", "Invoice")}
                        </SelectItem>
                        <SelectItem value="purchase_invoices">
                          {t("admin.serialNumbers.entityPurchaseInvoice", "Purchase Invoice")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.serialNumbers.name", "Name of the serie")} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("admin.serialNumbers.namePlaceholder", "e.g., Invoice 2024")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.serialNumbers.pattern", "Pattern")} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="FA-[MM]/[YYYY]-%%%%%"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    {patternValue && (
                      <div className="flex items-center gap-2 text-sm">
                        {patternValidation.valid ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">
                              {t("admin.serialNumbers.patternValid", "Pattern is valid")}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">{patternValidation.error}</span>
                          </>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_num_value"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>{t("admin.serialNumbers.lastNumber", "Last Number")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={value}
                        onChange={(e) => {
                          const val = e.target.value;
                          onChange(val === "" ? 0 : parseInt(val, 10));
                        }}
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground">
                      {t("admin.serialNumbers.lastNumberDescription", "The last number used in the sequence")}
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {nextDocumentNumber && patternValidation.valid && (
              <div className="mt-2 p-3 bg-muted rounded-md border border-border">
                <p className="text-xs text-muted-foreground mb-1">
                  {t("admin.serialNumbers.nextDocument", "Next document number:")}
                </p>
                <p className="text-sm font-mono font-semibold">
                  {nextDocumentNumber}
                </p>
              </div>
            )}

            <TipsCard
              title={t("admin.serialNumbers.formatInstructions", "Pattern Format Instructions")}
              summary={
                <div className="space-y-3">
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>{t("admin.serialNumbers.rule1", "Must contain at least one % sign for the numeric sequence")}</li>
                    <li>{t("admin.serialNumbers.rule2", "All % must be consecutive (e.g., %%%%% for a 5-digit number)")}</li>
                    <li>{t("admin.serialNumbers.rule3", "Use brackets for date values: [YY], [YYYY], [DD], [MM]")}</li>
                  </ul>
                  <div className="p-2.5 bg-muted rounded-md">
                    <p className="font-semibold mb-1.5">
                      {t("admin.serialNumbers.examplesTitle", "Examples:")}
                    </p>
                    <ul className="space-y-1 font-mono">
                      <li>• FA-[MM]/[YYYY]-%%%%% → FA-01/2024-00001</li>
                      <li>• INV-[YYYY]-%%%%%% → INV-2024-000001</li>
                      <li>• ORD-[DD][MM][YY]-%%% → ORD-080124-001</li>
                    </ul>
                  </div>
                </div>
              }
              doc={{ slug: "pd_admin_serial_numbers" }}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "create"
                  ? t("common.create", "Create")
                  : t("common.save", "Save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SerialNumberEditModal;

