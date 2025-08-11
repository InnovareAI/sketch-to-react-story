import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EnhancedConversationalInterface } from "@/components/workspace/EnhancedConversationalInterface";
import { ModeSwitcher } from "@/components/workspace/ModeSwitcher";
import { Menu, X, Command, Home, Settings, LogOut, HelpCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

export default function AgentFullScreen() {
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [operationMode, setOperationMode] = useState<'inbound' | 'outbound'>('outbound');
  
  // Handle mode change
  const handleModeChange = (mode: 'inbound' | 'outbound') => {
    setOperationMode(mode);
    // This will trigger SAM to switch specialist teams
    console.log(`Switching to ${mode} mode`);
  };

  // Keyboard shortcut for command palette
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const commands = [
    {
      group: "Actions",
      items: [
        { name: "New Campaign", action: () => navigate('/campaign-setup'), shortcut: "⌘N" },
        { name: "Find Leads", action: () => {}, shortcut: "⌘F" },
        { name: "View Analytics", action: () => navigate('/dashboard'), shortcut: "⌘A" },
        { name: "Upload Training Data", action: () => {}, shortcut: "⌘U" },
      ]
    },
    {
      group: "Navigation",
      items: [
        { name: "Dashboard", action: () => navigate('/dashboard') },
        { name: "Campaigns", action: () => navigate('/campaigns') },
        { name: "Contacts", action: () => navigate('/contacts') },
        { name: "Settings", action: () => navigate('/workspace-settings') },
      ]
    }
  ];

  return (
    <div className="h-screen w-full bg-gray-900 flex flex-col">
      {/* Minimal Header Bar */}
      <header className="h-auto md:h-14 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-2 md:py-0">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <img 
              src="/lovable-uploads/f38e3099-bf46-483c-9a94-d1b4f8b34cb6.png" 
              alt="SAM AI" 
              className="h-6 cursor-pointer"
              onClick={() => navigate('/')}
            />
          
            {/* Command Palette Trigger */}
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:flex items-center gap-2 text-xs bg-gray-800 border-gray-700 hover:bg-gray-700"
              onClick={() => setCommandOpen(true)}
            >
              <Command className="h-3 w-3" />
              <span>Commands</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-600 bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-400">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
          
          {/* Mode Switcher - Always visible */}
          <div className="mt-2 md:mt-0 md:flex-1 md:flex md:justify-center">
            <ModeSwitcher 
              currentMode={operationMode}
              onModeChange={handleModeChange}
              className="w-full md:w-auto"
            />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
          {/* Help */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={() => {}}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
              <DropdownMenuItem onClick={() => navigate('/workspace-settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Full Screen Chat Interface */}
      <main className="flex-1 overflow-hidden">
        <EnhancedConversationalInterface operationMode={operationMode} />
      </main>

      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {commands.map((group) => (
            <CommandGroup key={group.group} heading={group.group}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.name}
                  onSelect={() => {
                    item.action();
                    setCommandOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <span>{item.name}</span>
                  {item.shortcut && (
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      {item.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}