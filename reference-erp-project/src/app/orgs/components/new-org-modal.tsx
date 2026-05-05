import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { postOrg } from '@/api/orgs/orgs';
import { Building, Loader2 } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';

type FormValues = {
    name: string;
};

interface NewOrgModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onOrgCreated?: () => void;
}

const NewOrgModal: React.FC<NewOrgModalProps> = ({ open, onOpenChange, onOrgCreated }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    const formSchema = z.object({
        name: z.string()
            .min(1, t('orgs.validation.nameRequired', 'Organization name is required'))
            .min(2, t('orgs.validation.nameMinLength', 'Organization name must be at least 2 characters'))
            .max(100, t('orgs.validation.nameMaxLength', 'Organization name must be less than 100 characters'))
            .trim(),
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const response = await postOrg({ name: values.name });

            if (response.success) {
                toast.success(t('orgs.orgCreatedSuccess', 'Organization created successfully'));
                form.reset();
                onOpenChange(false);
                if (onOrgCreated) {
                    onOrgCreated();
                }
            } else {
                toast.error(response.error || t('orgs.postOrgError', 'Failed to create organization'));
            }
        } catch (error) {
            console.error('Error creating organization:', error);
            toast.error(t('orgs.postOrgError', 'Failed to create organization'));
        } finally {
            setIsLoading(false);
        }
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

    // Reset form when modal opens/closes
    React.useEffect(() => {
        if (open) {
            form.reset();
        }
    }, [open, form]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <Building className="h-5 w-5" />
                        {t('orgs.createNewOrg', 'Create New Organization')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('orgs.postOrgModalDescription', 'Create a new organization to collaborate with your team.')}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('orgs.organizationName', 'Organization Name')}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('orgs.enterOrgName', 'Enter organization name')}
                                            {...field}
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t('orgs.orgNameDescription', 'Choose a unique name for your organization (2-100 characters).')}
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
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isLoading || !form.formState.isValid}
                            className="w-full sm:w-auto"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('orgs.creating', 'Creating...')}
                                </>
                            ) : (
                                <>
                                    {t('common.create', 'Create')}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default NewOrgModal;
