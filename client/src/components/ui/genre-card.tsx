import { cn } from "@/lib/utils";

interface GenreCardProps {
  id: number;
  name: string;
  imageUrl?: string;
  onClick?: (id: number) => void;
  className?: string;
}

export function GenreCard({ id, name, imageUrl, onClick, className }: GenreCardProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg cursor-pointer group",
        className
      )}
      onClick={() => onClick?.(id)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(id);
        }
      }}
    >
      <img 
        src={imageUrl || `https://placehold.co/300x150/1e1e1e/f5f5f5?text=${name}`} 
        alt={name} 
        className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-110" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent flex items-end">
        <h3 className="text-lg font-medium p-3 w-full">{name}</h3>
      </div>
    </div>
  );
}
