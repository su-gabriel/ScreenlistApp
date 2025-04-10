import { useState } from "react";
import { cn } from "@/lib/utils";
import { StreamingService } from "../icons/streaming-icons";

interface StreamingBadgeProps {
  service: StreamingService;
  selected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function StreamingBadge({ 
  service, 
  selected = false, 
  onSelect, 
  disabled = false,
  className 
}: StreamingBadgeProps) {
  const [isSelected, setIsSelected] = useState(selected);
  
  const handleClick = () => {
    if (disabled) return;
    
    const newState = !isSelected;
    setIsSelected(newState);
    if (onSelect) {
      onSelect(service.id, newState);
    }
  };
  
  return (
    <div 
      className={cn(
        "cursor-pointer text-center p-3 rounded-lg transition-all transform hover:-translate-y-1",
        isSelected ? "bg-zinc-800" : "bg-zinc-950",
        disabled && "opacity-50 cursor-not-allowed hover:transform-none",
        className
      )}
      onClick={handleClick}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={cn(
        "mx-auto mb-2 w-16 h-16 rounded-full flex items-center justify-center",
        isSelected ? "border-2 border-indigo-900" : "border-2 border-zinc-800",
        service.bgColor ? `bg-[${service.bgColor}]` : "bg-zinc-900"
      )}>
        {service.icon}
      </div>
      <span className="block text-sm font-medium">{service.name}</span>
    </div>
  );
}
