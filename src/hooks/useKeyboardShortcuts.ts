import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useKeyboardShortcuts() {
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Help shortcut
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        toast({
          title: "Keyboard Shortcuts",
          description: "Ctrl+K: Open search | ?: Show help | Esc: Close dialogs | Enter: Send message",
          duration: 5000,
        });
      }

      // Escape to close dialogs/modals
      if (e.key === 'Escape') {
        // This will be handled by individual dialog components
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toast]);
}