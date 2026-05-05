import { File, Download, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import DateLabel from "@/app/components/labels/date-label";

import {
    formatSessionMaterialFileSize,
    getSessionMaterialFileLabel,
} from "./training-session-material-helpers";

/** Shared shape for training-level and session-level attachment rows. */
export interface TrainingMaterialRowModel {
    id: string;
    name: string;
    file_url: string;
    file_type?: string | null;
    file_size?: number | null;
    created_at: string;
    read_required?: boolean | null;
}

export type TrainingSessionMaterialRowVariant = "edit" | "view";

export interface TrainingSessionMaterialRowProps {
    material: TrainingMaterialRowModel;
    variant: TrainingSessionMaterialRowVariant;
    onDownload: () => void;
    onDelete?: () => void;
    onReadRequiredChange?: (value: boolean) => void;
    readPatching?: boolean;
}

const TrainingSessionMaterialRow = ({
    material,
    variant,
    onDownload,
    onDelete,
    onReadRequiredChange,
    readPatching = false,
}: TrainingSessionMaterialRowProps) => {
    const { t } = useTranslation();

    return (
        <div
            className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-3"
        >
            <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <File className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                        {material.name}
                    </span>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                            {getSessionMaterialFileLabel(material.file_type)}
                        </Badge>
                        <span>
                            {formatSessionMaterialFileSize(material.file_size)}
                        </span>
                        <DateLabel data={material.created_at} />
                        {variant === "view" && material.read_required === true && (
                            <Badge variant="outline" className="text-xs font-normal">
                                {t(
                                    "trainings.sessions.materials.mustReadShort",
                                    "Must read"
                                )}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-center">
                {variant === "edit" && onReadRequiredChange && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                                <span className="hidden max-w-28 truncate text-xs text-muted-foreground sm:inline">
                                    {t(
                                        "trainings.sessions.materials.mustReadShort",
                                        "Must read"
                                    )}
                                </span>
                                <Switch
                                    className="shrink-0"
                                    checked={material.read_required === true}
                                    disabled={readPatching}
                                    onCheckedChange={onReadRequiredChange}
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            className="max-w-xs text-xs"
                        >
                            {t(
                                "trainings.sessions.materials.requireReadPerFile",
                                "Learners must open this file before they can complete the session."
                            )}
                        </TooltipContent>
                    </Tooltip>
                )}
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onDownload}
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    {variant === "edit" && onDelete && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={onDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainingSessionMaterialRow;
