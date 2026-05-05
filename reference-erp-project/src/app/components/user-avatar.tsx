import { User } from "lucide-react";
import {
  Avatar as UIAvatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { getColorFromString } from "@/utils/miscelanea";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  fallbackColor?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "rounded" | "square";
  className?: string;
  showUserIcon?: boolean;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-24 w-24",
};

const fallbackTextSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base font-semibold",
  xl: "text-lg font-semibold",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
  xl: "h-10 w-10",
};

export function UserAvatar({
  src,
  alt,
  name = "User",
  fallbackColor,
  size = "md",
  variant = "rounded",
  className = "",
  showUserIcon = true,
}: AvatarProps) {
  // Generate initials from name
  const initials = name
    .split(" ")
    .map((word: string) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Generate color if not provided
  const backgroundColor = fallbackColor || getColorFromString(name);

  // Determine border radius based on variant
  const borderRadius = variant === "square" ? "rounded-md" : "rounded-full";

  const avatarClasses = `${sizeClasses[size]} ${borderRadius} ${className}`;
  const fallbackClasses = `${borderRadius} text-white ${fallbackTextSizes[size]}`;

  return (
    <UIAvatar className={avatarClasses}>
      {src && (
        <AvatarImage
          className="object-cover"
          src={src}
          alt={alt || name}
        />
      )}
      <AvatarFallback className={fallbackClasses} style={{ backgroundColor }}>
        {initials || (showUserIcon && <User className={iconSizes[size]} />)}
      </AvatarFallback>
    </UIAvatar>
  );
}
