import { cn } from '@/lib/utils';
import { Bot, Brain, Sparkles } from 'lucide-react';

interface SAMBrandingProps {
  variant?: 'default' | 'compact' | 'large';
  showTagline?: boolean;
  className?: string;
}

export function SAMBranding({ 
  variant = 'default', 
  showTagline = false,
  className 
}: SAMBrandingProps) {
  const sizes = {
    compact: {
      icon: 'h-5 w-5',
      text: 'text-lg font-semibold',
      tagline: 'text-xs'
    },
    default: {
      icon: 'h-6 w-6',
      text: 'text-xl font-bold',
      tagline: 'text-sm'
    },
    large: {
      icon: 'h-8 w-8',
      text: 'text-3xl font-bold',
      tagline: 'text-base'
    }
  };

  const size = sizes[variant];

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Brain className={cn(size.icon, "text-blue-600")} />
          <Sparkles className={cn("absolute -top-1 -right-1 h-3 w-3 text-yellow-500")} />
        </div>
        <span className={cn(size.text, "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent")}>
          SAM
        </span>
        <span className={cn(size.text, "text-gray-700 font-light")}>
          AI
        </span>
      </div>
      {showTagline && (
        <p className={cn(size.tagline, "text-gray-600 mt-1 ml-8")}>
          Your Sales AI Agent
        </p>
      )}
    </div>
  );
}

export function SAMIcon({ className }: { className?: string }) {
  return (
    <div className="relative">
      <Brain className={cn("h-6 w-6 text-blue-600", className)} />
      <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
    </div>
  );
}