import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface LanguageButtonProps {
    className?: string;
}

const LanguageButton = (({ className = '' }: LanguageButtonProps) => {
    const { t, i18n } = useTranslation();
    const languageName = t(`languages.current`);
    const languageCode = i18n.language.toUpperCase();

    return (
        <Button
            variant="outline"
            className={`flex items-center gap-2 ${className}`}
        >
            <Globe size={18} />
            <span className="font-medium">
                {languageName} ({languageCode})
            </span>
        </Button>
    );
}
);

export default LanguageButton;