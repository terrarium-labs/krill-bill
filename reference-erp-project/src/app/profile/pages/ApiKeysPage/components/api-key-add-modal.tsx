import React from "react";
import { useTranslation } from "react-i18next";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

type FormValues = {
    name: string;
};

interface ApiKeyAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateKey: (name: string) => Promise<void>;
    isCreating: boolean;
}

const ApiKeyAddModal = ({
    open,
    onOpenChange,
    onCreateKey,
    isCreating,
}: ApiKeyAddModalProps) => {
    const { t } = useTranslation();

    const formSchema = z.object({
        name: z.string()
            .min(1, t('apiKeys.validation.nameRequired', 'API key name is required'))
            .min(2, t('apiKeys.validation.nameMinLength', 'API key name must be at least 2 characters'))
            .max(128, t('apiKeys.validation.nameMaxLength', 'API key name must be less than 128 characters'))
            .trim(),
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        await onCreateKey(values.name);
        form.reset();
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            if (form.formState.isDirty) {
                const discard = await promptUnsavedChanges();
                if (discard) {
                    form.reset();
                    onOpenChange(false);
                }
            } else {
                form.reset();
                onOpenChange(false);
            }
        } else {
            onOpenChange(true);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    // Reset form when modal opens
    React.useEffect(() => {
        if (open) {
            form.reset();
        }
    }, [open, form]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("apiKeys.newApiKey", "New API Key")}
                </Button>
            </DialogTrigger>
            <DialogContent
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {t("apiKeys.createTitle", "Create API Key")}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("common.name", "Name")}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("apiKeys.namePlaceholder", "Enter API key name")}
                                            {...field}
                                            disabled={isCreating}
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t('apiKeys.nameDescription', "Choose a unique name for your API key (2-128 characters).")}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            className="w-full sm:w-auto"
                            disabled={isCreating}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isCreating || !form.formState.isValid}
                            className="w-full sm:w-auto"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("apiKeys.creating", "Creating...")}
                                </>
                            ) : (
                                t("common.create", "Create")
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ApiKeyAddModal; 