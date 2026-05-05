import React from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptySpaceProps {
  icon: LucideIcon;
  buttonIcon?: LucideIcon;
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
  className?: string;
  asCard?: boolean;
}

const EmptySpace: React.FC<EmptySpaceProps> = ({
  icon: Icon,
  buttonIcon: ButtonIcon,
  title,
  description,
  buttonText,
  onButtonClick,
  className,
  asCard = false,
}) => {
  const content = (
    <div className="flex items-center justify-center space-y-4 flex-col py-8 min-h-40">
      <Icon className="h-10 w-10 text-muted-foreground" />
      <div className="flex flex-col items-center justify-center">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {buttonText && onButtonClick && (
        <Button
          variant="outline"
          onClick={onButtonClick}
        >
          {ButtonIcon && <ButtonIcon className="h-4 w-4" />}
          {buttonText}
        </Button>
      )}
    </div>
  );

  if (asCard) {
    return (
      <Card
        className={cn(
          "border-1 border-dashed border-border hover:border-accent transition-colors",
          className
        )}
      >
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    );
  }

  return (
    <div
      className={cn(
        "border-0 border-dashed border-border hover:border-accent transition-colors rounded-lg",
        className
      )}
    >
      {content}
    </div>
  );
};

export default EmptySpace;
