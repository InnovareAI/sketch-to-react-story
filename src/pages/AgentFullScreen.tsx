import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EnhancedConversationalInterface } from "@/components/workspace/EnhancedConversationalInterface";
import { ModeSwitcher } from "@/components/workspace/ModeSwitcher";
import { Menu, X, Command, Home, Settings, LogOut, HelpCircle, MessageSquare, BarChart3 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
export default function AgentFullScreen() {
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [operationMode, setOperationMode] = useState<'inbound' | 'outbound'>('outbound');
  
  // Handle mode change
  const handleModeChange = (mode: 'inbound' | 'outbound' | 'unified') => {
    const mapped = mode === 'unified' ? 'outbound' : mode;
    setOperationMode(mapped);
    // This will trigger SAM to switch specialist teams
    console.log(`Switching to ${mapped} mode`);
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
      <WorkspaceHeader 
        isConversational={true}
        onToggleMode={() => navigate('/')}
      />
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        <ModeSwitcher 
          currentMode={operationMode}
          onModeChange={handleModeChange}
          className="max-w-2xl mx-auto"
        />
      </div>

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