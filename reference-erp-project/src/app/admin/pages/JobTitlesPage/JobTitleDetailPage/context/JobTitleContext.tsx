import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { getOrgJobTitle } from '@/api/orgs/job-titles/job-titles';
import { JobTitle } from '@/types/general/job-titles';

interface JobTitleContextType {
    jobTitle: JobTitle | null;
    isLoading: boolean;
    error: string | null;
    refetchJobTitle: () => Promise<void>;
}

const JobTitleContext = createContext<JobTitleContextType | undefined>(undefined);

interface JobTitleProviderProps {
    children: ReactNode;
}

export const JobTitleProvider: React.FC<JobTitleProviderProps> = ({ children }) => {
    const { orgId, jobTitleId } = useParams<{ orgId: string; jobTitleId: string }>();
    const { t } = useTranslation();
    const [jobTitle, setJobTitle] = useState<JobTitle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchJobTitle = async () => {
        if (!orgId || !jobTitleId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await getOrgJobTitle(orgId, jobTitleId);
            if (response?.success?.job_title) {
                setJobTitle(response.success.job_title);
            } else {
                setError(t('admin.jobTitles.errorFetchingJobTitle', 'Error fetching job title'));
                toast.error(t('admin.jobTitles.errorFetchingJobTitle', 'Error fetching job title'));
            }
        } catch (err) {
            const errorMessage = t('admin.jobTitles.errorFetchingJobTitle', 'Error fetching job title');
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Error fetching job title:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const refetchJobTitle = async () => {
        await fetchJobTitle();
    };

    useEffect(() => {
        fetchJobTitle();
    }, [orgId, jobTitleId]);

    const value: JobTitleContextType = {
        jobTitle,
        isLoading,
        error,
        refetchJobTitle,
    };

    return (
        <JobTitleContext.Provider value={value}>
            {children}
        </JobTitleContext.Provider>
    );
};

export const useJobTitle = (): JobTitleContextType => {
    const context = useContext(JobTitleContext);
    if (!context) {
        throw new Error('useJobTitle must be used within a JobTitleProvider');
    }
    return context;
};

