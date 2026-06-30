'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import * as HugeIconsDuotone from '@hugeicons-pro/core-duotone-rounded';
import * as HugeIconsFree from '@hugeicons/core-free-icons';

interface CategoryIconProps {
  iconName: string;
  size?: number;
  className?: string;
  color?: string; // Background color for the icon
}

// Dynamically get icon from HugeIcons packages (try duotone first, then free)
const getIconComponent = (iconName: string) => {
  if (!iconName || typeof iconName !== 'string') return null;
  // Try duotone first
  const duotoneIcon = (HugeIconsDuotone as any)[iconName];
  if (duotoneIcon) return duotoneIcon;
  // Fallback to free icons
  return (HugeIconsFree as any)[iconName] || null;
};

export default function CategoryIcon({ iconName, size = 24, className = '', color }: CategoryIconProps) {
  // If it's a URL, use img tag
  if (iconName.startsWith('http') || iconName.startsWith('/')) {
    return (
      <img 
        src={iconName} 
        alt="Category icon"
        className={className}
        style={{ width: size, height: size }}
      />
    );
  }

  // If it's an icon name, use HugeiconsIcon
  const IconComponent = getIconComponent(iconName);
  if (IconComponent) {
    // Check if it's a duotone icon (from pro package)
    const isDuotone = (HugeIconsDuotone as any)[iconName];
    const iconElement = (
      <HugeiconsIcon
        icon={IconComponent as any}
        size={size}
        color="#374151"
        strokeWidth={1.5}
        className={className}
        {...(isDuotone ? {
          primaryColor: "#02251A",
          secondaryColor: "#6B7280"
        } : {})}
      />
    );
    
    // If color is provided, wrap in a colored background container
    if (color) {
      return (
        <div
          className={`flex items-center justify-center rounded-lg ${className}`}
          style={{ 
            backgroundColor: color,
            width: size + 8,
            height: size + 8,
          }}
        >
          {iconElement}
        </div>
      );
    }
    
    return iconElement;
  }

  // Fallback
  return null;
}
