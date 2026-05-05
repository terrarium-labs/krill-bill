import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = (namespace?: string) => {
    return useI18nTranslation(namespace);
};

export { Trans } from 'react-i18next'; 