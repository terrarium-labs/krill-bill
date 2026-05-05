"use client";

import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { Building, Building2, Phone, Truck, User, UsersRound } from "lucide-react";
import { MultiSelectApi } from "./multi-select-api";
import { getPlannerEntityLabelRenderer } from "@/utils/labels";
import { getOrgEmployees } from "@/api/employees/employees";
import { getOrgVehicles } from "@/api/orgs/vehicles/vehicles";
import { getWorkplaces } from "@/api/orgs/workplaces/workplaces";
import { getOrgGroups } from "@/api/orgs/groups/groups";
import { getOrgOnCallGroups } from "@/api/field-service/on-call/groups/groups";
import type { PlannerExceptionEntityType } from "@/types/planner/planner-exceptions";
import { getClients } from "@/api/clients/clients";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/** Fetch wiring + icon only (no i18n at module scope). */
type EntityFetchBase = {
    fetchOptions: (...args: any[]) => Promise<any>;
    optionsKey: string;
    fetchArgs: any[];
    icon: LucideIcon;
};

const ENTITY_FETCH_BASE: Record<PlannerExceptionEntityType, EntityFetchBase> = {
    employee: {
        fetchOptions: getOrgEmployees,
        optionsKey: "employees",
        fetchArgs: [undefined, undefined, undefined, undefined, undefined, undefined],
        icon: User,
    },
    vehicle: {
        fetchOptions: getOrgVehicles,
        optionsKey: "vehicles",
        fetchArgs: [],
        icon: Truck,
    },
    workplace: {
        fetchOptions: getWorkplaces,
        optionsKey: "workplaces",
        fetchArgs: [],
        icon: Building2,
    },
    group: {
        fetchOptions: getOrgGroups,
        optionsKey: "groups",
        fetchArgs: [],
        icon: UsersRound,
    },
    on_call_group: {
        fetchOptions: getOrgOnCallGroups,
        optionsKey: "on_call_groups",
        fetchArgs: [],
        icon: Phone,
    },
    client: {
        fetchOptions: getClients,
        optionsKey: "clients",
        fetchArgs: [],
        icon: Building,
    },
};

const ENTITY_LABEL_FALLBACKS: Record<PlannerExceptionEntityType, string> = {
    employee: "Employee",
    group: "Group",
    vehicle: "Vehicle",
    workplace: "Workplace",
    on_call_group: "On-call group",
    client: "Client",
};

/** [i18n key, English default] for value-picker placeholder per entity */
const ENTITY_PLACEHOLDER_I18N: Record<PlannerExceptionEntityType, [string, string]> = {
    employee: ["common.entities.selectEmployee", "Select employee"],
    group: ["common.entities.selectGroup", "Select group"],
    vehicle: ["common.entities.selectVehicle", "Select vehicle"],
    workplace: ["common.entities.selectWorkplace", "Select workplace"],
    on_call_group: ["common.entities.selectOnCallGroup", "Select on-call group"],
    client: ["common.entities.selectClient", "Select client"],
};

export type EntityDefinition = EntityFetchBase & {
    label: string;
    placeholder: string;
};

function getEntityDefinitions(t: TFunction): Record<PlannerExceptionEntityType, EntityDefinition> {
    const keys = Object.keys(ENTITY_FETCH_BASE) as PlannerExceptionEntityType[];
    return keys.reduce(
        (acc, et) => {
            const base = ENTITY_FETCH_BASE[et];
            const [phKey, phDefault] = ENTITY_PLACEHOLDER_I18N[et];
            acc[et] = {
                ...base,
                label: t(`common.entities.${et}`, ENTITY_LABEL_FALLBACKS[et]),
                placeholder: t(phKey, phDefault),
            };
            return acc;
        },
        {} as Record<PlannerExceptionEntityType, EntityDefinition>
    );
}

function useEntityDefinitions(): Record<PlannerExceptionEntityType, EntityDefinition> {
    const { t } = useTranslation();
    return useMemo(() => getEntityDefinitions(t), [t]);
}

