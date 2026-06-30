'use client';

import { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';

// Import duotone icons from pro package
import * as HugeIconsDuotone from '@hugeicons-pro/core-duotone-rounded';
// Fallback to free icons
import * as HugeIconsFree from '@hugeicons/core-free-icons';

// Type guard to check if component is valid
const isValidIcon = (component: any): boolean => {
  return component !== undefined && component !== null;
};

interface IconSelectorProps {
  value: string;
  color?: string;
  onChange: (iconName: string) => void;
  onColorChange?: (color: string) => void;
}

// Soft/pastel colors matching the design
const softColors = [
  { name: 'Yellow', value: '#FEF3C7', label: 'Шар' }, // Light yellow
  { name: 'Orange', value: '#FED7AA', label: 'Улбар шар' }, // Light orange
  { name: 'Blue', value: '#BFDBFE', label: 'Цэнхэр' }, // Light blue
  { name: 'Green', value: '#BBF7D0', label: 'Ногоон' }, // Light green
  { name: 'Purple', value: '#E9D5FF', label: 'Нил ягаан' }, // Light purple
  { name: 'Pink', value: '#FCE7F3', label: 'Ягаан' }, // Light pink
  { name: 'Cyan', value: '#CFFAFE', label: 'Цайвар цэнхэр' }, // Light cyan
  { name: 'Red', value: '#FEE2E2', label: 'Улаан' }, // Light red
  { name: 'Indigo', value: '#E0E7FF', label: 'Индиго' }, // Light indigo
  { name: 'Teal', value: '#CCFBF1', label: 'Ногоон цэнхэр' }, // Light teal
];

// Default color if none selected
const defaultColor = '#FEF3C7'; // Light yellow

// Define all available icons - prioritize duotone, then free icons
const duotoneIconsList: Array<{ name: string; component: any; isDuotone: boolean }> = Object.keys(HugeIconsDuotone)
  .filter(key => key.endsWith('Icon') && typeof (HugeIconsDuotone as any)[key] !== 'undefined')
  .map(key => ({
    name: key,
    component: (HugeIconsDuotone as any)[key],
    isDuotone: true,
  }))
  .filter(icon => icon.component !== undefined && icon.component !== null);

const freeIconsList: Array<{ name: string; component: any; isDuotone: boolean }> = Object.keys(HugeIconsFree)
  .filter(key => key.endsWith('Icon') && typeof (HugeIconsFree as any)[key] !== 'undefined')
  .map(key => ({
    name: key,
    component: (HugeIconsFree as any)[key],
    isDuotone: false,
  }))
  .filter(icon => icon.component !== undefined && icon.component !== null);

// Combine lists, prioritizing duotone icons (remove duplicates from free list)
const freeIconNames = new Set(duotoneIconsList.map(i => i.name));
const allIconsList = [
  ...duotoneIconsList,
  ...freeIconsList.filter(icon => !freeIconNames.has(icon.name))
];

// Popular icons for quick access - using icons that likely exist
const popularIcons = [
  'Book01Icon', 'Book02Icon', 'Book03Icon',
  'File01Icon', 'AiFileIcon',
  'Settings01Icon', 'Settings02Icon',
  'Search01Icon', 'AiSearchIcon',
  'Home01Icon', 'Home02Icon',
  'Wallet01Icon', 'BitcoinWalletIcon',
  'Mail01Icon', 'AiMail01Icon',
  'Calendar01Icon', 'Calendar02Icon',
  'Edit01Icon', 'Edit02Icon',
  'Delete01Icon', 'Delete02Icon',
  'Add01Icon', 'Add02Icon',
  'CheckmarkCircle01Icon', 'CheckmarkCircle02Icon',
];

export default function IconSelector({ value, color, onChange, onColorChange }: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPopular, setShowPopular] = useState(true);
  const [selectedColor, setSelectedColor] = useState(color || defaultColor);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return showPopular 
        ? allIconsList.filter(icon => popularIcons.includes(icon.name))
        : allIconsList;
    }
    
    const query = searchQuery.toLowerCase();
    return allIconsList.filter(icon => 
      icon.name.toLowerCase().includes(query)
    );
  }, [searchQuery, showPopular]);

  const handleSelectIcon = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    if (onColorChange) {
      onColorChange(newColor);
    }
  };

  const selectedIcon = allIconsList.find(icon => icon.name === value);
  const displayColor = color || selectedColor;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Icon (HugeIcons)
      </label>
      
      {/* Color Selector */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Өнгө сонгох
        </label>
        <div className="flex flex-wrap gap-2">
          {softColors.map((colorOption) => (
            <button
              key={colorOption.value}
              type="button"
              onClick={() => handleColorChange(colorOption.value)}
              className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                displayColor === colorOption.value
                  ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-400'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ backgroundColor: colorOption.value }}
              title={colorOption.label}
            >
              {displayColor === colorOption.value && (
                <Check className="h-5 w-5 text-gray-800 mx-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Icon Selector */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
          {selectedIcon && isValidIcon(selectedIcon.component) ? (
            <>
              <div 
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ backgroundColor: displayColor }}
              >
                <HugeiconsIcon 
                  icon={selectedIcon.component as any} 
                  size={20} 
                  color="#374151" 
                  strokeWidth={1.5}
                  {...(selectedIcon.isDuotone ? {
                    primaryColor: "#02251A",
                    secondaryColor: "#6B7280"
                  } : {})}
                />
              </div>
              <span className="text-sm text-gray-600 flex-1">{selectedIcon.name}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400 flex-1">Icon сонгох</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#02251A]/90 flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          {isOpen ? 'Хаах' : 'Сонгох'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[500px] flex flex-col">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowPopular(false);
                }}
                placeholder="Icon хайх..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#02251A] focus:border-[#02251A]"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowPopular(true);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Toggle Popular/All */}
          {!searchQuery && (
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setShowPopular(true)}
                className={`px-3 py-1 text-sm rounded-lg ${
                  showPopular
                    ? 'bg-[#02251A] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Түгээмэл
              </button>
              <button
                onClick={() => setShowPopular(false)}
                className={`px-3 py-1 text-sm rounded-lg ${
                  !showPopular
                    ? 'bg-[#02251A] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Бүгд ({allIconsList.length})
              </button>
            </div>
          )}

          {/* Icon Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 p-2">
              {filteredIcons.map((icon) => {
                const isSelected = icon.name === value;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => handleSelectIcon(icon.name)}
                    className={`p-2 rounded-lg border-2 transition-all hover:bg-gray-50 hover:scale-110 ${
                      isSelected
                        ? 'border-[#02251A] bg-[#02251A]/10'
                        : 'border-gray-200 hover:border-[#02251A]/50'
                    }`}
                    title={icon.name}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {isValidIcon(icon.component) && (
                        <div
                          className="w-8 h-8 flex items-center justify-center rounded-lg"
                          style={{ backgroundColor: displayColor }}
                        >
                          <HugeiconsIcon
                            icon={icon.component as any}
                            size={20}
                            color="#374151"
                            strokeWidth={1.5}
                            {...(icon.isDuotone ? {
                              primaryColor: "#02251A",
                              secondaryColor: "#6B7280"
                            } : {})}
                          />
                        </div>
                      )}
                      {isSelected && (
                        <Check className="h-3 w-3 text-[#02251A]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredIcons.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Icon олдсонгүй
              </div>
            )}
          </div>
        </div>
      )}

      {/* Display selected icon preview */}
      {value && !isOpen && (
        <div className="mt-2 text-xs text-gray-500">
          Сонгосон: <code className="bg-gray-100 px-1 rounded">{value}</code>
          {displayColor && (
            <span className="ml-2">
              Өнгө: <span className="inline-block w-3 h-3 rounded-full align-middle ml-1" style={{ backgroundColor: displayColor }}></span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
