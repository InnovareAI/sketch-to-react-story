import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
        <span className={cn(size.text, "text-gray-900")}>
          InnovareAI
        </span>
        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-2 py-0.5 text-xs">
          Pro
        </Badge>
      </div>
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