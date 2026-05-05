import React, { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';

import { useTranslation } from '@/hooks/useTranslation';
import { getEmployeeEmergencyContacts } from '@/api/employees/emergency-contacts/emergency-contacts';
import { EmployeeEmergencyContact } from '@/types/employees/employees';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import EmployeeEmergencyContactEditModal from './employee-emergency-contact-edit-modal';
import EmployeeEmergencyContactInfoModal from './employee-emergency-contact-info-modal';
import { useEmployee } from '../../../../contexts/EmployeeContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getColorFromString } from '@/utils/miscelanea';
import { Mail, Phone } from 'lucide-react';

interface EmployeeEmergencyContactsCardProps {
}

const EmployeeEmergencyContactsCard: React.FC<EmployeeEmergencyContactsCardProps> = () => {
    const [emergencyContacts, setEmergencyContacts] = useState<EmployeeEmergencyContact[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewEmergencyContact, setViewEmergencyContact] = useState<EmployeeEmergencyContact | null>(null);
    const { employee } = useEmployee();

    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string; employeeId: string }>();

    const loadEmergencyContacts = async (pageToken: string | null = null, append = false) => {
        if (!orgId || !employee.id) return;

        setIsLoading(true);
        try {
            const response = await getEmployeeEmergencyContacts(orgId, employee.id, pageToken || undefined);

            if (response.success) {
                const newEmergencyContacts = response.success.emergency_contacts || [];
                setEmergencyContacts(append ? [...emergencyContacts, ...newEmergencyContacts] : newEmergencyContacts);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t('employees.errorLoadingEmergencyContacts', 'Failed to load emergency contacts'));
            }
        } catch (error) {
            console.error('Error loading emergency contacts:', error);
            toast.error(t('employees.errorLoadingEmergencyContacts', 'Failed to load emergency contacts'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEmergencyContacts();
    }, []);

    const handleEmergencyContactSaved = () => {
        loadEmergencyContacts();
        setIsCreateModalOpen(false);
    };

    const handleEmergencyContactDeleted = () => {
        loadEmergencyContacts();
        setViewEmergencyContact(null);
    };

    return (
        <>
            <Card className="shadow-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 justify-between">
                        {t('employees.emergencyContacts', 'Emergency Contacts')}
                        <Button onClick={() => setIsCreateModalOpen(true)} size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                            {t('employees.addEmergencyContact', 'Add')}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-4">
                    {/* Emergency Contacts List */}
                    {emergencyContacts.length === 0 ? (
                        <div className="text-center py-4">
                            <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <h3 className="text-md font-medium text-muted-foreground">
                                {t('employees.noEmergencyContacts', 'No emergency contacts yet')}
                            </h3>
                            <p className="text-muted-foreground mb-4 text-xs">
                                {t('employees.addFirstEmergencyContact', 'Add your first emergency contact to get started')}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {emergencyContacts.map((contact, index) => (
                                <div key={contact.id}>
                                    <div
                                        className="hover:bg-accent/50 transition-colors cursor-pointer p-2 rounded-lg"
                                        onClick={() => setViewEmergencyContact(contact)}
                                    >
                                        <div className="font-medium text-sm flex items-start gap-2">
                                            <Avatar className="h-6 w-6 rounded-full shrink-0">
                                                <AvatarFallback
                                                    className="text-sm font-medium h-6 w-6 rounded-full text-white"
                                                    style={{ backgroundColor: getColorFromString(contact.name) }}
                                                >
                                                    {contact.name?.charAt(0) || '-'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col items-start gap-0 flex-1 min-w-0">
                                                <span className="leading-tight">{contact.name || '-'}</span>
                                                {contact.relationship && (
                                                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                                                        {contact.relationship}
                                                    </p>
                                                )}
                                            </div>
                                            {(contact.phone || contact.email?.trim()) && (
                                                <div className="flex flex-col items-end gap-0.5 shrink-0 text-xs text-muted-foreground text-right max-w-[min(220px,50%)] min-w-0">
                                                    {contact.phone && (
                                                        <div className="flex items-center justify-end gap-1 min-w-0">
                                                            <Phone className="h-3 w-3 shrink-0" />
                                                            <span className="truncate">{contact.phone}</span>
                                                        </div>
                                                    )}
                                                    {contact.email?.trim() && (
                                                        <div className="flex items-center justify-end gap-1 min-w-0 w-full">
                                                            <Mail className="h-3 w-3 shrink-0" />
                                                            <span className="truncate">{contact.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {index < emergencyContacts.length - 1 && <Separator />}
                                </div>
                            ))}

                            {/* Load More Button */}
                            {nextPageToken && (
                                <div className="text-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => loadEmergencyContacts(nextPageToken, true)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal for creating emergency contact */}
            <EmployeeEmergencyContactEditModal
                open={isCreateModalOpen}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setIsCreateModalOpen(false);
                    }
                }}
                onEmergencyContactSaved={handleEmergencyContactSaved}
                employeeId={employee.id}
            />

            {/* Modal for viewing emergency contact info */}
            <EmployeeEmergencyContactInfoModal
                emergencyContact={viewEmergencyContact}
                open={!!viewEmergencyContact}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setViewEmergencyContact(null);
                    }
                }}
                onEmergencyContactDeleted={handleEmergencyContactDeleted}
                employeeId={employee.id}
            />
        </>
    );
};

export default EmployeeEmergencyContactsCard;

