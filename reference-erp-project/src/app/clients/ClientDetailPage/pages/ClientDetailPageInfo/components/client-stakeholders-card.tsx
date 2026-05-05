import React, { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';

import { useTranslation } from '@/hooks/useTranslation';
import { getClientStakeholders } from '@/api/clients/stakeholders/stakeholders';
import { ClientStakeholder } from '@/types/clients/client';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import StakeholderModal from './stakeholder-modal';
import StakeholderInfoModal from './stakeholder-info-modal';
import { useClient } from '../../../../contexts/ClientContext';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';
interface ClientStakeholdersCardProps {
}

const ClientStakeholdersCard: React.FC<ClientStakeholdersCardProps> = () => {
    const [stakeholders, setStakeholders] = useState<ClientStakeholder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewStakeholder, setViewStakeholder] = useState<ClientStakeholder | null>(null);
    const { client } = useClient();

    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string; clientId: string }>();

    const loadStakeholders = async (pageToken: string | null = null, append = false) => {
        if (!orgId || !client.id) return;

        setIsLoading(true);
        try {
            const response = await getClientStakeholders(orgId, client.id, pageToken || undefined);

            if (response.success) {
                const newStakeholders = response.success.stakeholders || [];
                setStakeholders(append ? [...stakeholders, ...newStakeholders] : newStakeholders);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t('clients.errorLoadingStakeholders', 'Failed to load stakeholders'));
            }
        } catch (error) {
            console.error('Error loading stakeholders:', error);
            toast.error(t('clients.errorLoadingStakeholders', 'Failed to load stakeholders'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStakeholders();
    }, []);

    const handleStakeholderSaved = () => {
        loadStakeholders();
        setIsCreateModalOpen(false);
    };

    const handleStakeholderDeleted = () => {
        loadStakeholders();
        setViewStakeholder(null);
    };

    return (
        <>
            <Card className="shadow-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 justify-between">
                        {t('clients.stakeholders', 'Stakeholders')}
                        <Button onClick={() => setIsCreateModalOpen(true)} size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                            {t('clients.addStakeholder', 'Add')}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-4">
                    {/* Stakeholders List */}
                    {stakeholders.length === 0 ? (
                        <div className="text-center py-4">
                            <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <h3 className="text-md font-medium text-muted-foreground">
                                {t('clients.noStakeholders', 'No stakeholders yet')}
                            </h3>
                            <p className="text-muted-foreground mb-4 text-xs">
                                {t('clients.addFirstStakeholder', 'Add your first stakeholder to get started')}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {stakeholders.map((stakeholder, index) => (
                                <div key={stakeholder.id}>
                                    <div
                                        className="hover:bg-accent/50 transition-colors cursor-pointer p-2 rounded-lg"
                                        onClick={() => setViewStakeholder(stakeholder)}
                                    >
                                        <EmployeeAvatar employee={stakeholder.employee} showName={true} size="sm" variant="full" />
                                    </div>
                                    {index < stakeholders.length - 1 && <Separator />}
                                </div>
                            ))}

                            {/* Load More Button */}
                            {nextPageToken && (
                                <div className="text-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => loadStakeholders(nextPageToken, true)}
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

            {/* Modal for creating stakeholder */}
            <StakeholderModal
                open={isCreateModalOpen}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setIsCreateModalOpen(false);
                    }
                }}
                onStakeholderSaved={handleStakeholderSaved}
                clientId={client.id}
            />

            {/* Modal for viewing stakeholder info */}
            <StakeholderInfoModal
                stakeholder={viewStakeholder}
                open={!!viewStakeholder}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setViewStakeholder(null);
                    }
                }}
                onStakeholderDeleted={handleStakeholderDeleted}
                clientId={client.id}
            />
        </>
    );
};

export default ClientStakeholdersCard;

