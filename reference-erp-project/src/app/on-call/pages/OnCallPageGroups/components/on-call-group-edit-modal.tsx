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
import ColorPicker from "@/app/components/forms-elements/color-picker";
import { OnCallGroup } from "@/types/field-service/on-call/groups";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const groupFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().min(1, "Color is required"),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

interface OnCallGroupEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: OnCallGroup | null;
  onSave: (group: OnCallGroup, updates: { name: string; description: string; color: string }) => boolean | Promise<boolean>;
  /** Render custom action buttons in the header (right side, next to ID badge). */
  renderActions?: (group: OnCallGroup) => React.ReactNode;
}

const OnCallGroupEditModal = ({
  open,
  onOpenChange,
  group,
  onSave,
  renderActions,
}: OnCallGroupEditModalProps) => {
  const { t } = useTranslation();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: "", description: "", color: "blue" },
  });

  React.useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
        description: group.description ?? "",
        color: group.color ?? "blue",
      });
    }
  }, [group, form]);

  if (!group) return null;

  const handleSave = async (values: GroupFormValues) => {
    const success = await onSave(group, {
      name: values.name,
      description: values.description ?? "",
      color: values.color,
    });
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full md:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
            <span>{t("on-call.groups.editGroup", "Edit group")}</span>
            <div className="flex items-center gap-2">
              <IdBadge id={group.id} customTooltip={t("common.copyId", "Copy ID")} />
              {renderActions?.(group)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-12">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>{t("on-call.groups.columns.name", "Name")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("on-call.groups.namePlaceholder", "Group name")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={() => (
                    <FormItem>
                      <ColorPicker
                        form={form}
                        name="color"
                        label={t("on-call.groups.types.color", "Color")}
                        required
                      />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("on-call.groups.columns.description", "Description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("on-call.groups.descriptionPlaceholder", "Optional description")}
                        rows={3}
                        className="resize-none"
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

export default OnCallGroupEditModal;