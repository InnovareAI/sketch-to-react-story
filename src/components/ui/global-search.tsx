import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const searchItems = [
  { id: 'dashboard', title: 'Dashboard', url: '/dashboard', category: 'Pages' },
  { id: 'agent', title: 'Agent (Sam)', url: '/agent', category: 'Pages' },
  { id: 'contacts', title: 'Contacts', url: '/contacts', category: 'CRM' },
  { id: 'campaigns', title: 'Campaigns', url: '/campaigns', category: 'Marketing' },
  { id: 'templates', title: 'Templates', url: '/templates', category: 'Marketing' },
  { id: 'inbox', title: 'Global Inbox', url: '/global-inbox', category: 'Communication' },
  { id: 'accounts', title: 'Accounts', url: '/accounts', category: 'CRM' },
  { id: 'search', title: 'Search', url: '/search', category: 'Tools' },
  { id: 'settings', title: 'Workspace Settings', url: '/workspace-settings', category: 'Settings' },
  { id: 'members', title: 'Members', url: '/members', category: 'Settings' },
  { id: 'roles', title: 'Roles & Permissions', url: '/roles', category: 'Settings' },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search...
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, features..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {['Pages', 'CRM', 'Marketing', 'Communication', 'Tools', 'Settings'].map((category) => {
            const categoryItems = searchItems.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;
            
            return (
              <CommandGroup key={category} heading={category}>
                {categoryItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    onSelect={() => handleSelect(item.url)}
                    className="cursor-pointer"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}