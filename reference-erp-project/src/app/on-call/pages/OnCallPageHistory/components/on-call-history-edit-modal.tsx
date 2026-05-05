import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import IdBadge from "@/app/components/id-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { OnCallConfig } from "@/types/field-service/on-call/configs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const configFormSchema = z.object({
  resting_time_after_call: z.coerce.number().min(0, "Must be 0 or greater"),
  requirements: z.string(),
});

type ConfigFormValues = z.infer<typeof configFormSchema>;

interface FormLabelWithTooltipProps {
  label: string;
  tooltip: string;
}

const FormLabelWithTooltip = ({ label, tooltip }: FormLabelWithTooltipProps) => (
  <div className="flex items-center gap-1.5">
    <FormLabel>{label}</FormLabel>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

interface OnCallHistoryEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: OnCallConfig | null;
  /** When config is null, create mode. Otherwise edit mode. */
  onSave: (
    config: OnCallConfig | null,
    payload: { resting_time_after_call: number; requirements: string }
  ) => boolean | Promise<boolean>;
}

const OnCallHistoryEditModal = ({
  open,
  onOpenChange,
  config,
  onSave,
}: OnCallHistoryEditModalProps) => {
  const { t } = useTranslation();

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema) as any,
    defaultValues: { resting_time_after_call: 0, requirements: "" },
  });

  React.useEffect(() => {
    if (config) {
      form.reset({
        resting_time_after_call: config.resting_time_after_call,
        requirements: config.requirements ?? "",
      });
    } else {
      form.reset({
        resting_time_after_call: 0,
        requirements: "",
      });
    }
  }, [config, form, open]);

  const isCreate = config === null;

  const handleSave = async (values: ConfigFormValues) => {
    const success = await onSave(config, {
      resting_time_after_call: values.resting_time_after_call,
      requirements: values.requirements,
    });
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full md:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
            <span>
              {isCreate
                ? t("on-call.configs.createConfig", "Create config")
                : t("on-call.configs.editConfig", "Edit config")}
            </span>
            {config && (
              <IdBadge id={config.id} customTooltip={t("common.copyId", "Copy ID")} />
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-12">
              <FormField
                control={form.control}
                name="resting_time_after_call"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithTooltip
                      label={t("on-call.configs.columns.restingTimeAfterCall", "Resting time after call")}
                      tooltip={t(
                        "on-call.configs.tooltips.restingTimeAfterCall",
                        "Minimum time (in minutes) that must pass after an employee completes a call before they can be assigned to another call or resume their regular working shift. Use 0 for no resting period."
                      )}
                    />
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithTooltip
                      label={t("on-call.configs.columns.requirements", "Requirements")}
                      tooltip={t(
                        "on-call.configs.tooltips.requirements",
                        "Configuration requirements or constraints for the on-call schedule. This can include rules, conditions, or specifications that the system must follow when generating or validating shifts."
                      )}
                    />
                    <FormControl>
                      <Textarea
                        placeholder={t("on-call.configs.requirementsPlaceholder", "Enter requirements...")}
                        rows={5}
                        className="resize-none text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit">{t("common.save", "Save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OnCallHistoryEditModal;
