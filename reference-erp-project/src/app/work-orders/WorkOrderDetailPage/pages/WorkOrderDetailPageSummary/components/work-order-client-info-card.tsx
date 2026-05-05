import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { ClientAvatar } from "@/app/components/avatars/client-avatar";
import { IconName } from "lucide-react/dynamic";
import { IconInfoItem } from "@/app/components/custom-labels";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatAddress } from "@/utils/miscelanea";
import { getWorkOrderContacts, deleteWorkOrderContact } from "@/api/field-service/work-orders/contacts/contacts";
import { WorkOrderContact } from "@/types/field-service/work-orders/contacts";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { toast } from "sonner";
import WorkOrderContactEditModal from "./modals/work-order-contact-edit-modal";
import SingleItemMap from "@/app/components/maps/single-item-map";

interface WorkOrderClientInfoCardProps {
    workOrder: any;
    editMode?: boolean;
}

const WorkOrderClientInfoCard = ({
    workOrder,
    editMode = false,
}: WorkOrderClientInfoCardProps) => {
    const { t } = useTranslation();
    const { resolvedTheme } = useTheme();
    const { orgId, workOrderId } = useParams<{ orgId: string, workOrderId: string }>();
    const [contacts, setContacts] = useState<WorkOrderContact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<WorkOrderContact | null>(null);

    const location = workOrder?.location;

    // Fetch contacts
    const fetchContacts = async () => {
        if (!orgId || !workOrderId) {
            setContacts([]);
            return;
        }

        setLoadingContacts(true);
        try {
            const response = await getWorkOrderContacts(orgId, workOrderId);
            if (response.success) {
                setContacts(response.success.contacts || []);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoadingContacts(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [orgId, workOrderId]);

    const handleOpenAddModal = () => {
        setEditingContact(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (contact: WorkOrderContact) => {
        setEditingContact(contact);
        setIsModalOpen(true);
    };

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            setEditingContact(null);
        }
    };

    const handleDeleteContact = async (contactId: string) => {
        if (!orgId || !workOrderId) return;

        try {
            const response = await deleteWorkOrderContact(orgId, workOrderId, contactId);
            if (response.success || response === undefined) {
                toast.success(t('workOrders.contactDeletedSuccessfully', 'Contact deleted successfully'));
                fetchContacts();
            } else {
                toast.error(response.error || t('workOrders.errorDeletingContact', 'Error deleting contact'));
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            toast.error(t('workOrders.errorDeletingContact', 'Error deleting contact'));
        }
    };

    return (
        <>
            <div className="space-y-4">
                {/* Map Display */}
                {location && (
                    <div>
                        <SingleItemMap
                            data={location}
                            variant="default"
                            style={resolvedTheme === "dark" ? "dark" : "streets"}
                            zoom={10}
                            pinColor="blue"
                            alt={t('workOrdersDetail.locationMap', 'Location Map')}
                        />
                    </div>
                )}

                <div className="space-y-4">
                    {/* Client Info */}
                    {workOrder?.client && (
                        <div className="flex items-center gap-2">
                            <ClientAvatar size="md" client={workOrder.client} showNameExtra={true} />
                        </div>
                    )}

                    {/* Location Details */}
                    {location && (
                        <div className="space-y-4">

                            {/* Location Name & Address - two separate rows */}
                            <div className="flex flex-col gap-4">
                                {/* Location Name - full width row */}
                                <div className="min-w-0">
                                    <IconInfoItem
                                        icon={location.icon_url as IconName || "store"}
                                        label={t('workOrdersDetail.locationName', 'Location Name')}
                                        value={location.name}
                                        copyable
                                    />
                                </div>

                                {/* Address - full width row */}
                                {formatAddress(location) && (
                                    <div className="min-w-0">
                                        <IconInfoItem
                                            icon={"map-pin"}
                                            label={t('workOrdersDetail.address', 'Address')}
                                            value={formatAddress(location)}
                                            copyable
                                            link
                                            linkValue={
                                                location.latitude !== null && location.longitude !== null
                                                    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
                                                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(location) || '')}`
                                            }
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Distance */}
                            {location.distance !== null && (
                                <IconInfoItem
                                    icon={"route"}
                                    label={t('workOrdersDetail.distance', 'Distance')}
                                    value={`${location.distance} km`}
                                />
                            )}

                            {/* Time to Travel */}
                            {location.time_to_travel !== null && (
                                <IconInfoItem
                                    icon={"clock"}
                                    label={t('workOrdersDetail.timeToTravel', 'Time to Travel')}
                                    value={`${location.time_to_travel} min`}
                                />
                            )}

                            {/* Notes */}
                            {location.notes && (
                                <div className="pt-4 border-t border-border">
                                    <IconInfoItem
                                        icon={"file-text"}
                                        label={t('workOrdersDetail.notes', 'Notes')}
                                        value={location.notes}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Contacts Section */}
                    {workOrderId && (
                        <div className="pt-4 border-t space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-muted-foreground">
                                    {t('workOrdersDetail.contacts', 'Contacts')}
                                </h4>
                                {editMode && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleOpenAddModal}
                                        className="h-7"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        {t('common.add', 'Add')}
                                    </Button>
                                )}
                            </div>
                            {loadingContacts ? (
                                <div className="text-sm text-muted-foreground py-2">
                                    {t('common.loading', 'Loading...')}
                                </div>
                            ) : contacts.length === 0 ? (
                                <div className="text-sm text-muted-foreground py-2">
                                    {t('workOrdersDetail.noContacts', 'No contacts available')}
                                </div>
                            ) : (
                                <div className="overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-muted/10 max-h-[300px] pr-1">
                                    {contacts.map((contact) => {
                                        const hasNotes = contact.notes && contact.notes.trim().length > 0;
                                        const fullName = `${contact.first_name} ${contact.last_name}`.trim();

                                        return (
                                            <div key={contact.id} className="space-y-1.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-medium text-sm">{fullName}</span>
                                                            {hasNotes && (
                                                                <HoverCard>
                                                                    <HoverCardTrigger asChild>
                                                                        <button
                                                                            type="button"
                                                                            className="cursor-help text-muted-foreground hover:text-foreground"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <Info className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </HoverCardTrigger>
                                                                    <HoverCardContent className="w-80">
                                                                        <div className="space-y-3">
                                                                            {/* Notes */}
                                                                            {contact.notes && (
                                                                                <div className="space-y-1.5">
                                                                                    <h5 className="font-semibold text-sm">
                                                                                        {t('clients.notes', 'Notes')}
                                                                                    </h5>
                                                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                                                        {contact.notes}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </HoverCardContent>
                                                                </HoverCard>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1 mt-1">
                                                            {contact.email && (
                                                                <IconInfoItem
                                                                    icon="mail"
                                                                    label=""
                                                                    value={contact.email}
                                                                    copyable
                                                                    link
                                                                    linkValue={`mailto:${contact.email}?subject=${encodeURIComponent(`WorkOrder #${workOrder?.id || ''}`)}`}
                                                                />
                                                            )}
                                                            {contact.phone && (
                                                                <IconInfoItem
                                                                    icon="phone"
                                                                    label=""
                                                                    value={contact.phone}
                                                                    copyable
                                                                    link
                                                                    linkValue={`tel:${contact.phone}`}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                    {editMode && (
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <CustomActionsDropdown
                                                                items={[
                                                                    {
                                                                        label: t('common.edit', 'Edit'),
                                                                        icon: 'edit',
                                                                        onClick: () => handleOpenEditModal(contact),
                                                                    },
                                                                    {
                                                                        label: t('common.delete', 'Delete'),
                                                                        icon: 'trash-2',
                                                                        onClick: () => handleDeleteContact(contact.id),
                                                                        variant: 'destructive',
                                                                    },
                                                                ]}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Edit Modal */}
            {orgId && workOrderId && (
                <WorkOrderContactEditModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    orgId={orgId}
                    workOrderId={workOrderId}
                    clientId={workOrder?.client?.id}
                    contact={editingContact}
                    onSuccess={fetchContacts}
                    onDelete={handleDeleteContact}
                />
            )}
        </>
    );
};

export default WorkOrderClientInfoCard;