type BaseMultiSelectApiEntityProps = {
    orgId: string | undefined;
    value: string[];
    onChangeValue: (value: string[]) => void;
    defaultItems?: any[];
    /** Fallback when overrides and entity definition do not apply */
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    maxCount?: number;
    /** Optional callback with full item data when selection changes */
    onChangeValueWithItem?: (value: string[], items: Map<string, any>, lastChangedItem: any | null) => void;
};

export type MultiSelectApiEntitySingleProps = BaseMultiSelectApiEntityProps & {
    entityType: PlannerExceptionEntityType;
};

export type MultiSelectApiEntityMultiProps = BaseMultiSelectApiEntityProps & {
    entityTypes: PlannerExceptionEntityType[];
    entityType: PlannerExceptionEntityType;
    onEntityTypeChange: (next: PlannerExceptionEntityType) => void;
    /** How the entity switcher is rendered (icons: icon-only trigger, same labeled options in the list) */
    selectorDisplay?: "default" | "icons";
    /** Override display labels for entity options */
    entityLabels?: Partial<Record<PlannerExceptionEntityType, string>>;
    /** Override per-entity placeholder for the value picker */
    entityPlaceholders?: Partial<Record<PlannerExceptionEntityType, string>>;
};

export type MultiSelectApiEntityProps = MultiSelectApiEntitySingleProps | MultiSelectApiEntityMultiProps;

function isMultiProps(props: MultiSelectApiEntityProps): props is MultiSelectApiEntityMultiProps {
    return "entityTypes" in props && Array.isArray(props.entityTypes) && props.entityTypes.length > 1;
}

function EntityMultiSelectInner({
    entityType,
    orgId,
    value,
    onChangeValue,
    defaultItems,
    placeholder,
    className,
    disabled,
    maxCount = 1,
    onChangeValueWithItem,
    attachLeft,
}: {
    entityType: PlannerExceptionEntityType;
    attachLeft: boolean;
} & Omit<BaseMultiSelectApiEntityProps, "placeholder"> & { placeholder: string }) {
    const config = ENTITY_FETCH_BASE[entityType];
    const customLabelKey = getPlannerEntityLabelRenderer(entityType);

    if (!config || !orgId) return null;

    return (
        <MultiSelectApi
            key={entityType}
            fetchOptions={config.fetchOptions}
            fetchArgs={[orgId, ...(config.fetchArgs || [])]}
            optionsKey={config.optionsKey}
            value={value}
            onChangeValue={onChangeValue}
            onChangeValueWithItem={onChangeValueWithItem}
            customValueKey={(item: any) => item.id}
            customLabelKey={(item: any) => (customLabelKey ? customLabelKey(item) : item?.name ?? String(item))}
            customSelectedLabelKey={(item: any) => (customLabelKey ? customLabelKey(item) : item?.name ?? String(item))}
            placeholder={placeholder}
            defaultItems={defaultItems}
            maxCount={maxCount}
            disabled={disabled}
            className={cn(
                attachLeft && "rounded-l-none border-l border-border -ml-px",
                "min-w-0 flex-1",
                className
            )}
        />
    );
}

