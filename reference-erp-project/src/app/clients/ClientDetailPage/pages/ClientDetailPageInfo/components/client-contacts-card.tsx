import React, { useState, useEffect } from 'react';
import { Plus, User, Phone, } from 'lucide-react';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { useTranslation } from '@/hooks/useTranslation';
import { getClientContacts } from '@/api/clients/contacts/contacts';
import { ClientContact } from '@/types/clients/client';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import ContactModal from './contact-modal';
import ContactInfoModal from './contact-info-modal';
import { useClient } from '../../../../contexts/ClientContext';
import Tag from '@/app/components/tag/tag';

interface ClientContactsCardProps {
}

const ClientContactsCard: React.FC<ClientContactsCardProps> = () => {
    const [contacts, setContacts] = useState<ClientContact[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editContact, setEditContact] = useState<ClientContact | null>(null);
    const [viewContact, setViewContact] = useState<ClientContact | null>(null);
    const { client } = useClient();

    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string; clientId: string }>();

    const loadContacts = async (pageToken: string | null = null, append = false) => {
        if (!orgId || !client.id) return;

        setIsLoading(true);
        try {
            const response = await getClientContacts(orgId, client.id, undefined, pageToken || undefined);

            if (response.success) {
                const newContacts = response.success.contacts || [];
                setContacts(append ? [...contacts, ...newContacts] : newContacts);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t('clients.errorLoadingContacts', 'Failed to load contacts'));
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            toast.error(t('clients.errorLoadingContacts', 'Failed to load contacts'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadContacts();
    }, []);


    const handleContactSaved = () => {
        loadContacts();
        setIsCreateModalOpen(false);
        setEditContact(null);
    };

    const handleContactDeleted = () => {
        loadContacts();
        setViewContact(null);
    };

    const handleContactDefaultChanged = () => {
        loadContacts();
        setViewContact(null);
    };


    return (
        <>
            <Card className="shadow-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 justify-between">
                        {t('clients.contacts', 'Contacts')}
                        <Button onClick={() => setIsCreateModalOpen(true)} size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                            {t('clients.addContact', 'Add')}
                        </Button>
                    </CardTitle>

                </CardHeader>
                <CardContent className="py-0 px-4">
                    {/* Contacts List */}
                    {contacts.length === 0 ? (
                        <div className="text-center py-4">
                            <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <h3 className="text-md font-medium text-muted-foreground">
                                {t('clients.noContacts', 'No contacts yet')
                                }
                            </h3>
                            <p className="text-muted-foreground mb-4 text-xs">
                                {t('clients.addFirstContact', 'Add your first contact to get started')
                                }
                            </p>
                        </div>
                    ) : (
                        <div>
                            {contacts.map((contact, index) => (
                                <div key={contact.id}>
                                    <div
                                        className="hover:bg-accent/50 transition-colors cursor-pointer p-2 rounded-lg"
                                        onClick={() => setViewContact(contact)}
                                    >
                                        <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
                                            <div className="flex flex-col items-start gap-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-sm truncate">{contact.name}</h4>
                                                    {contact.email && <Mail className="h-3 w-3" />}
                                                    {contact.phone && <Phone className="h-3 w-3" />}
                                                    {contact.is_default && (
                                                        <Tag text={t('clients.default', 'Default')} color='yellow' />
                                                    )}

                                                </div>
                                                {contact.role && <span className="text-xs text-muted-foreground">{contact.role}</span>}
                                            </div>
                                            {/* <div className="flex items-center gap-2">
                                                {contact.phone && <Button variant="ghost" size="icon" onClick={() => {
                                                    window.open(`tel:${contact.phone}`, '_blank');
                                                }}>
                                                    <Phone className="h-4 w-4" />
                                                </Button>}
                                                {contact.email && <Button variant="ghost"  size="icon" onClick={() => {
                                                    window.open(`mailto:${contact.email}`, '_blank');
                                                }}>
                                                    <Mail className="h-4 w-4" />
                                                </Button>}
                                            </div> */}
                                        </div>
                                    </div>
                                    {index < contacts.length - 1 && <Separator />}
                                </div>
                            ))}

                            {/* Load More Button */}
                            {nextPageToken && (
                                <div className="text-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => loadContacts(nextPageToken, true)}
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

            {/* Modal for both new and edit */}
            <ContactModal
                open={isCreateModalOpen || !!editContact}
                onOpenChange={(open: boolean) => {
                    // The ContactModal already handles unsaved changes internally
                    // We just need to handle the state updates when it closes
                    if (!open) {
                        setIsCreateModalOpen(false);
                        setEditContact(null);
                    }
                }}
                onContactSaved={handleContactSaved}
                contact={editContact}
                clientId={client.id}
            />

            {/* Modal for viewing contact info */}
            <ContactInfoModal
                contact={viewContact}
                open={!!viewContact}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setViewContact(null);
                    }
                }}
                onEditContact={(contact) => {
                    setEditContact(contact);
                    setViewContact(null);
                }}
                onContactDeleted={handleContactDeleted}
                onContactDefaultChanged={handleContactDefaultChanged}
                clientId={client.id}
            />
        </>
    );
};

export default ClientContactsCard;
