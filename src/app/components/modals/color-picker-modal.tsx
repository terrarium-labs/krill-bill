import { LIST_COLORS } from '@/app/utils/colors';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ColorPickerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  colorHexMap: Record<string, string>;
}

function ColorGrid({
  selectedColor,
  onColorChange,
  colorHexMap,
}: {
  selectedColor: string;
  onColorChange: (color: string) => void;
  colorHexMap: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {LIST_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => {
            onColorChange(color);
          }}
          className={`
            relative w-8 h-8 rounded-lg transition-all
            ${
              selectedColor === color
                ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                : 'hover:scale-105'
            }
          `}
          style={{ backgroundColor: colorHexMap[color] }}
          title={color}
          aria-label={`Select ${color} color`}
        >
          {selectedColor === color && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg">
              <div className="w-1.5 h-1.5 bg-white rounded-full shadow-lg" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export function ColorPickerModal({
  isOpen,
  onOpenChange,
  selectedColor,
  onColorChange,
  colorHexMap,
}: ColorPickerModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('colorPicker.title', 'Choose Accent Color')}</DialogTitle>
          <DialogDescription>
            {t('colorPicker.description', 'Select a color to customize your app\'s accent color for buttons, highlights, and active states.')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ColorGrid
            selectedColor={selectedColor}
            onColorChange={onColorChange}
            colorHexMap={colorHexMap}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('buttons.cancel', 'Cancel')}
          </Button>
          <Button
            type="button"
            variant="theme"
            onClick={() => onOpenChange(false)}
          >
            {t('colorPicker.done', 'Done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