function EntityTypeSelector({
    entityTypes,
    entityType,
    onEntityTypeChange,
    selectorDisplay,
    definitions,
    entityLabels,
    disabled,
}: {
    entityTypes: PlannerExceptionEntityType[];
    entityType: PlannerExceptionEntityType;
    onEntityTypeChange: (next: PlannerExceptionEntityType) => void;
    selectorDisplay: "default" | "icons";
    definitions: Record<PlannerExceptionEntityType, EntityDefinition>;
    entityLabels?: Partial<Record<PlannerExceptionEntityType, string>>;
    disabled?: boolean;
}) {
    const labelFor = (etype: PlannerExceptionEntityType) =>
        entityLabels?.[etype] ?? definitions[etype].label;

    if (selectorDisplay === "icons") {
        const SelectedIcon = definitions[entityType].icon;
        return (
            <Select
                value={entityType}
                onValueChange={(v) => onEntityTypeChange(v as PlannerExceptionEntityType)}
                disabled={disabled}
            >
                <SelectTrigger
                    className="h-9 w-auto min-w-9 shrink-0 rounded-r-none border-r-0 px-2 shadow-none"
                    aria-label={labelFor(entityType)}
                    title={labelFor(entityType)}
                >
                    <span className="flex flex-1 items-center justify-center" aria-hidden>
                        <SelectedIcon className="h-4 w-4" />
                    </span>
                    <SelectValue className="sr-only" />
                </SelectTrigger>
                <SelectContent>
                    {entityTypes.map((etype) => (
                        <SelectItem key={etype} value={etype}>
                            {labelFor(etype)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    return (
        <Select
            value={entityType}
            onValueChange={(v) => onEntityTypeChange(v as PlannerExceptionEntityType)}
            disabled={disabled}
        >
            <SelectTrigger className="h-9 w-[min(11rem,100%)] shrink-0 rounded-r-none border-r-0 sm:w-44">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {entityTypes.map((etype) => (
                    <SelectItem key={etype} value={etype}>
                        {labelFor(etype)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

/**
 * MultiSelectApi configured for planner exception entity types.
 * Uses label renderers from labels.tsx (same pattern as dropdown-filter-row).
 *
 * Pass `entityTypes` with more than one entry to show an integrated entity switcher
 * (`selectorDisplay`: full label on trigger vs icon-only trigger with the same labeled options).
 */
export function MultiSelectApiEntity(props: MultiSelectApiEntityProps) {
    const definitions = useEntityDefinitions();

    if (isMultiProps(props)) {
        const {
            entityTypes,
            entityType,
            onEntityTypeChange,
            selectorDisplay = "default",
            entityLabels,
            entityPlaceholders,
            orgId,
            value,
            onChangeValue,
            defaultItems,
            placeholder,
            className,
            disabled,
            maxCount,
            onChangeValueWithItem,
        } = props;

        const safeEntityType = entityTypes.includes(entityType) ? entityType : entityTypes[0]!;

        const resolvedPlaceholder =
            entityPlaceholders?.[safeEntityType] ??
            placeholder ??
            definitions[safeEntityType].placeholder;

        return (
            <div className={cn("flex w-full min-w-0 flex-row items-stretch", className)}>
                <EntityTypeSelector
                    entityTypes={entityTypes}
                    entityType={safeEntityType}
                    onEntityTypeChange={onEntityTypeChange}
                    selectorDisplay={selectorDisplay}
                    definitions={definitions}
                    entityLabels={entityLabels}
                    disabled={disabled}
                />
                <EntityMultiSelectInner
                    entityType={safeEntityType}
                    orgId={orgId}
                    value={value}
                    onChangeValue={onChangeValue}
                    defaultItems={defaultItems}
                    placeholder={resolvedPlaceholder}
                    disabled={disabled}
                    maxCount={maxCount}
                    onChangeValueWithItem={onChangeValueWithItem}
                    attachLeft
                />
            </div>
        );
    }

    const {
        entityType,
        orgId,
        value,
        onChangeValue,
        defaultItems,
        placeholder,
        className,
        disabled,
        maxCount,
        onChangeValueWithItem,
    } = props;

    const resolvedSinglePlaceholder = placeholder ?? definitions[entityType].placeholder;

    return (
        <EntityMultiSelectInner
            entityType={entityType}
            orgId={orgId}
            value={value}
            onChangeValue={onChangeValue}
            defaultItems={defaultItems}
            placeholder={resolvedSinglePlaceholder}
            disabled={disabled}
            maxCount={maxCount}
            onChangeValueWithItem={onChangeValueWithItem}
            attachLeft={false}
            className={className}
        />
    );
}
