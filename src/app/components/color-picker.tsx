import { useState } from 'react';
import { ColorPickerButton } from './buttons/color-picker-button';
import { ColorPickerModal } from './modals/color-picker-modal';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  label?: string;
}

const COLOR_HEX_MAP: Record<string, string> = {
  red: '#dc2626',
  orange: '#ea580c',
  amber: '#d97706',
  yellow: '#ca8a04',
  lime: '#65a30d',
  green: '#2d9e5f',
  emerald: '#059669',
  teal: '#0d9488',
  cyan: '#0891b2',
  sky: '#0284c7',
  blue: '#2563eb',
  indigo: '#4f46e5',
  violet: '#7c3aed',
  purple: '#9333ea',
  fuchsia: '#c2185b',
  pink: '#ec4899',
  rose: '#e11d48',
  slate: '#475569',
  gray: '#4b5563',
  zinc: '#52525b',
  stone: '#57534e',
};

export function ColorPicker({
  selectedColor,
  onColorChange,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ColorPickerButton
        selectedColor={selectedColor}
        onClick={() => setIsOpen(true)}
      />

      <ColorPickerModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        selectedColor={selectedColor}
        onColorChange={onColorChange}
        colorHexMap={COLOR_HEX_MAP}
      />
    </>
  );
}
