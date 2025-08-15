import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EnhancedConversationalInterface } from "@/components/workspace/EnhancedConversationalInterface";
import { ModeSwitcher } from "@/components/workspace/ModeSwitcher";
import { Menu, X, Command, Home, Settings, LogOut, HelpCircle, MessageSquare, BarChart3, ArrowLeft } from "lucide-react";
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

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AgentFullScreen Error Details:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white p-8 max-w-md">
            <h2 className="text-2xl font-bold mb-4">Agent Interface Error</h2>
            <p className="text-gray-400 mb-4">The agent interface encountered an error.</p>
            {this.state.error && (
              <details className="text-left bg-gray-800 p-4 rounded mb-4">
                <summary className="text-red-400 cursor-pointer mb-2">Error Details</summary>
                <pre className="text-xs text-gray-300 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Reload Page
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="w-full">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default function AgentFullScreen() {
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [operationMode, setOperationMode] = useState<'inbound' | 'outbound'>('outbound');
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug logging
  useEffect(() => {
    console.log('AgentFullScreen: Component mounted');
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log('AgentFullScreen: Loading complete');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading SAM AI Agent...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        {/* Minimal Header with Navigation */}
        <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">SAM AI Agent</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <ModeSwitcher 
              currentMode={operationMode}
              onModeChange={handleModeChange}
              className="scale-90"
            />
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/campaigns')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Campaigns
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/contacts')}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCommandOpen(true)}>
                  <Command className="mr-2 h-4 w-4" />
                  Command Palette
                  <kbd className="ml-auto text-xs bg-muted px-1 rounded">⌘K</kbd>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Full Screen Chat Interface */}
        <main className="flex-1 overflow-hidden">
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading conversational interface...</p>
              </div>
            </div>
          }>
            <EnhancedConversationalInterface operationMode={operationMode} />
          </React.Suspense>
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
    </ErrorBoundary>
  );
}