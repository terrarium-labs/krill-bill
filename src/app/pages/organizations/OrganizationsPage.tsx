import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { fetchUserOrganizations, createOrganization } from '@/api/organizations';
import { Organization } from '@/types/organization';
import PageHeader from '@/app/components/page-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function OrganizationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  // Load user's organizations
  useEffect(() => {
    const loadOrgs = async () => {
      if (!user || authLoading) return;

      try {
        setIsLoading(true);
        const { data, error } = await fetchUserOrganizations();
        
        if (error) {
          console.error('Error loading orgs:', error);
          toast.error(t('errors.loadingOrganizations', 'Failed to load organizations'));
          setOrgs([]);
        } else {
          setOrgs(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
        toast.error(t('errors.loadingOrganizations', 'Failed to load organizations'));
      } finally {
        setIsLoading(false);
      }
    };

    loadOrgs();
  }, [user?.id, authLoading]);

  const handleSelectOrg = (org: Organization) => {
    // Store selected org in localStorage
    localStorage.setItem('selectedOrgId', org.id);
    localStorage.setItem('selectedOrgName', org.business_name || org.name);
    // Redirect to dashboard
    navigate(`/orgs/${org.id}`);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success(t('toasts.loggedOut', 'Logged out successfully'));
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
      toast.error(t('errors.logout', 'Failed to log out'));
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) {
      toast.error(t('errors.organizationNameRequired', 'Organization name is required'));
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await createOrganization({
        name: newOrgName,
        business_name: newOrgName,
        country: 'ES',
        currency: 'EUR',
      });

      if (error) {
        toast.error(error);
        return;
      }

      if (data) {
        toast.success(t('toasts.organizationCreated', 'Organization created successfully'));
        setOrgs([...orgs, data]);
        setNewOrgName('');
        setModalOpen(false);
        
        // Automatically select the new org
        setTimeout(() => handleSelectOrg(data), 500);
      }
    } catch (err) {
      console.error('Error creating org:', err);
      toast.error(t('errors.creatingOrganization', 'Failed to create organization'));
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || isLoading) {
    return <PageSkeleton showBackButton={false} showIcon={true} tabCount={1} variant="default" />;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <PageHeader
          title={t('pages.selectOrganization.title', 'Select Organization')}
          description={t('pages.selectOrganization.description', 'Choose an organization to manage')}
        />
      </div>

      {/* Create Organization and Logout Buttons */}
      <div className="flex justify-between gap-3">
        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="outline"
          className="flex items-center gap-2"
        >
          <LogOut size={18} />
          {t('actions.logout', 'Log Out')}
        </Button>
        <Button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          {t('pages.selectOrganization.createNew', 'Create Organization')}
        </Button>
      </div>

      {/* Organizations Grid */}
      {orgs.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t('pages.selectOrganization.noOrgs', 'No Organizations')}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t('pages.selectOrganization.createFirstOrg', 'Create your first organization to get started')}
          </p>
          <Button onClick={() => setModalOpen(true)}>
            {t('pages.selectOrganization.createNew', 'Create Organization')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <div
              key={org.id}
              onClick={() => handleSelectOrg(org)}
              className="bg-card border border-border rounded-lg p-6 cursor-pointer hover:border-primary hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold text-foreground mb-1">
                {org.business_name || org.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {org.business_email}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{org.country}</span>
                <span className="font-mono">{org.currency}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Organization Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.selectOrganization.createNew', 'Create Organization')}</DialogTitle>
            <DialogDescription>
              {t('pages.selectOrganization.createDescription', 'Enter the name of your new organization')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                {t('form.organizationName', 'Organization Name')}
              </label>
              <Input
                placeholder={t('form.organizationNamePlaceholder', 'My Company')}
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateOrg();
                }}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  setNewOrgName('');
                }}
              >
                {t('actions.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleCreateOrg}
                disabled={isCreating || !newOrgName.trim()}
              >
                {isCreating ? t('actions.creating', 'Creating...') : t('actions.create', 'Create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
