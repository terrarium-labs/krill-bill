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
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Mail } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams } from "react-router-dom";
import { postOrgUser } from "@/api/orgs/users/users";

// Zod schema for validation
const formSchema = z.object({
    emails: z
        .string()
        .min(1, 'At least one email is required')
        .refine((value) => {
            // Split by comma or newlines and filter out empty strings
            const emailList = value
                .split(/[,\n]/)
                .map((email: string) => email.trim())
                .filter((email: string) => email.length > 0);

            if (emailList.length === 0) {
                return false;
            }

            // Validate each email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailList.every((email: string) => emailRegex.test(email));
        }, 'Please enter valid email addresses separated by commas or new lines')
});

// Define form values that match the actual form structure
type FormValues = {
    emails: string;
};

interface InvitationAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUsersInvited?: () => void;
}

const InvitationAddModal: React.FC<InvitationAddModalProps> = ({
    open,
    onOpenChange,
    onUsersInvited,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            emails: '',
        },
    });

    const onSubmit = async (values: FormValues) => {
        if (!orgId) {
            toast.error(t('admin.users.invitations.missingOrgId', 'Organization ID is required'));
            return;
        }

        setIsLoading(true);
        try {
            // Transform the emails string to array as expected by the API
            const emails = values.emails
                .split(/[,\n]/)
                .map((email: string) => email.trim())
                .filter((email: string) => email.length > 0);
            const response = await postOrgUser(orgId, { emails });

            if (response.success) {
                toast.success(
                    t(
                        'admin.users.invitations.inviteSuccessMultiple',
                        `Invitations sent successfully`,
                    )
                );
                if (onUsersInvited) {
                    onUsersInvited();
                }
                form.reset();
                onOpenChange(false);
            } else {
                toast.error(
                    response.error ||
                    t('admin.users.invitations.inviteError', 'Failed to send invitations')
                );
            }
        } catch (error) {
            console.error('Error sending invitations:', error);
            toast.error(t('admin.users.invitations.inviteError', 'Failed to send invitations'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        form.reset();
        onOpenChange(false);
    };

    // Reset form when modal opens/closes
    React.useEffect(() => {
        if (open) {
            form.reset();
        }
    }, [open, form]);

    // Get preview of emails being invited
    const emailsPreview = React.useMemo(() => {
        const emailsValue = form.watch('emails');
        if (!emailsValue) return [];

        return emailsValue
            .split(/[,\n]/)
            .map((email: string) => email.trim())
            .filter((email: string) => email.length > 0);
    }, [form.watch('emails')]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {t('admin.users.invitations.inviteUsers', 'Invite Users')}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'admin.users.invitations.inviteDescription',
                            'Send invitations to new users to join your organization. Enter email addresses separated by commas or new lines.'
                        )}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="emails"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('admin.users.invitations.emailAddresses', 'Email Addresses')} *
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t(
                                                'admin.users.invitations.emailPlaceholder',
                                                'user1@example.com, user2@example.com\nuser3@example.com'
                                            )}
                                            className="min-h-[100px] overflow-y-auto"
                                            {...field}
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t(
                                            'admin.users.invitations.emailDescription',
                                            'Enter email addresses separated by commas or on separate lines. Each user will receive an invitation to join the organization.'
                                        )}
                                    </FormDescription>
                                    <FormMessage />

                                    {/* Email preview */}
                                    {emailsPreview.length > 0 && (
                                        <div className="mt-3 p-3 bg-muted rounded-md">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">
                                                    {t(
                                                        'admin.users.invitations.emailPreview',
                                                        'Emails to invite'
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 overflow-y-auto max-h-[120px]">
                                                {emailsPreview.map((email: string, index: number) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-2 py-1 text-xs bg-background border rounded-md"
                                                    >
                                                        {email}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </FormItem>
                            )}
                        />
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isLoading || emailsPreview.length === 0}
                            className="w-full sm:w-auto"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t('admin.users.invitations.sending', 'Sending invitations...')}
                                </>
                            ) : (
                                <>

                                    {t(
                                        'admin.users.invitations.sendInvitations',
                                        'Send Invitations',
                                    )}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default InvitationAddModal;
