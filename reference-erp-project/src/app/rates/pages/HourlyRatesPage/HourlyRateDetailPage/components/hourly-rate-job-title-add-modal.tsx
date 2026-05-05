import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { getOrgJobTitles } from "@/api/orgs/job-titles/job-titles";
import { postOrgHourlyRateJobTitle, patchOrgHourlyRateJobTitle } from "@/api/orgs/hourly-rates/hourly-rates";
import { HourlyRateJobTitle } from "@/types/general/hourly-rates";
import IdBadge from "@/app/components/id-badge";
import Tag from "@/app/components/tag/tag";

interface HourlyRateJobTitleAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onJobTitleAdded?: () => void;
    orgId: string;
    hourlyRateId: string;
    rateJobTitle?: HourlyRateJobTitle; // For edit mode
}

const formSchema = z.object({
    job_title_id: z.array(z.string()).min(1, "Job title is required"),
    default_pvp: z.number().min(0, "Default PVP must be positive"),
    pmc: z.number().min(0, "PMC must be positive"),
    min_quantity: z.number().min(0, "Minimum quantity must be positive"),
    step_quantity: z.number().min(0, "Step quantity must be positive"),
});

type FormValues = z.infer<typeof formSchema>;

const HourlyRateJobTitleAddModal: React.FC<HourlyRateJobTitleAddModalProps> = ({
    open,
    onOpenChange,
    onJobTitleAdded,
    orgId,
    hourlyRateId,
    rateJobTitle,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!rateJobTitle;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            job_title_id: [],
            default_pvp: undefined,
            pmc: undefined,
            min_quantity: 60,
            step_quantity: 30,
        },
    });

    // Reset form when modal opens or rateJobTitle changes
    useEffect(() => {
        if (open) {
            if (rateJobTitle) {
                form.reset({
                    job_title_id: [rateJobTitle.job_title.id],
                    default_pvp: rateJobTitle.default_pvp,
                    pmc: rateJobTitle.pmc,
                    min_quantity: rateJobTitle.min_quantity,
                    step_quantity: rateJobTitle.step_quantity,
                });
            } else {
                form.reset({
                    job_title_id: [],
                    default_pvp: undefined,
                    pmc: undefined,
                    min_quantity: 60,
                    step_quantity: 30,
                });
            }
        }
    }, [open, rateJobTitle, form]);

    const handleSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            let response;

            if (isEditMode && rateJobTitle) {
                // Edit mode - patch existing job title
                response = await patchOrgHourlyRateJobTitle(
                    orgId,
                    hourlyRateId,
                    rateJobTitle.job_title.id,
                    {
                        ...rateJobTitle,
                        default_pvp: values.default_pvp,
                        pmc: values.pmc,
                        min_quantity: values.min_quantity,
                        step_quantity: values.step_quantity,
                        time_frames: rateJobTitle.time_frames, // Keep existing timeframes
                    }
                );
            } else {
                // Create mode - add new job title
                response = await postOrgHourlyRateJobTitle(orgId, hourlyRateId, {
                    job_title_id: values.job_title_id[0],
                    default_pvp: values.default_pvp,
                    pmc: values.pmc,
                    min_quantity: values.min_quantity,
                    step_quantity: values.step_quantity,
                    time_frames: []
                });
            }

            if (response.success) {
                toast.success(
                    isEditMode
                        ? t(
                            "hourlyRates.jobTitle.jobTitleUpdated",
                            "Job title updated successfully"
                        )
                        : t(
                            "hourlyRates.jobTitle.jobTitleAdded",
                            "Job title added to hourly rate successfully"
                        )
                );
                form.reset();
                onOpenChange(false);
                onJobTitleAdded?.();
            } else {
                toast.error(
                    isEditMode
                        ? t(
                            "hourlyRates.jobTitle.errorUpdatingJobTitle",
                            "Error updating job title"
                        )
                        : t(
                            "hourlyRates.jobTitle.errorAddingJobTitle",
                            "Error adding job title to hourly rate"
                        )
                );
            }
        } catch (error) {
            console.error("Error saving job title:", error);
            toast.error(
                isEditMode
                    ? t(
                        "hourlyRates.jobTitle.errorUpdatingJobTitle",
                        "Error updating job title"
                    )
                    : t(
                        "hourlyRates.jobTitle.errorAddingJobTitle",
                        "Error adding job title to hourly rate"
                    )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                if (!open) {
                    handleCancel();
                }
                onOpenChange(open);
            }}
        >
            <DialogContent className="max-w-2xl" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        {isEditMode
                            ? t("hourlyRates.jobTitle.editJobTitle", "Edit - {{name}}", { name: rateJobTitle?.job_title.name })
                            : t("hourlyRates.jobTitle.addJobTitleToHourlyRate", "Add Job Title to Hourly Rate")}
                        {isEditMode && rateJobTitle && (
                            <IdBadge id={rateJobTitle.job_title.id} />
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 mt-2">
                        <div className="grid gap-4">
                            {/* Job Title Select */}
                            {!isEditMode && (
                                <FormField
                                    control={form.control}
                                    name="job_title_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("hourlyRates.jobTitle.selectJobTitle", "Job Title")} *
                                            </FormLabel>
                                            <FormControl>
                                                <MultiSelectApi
                                                    fetchOptions={getOrgJobTitles}
                                                    fetchArgs={[orgId]}
                                                    optionsKey="job_titles"
                                                    className="w-full truncate"
                                                    maxCount={1}
                                                    customValueKey={(item) => item.id}
                                                    customLabelKey={(item) => <Tag text={item.name} />}
                                                    placeholder={t(
                                                        "hourlyRates.jobTitle.selectJobTitlePlaceholder",
                                                        "Select a job title..."
                                                    )}
                                                    searchPlaceholder={t(
                                                        "hourlyRates.jobTitle.searchJobTitlePlaceholder",
                                                        "Search job titles..."
                                                    )}
                                                    emptyText={t(
                                                        "hourlyRates.jobTitle.noJobTitlesFound",
                                                        "No job titles found"
                                                    )}
                                                    onChangeValue={(value) => {
                                                        field.onChange(value);
                                                    }}
                                                    onChangeValueWithItem={(value, _itemsMap, lastItem) => {
                                                        field.onChange(value);
                                                        if (lastItem) {
                                                            if (lastItem.pmc !== null && lastItem.pmc !== undefined) {
                                                                form.setValue("pmc", lastItem.pmc);
                                                            }
                                                            if (lastItem.pvp !== null && lastItem.pvp !== undefined) {
                                                                form.setValue("default_pvp", lastItem.pvp);
                                                            }
                                                        }
                                                    }}
                                                    value={field.value}
                                                    isApiSearchable={true}
                                                    searchable={true}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Default PVP */}
                            <FormField
                                control={form.control}
                                name="default_pvp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("hourlyRates.jobTitle.defaultPvp", "Default PVP")} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={t(
                                                    "hourlyRates.jobTitle.defaultPvpPlaceholder",
                                                    "Enter default price..."
                                                )}
                                                disabled={isLoading}
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* PMC */}
                            <FormField
                                control={form.control}
                                name="pmc"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("hourlyRates.jobTitle.pmc", "PMC")} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={t(
                                                    "hourlyRates.jobTitle.pmcPlaceholder",
                                                    "Enter PMC..."
                                                )}
                                                disabled={isLoading}
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                {/* Min Quantity */}
                                <FormField
                                    control={form.control}
                                    name="min_quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("hourlyRates.jobTitle.minQuantity", "Min Quantity (min)")} *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    placeholder={t(
                                                        "hourlyRates.jobTitle.minQuantityPlaceholder",
                                                        "Enter min quantity..."
                                                    )}
                                                    disabled={isLoading}
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Step Quantity */}
                                <FormField
                                    control={form.control}
                                    name="step_quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("hourlyRates.jobTitle.stepQuantity", "Step Quantity (min)")} *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    placeholder={t(
                                                        "hourlyRates.jobTitle.stepQuantityPlaceholder",
                                                        "Enter step quantity..."
                                                    )}
                                                    disabled={isLoading}
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isLoading}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button onClick={form.handleSubmit(handleSubmit)} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {isEditMode
                                            ? t("common.saving", "Saving...")
                                            : t("common.adding", "Adding...")}
                                    </>
                                ) : (
                                    isEditMode
                                        ? t("common.save", "Save Changes")
                                        : t("hourlyRates.jobTitle.addJobTitle", "Add Job Title")
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default HourlyRateJobTitleAddModal;

