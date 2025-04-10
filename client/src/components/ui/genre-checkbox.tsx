import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface GenreCheckboxProps {
  id: number;
  name: string;
  checked?: boolean;
  onChange?: (id: number, checked: boolean) => void;
  className?: string;
}

export function GenreCheckbox({ 
  id, 
  name, 
  checked = false, 
  onChange,
  className 
}: GenreCheckboxProps) {
  return (
    <div className={cn(
      "cursor-pointer bg-zinc-950 hover:bg-zinc-900 rounded-lg p-3 flex items-center space-x-2",
      className
    )}>
      <Checkbox 
        id={`genre-${id}`} 
        checked={checked}
        onCheckedChange={(checked) => {
          onChange?.(id, checked as boolean);
        }}
        className="text-amber-500 focus:ring-amber-500"
      />
      <Label 
        htmlFor={`genre-${id}`}
        className="cursor-pointer w-full"
      >
        {name}
      </Label>
    </div>
  );
}
