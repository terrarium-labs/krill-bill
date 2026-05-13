import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface ColorPickerButtonProps {
  selectedColor: string;
  onClick: () => void;
  className?: string;
}

export function ColorPickerButton({
  selectedColor,
  onClick,
  className = '',
}: ColorPickerButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      variant="theme"
      onClick={onClick}
      className={`flex items-center gap-2 ${className}`}
      title={t('colorPicker.currentColor', 'Current color: {{color}}', { color: selectedColor })}
      aria-label={t('colorPicker.aria', 'Current color: {{color}}. Click to open color picker.', { color: selectedColor })}
    >
      <span className="font-medium capitalize">
        {selectedColor}
      </span>
    </Button>
  );
}
