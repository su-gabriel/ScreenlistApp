import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InsightCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function InsightCard({ title, children, icon, className }: InsightCardProps) {
  return (
    <Card className={`bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-800 shadow-[5px_5px_0px_rgba(183,28,28,0.6)] ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-amber-500 flex items-center gap-2">
          {icon && <span className="text-amber-500">{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  maxValue?: number;
  showPercentage?: boolean;
}

export function ProgressBar({ label, value, maxValue = 100, showPercentage = true }: ProgressBarProps) {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        {showPercentage && <span>{percentage.toFixed(0)}%</span>}
      </div>
      <div className="bg-zinc-950 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-indigo-900 h-2" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface ThemeTagProps {
  children: React.ReactNode;
}

export function ThemeTag({ children }: ThemeTagProps) {
  return (
    <span className="text-sm px-3 py-1 bg-zinc-950 rounded-full inline-block mr-2 mb-2">
      {children}
    </span>
  );
}

export function InsightSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6 font-heading">{title}</h2>
      {children}
    </section>
  );
}
