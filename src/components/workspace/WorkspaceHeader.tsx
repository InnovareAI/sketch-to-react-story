import { Search, Bell, Plus, User, MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { NotificationCenter } from "@/components/ui/notification-center";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkspaceHeaderProps {
  isConversational: boolean;
  onToggleMode: (conversational: boolean) => void;
}

export function WorkspaceHeader({ isConversational, onToggleMode }: WorkspaceHeaderProps) {
  return (
    <header className={`border-b px-4 lg:px-6 py-4 ${isConversational ? 'bg-gray-900 border-gray-700' : 'bg-background border-border'}`}>
      <div className="flex items-center justify-between">
        {/* Left Section - Mode Toggle */}
        <div className="flex items-center gap-3 lg:gap-6">
          <div className={`flex items-center gap-2 lg:gap-4 p-1.5 lg:p-2 rounded-xl border ${isConversational ? 'bg-gray-800 border-gray-600' : 'bg-muted/30 border-border/50'}`}>
            <div className="flex items-center gap-1 lg:gap-2">
               <BarChart3 className={`h-3 w-3 lg:h-4 lg:w-4 ${!isConversational ? 'text-premium-purple' : 'text-gray-400'}`} />
               <span className={`text-xs lg:text-sm font-medium hidden sm:inline ${!isConversational ? (isConversational ? 'text-white' : 'text-foreground') : 'text-gray-400'}`}>
                 Work
               </span>
            </div>
            <Switch 
              checked={isConversational}
              onCheckedChange={onToggleMode}
              className="data-[state=checked]:bg-premium-purple"
            />
            <div className="flex items-center gap-1 lg:gap-2">
               <MessageSquare className={`h-3 w-3 lg:h-4 lg:w-4 ${isConversational ? 'text-premium-purple' : 'text-muted-foreground'}`} />
               <span className={`text-xs lg:text-sm font-medium hidden sm:inline ${isConversational ? 'text-white' : 'text-muted-foreground'}`}>
                 Agent
              </span>
            </div>
          </div>
        </div>
        
        {/* Right Section - Actions & User */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Search - only show in work mode */}
          {!isConversational && (
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Jump into page..."
                className="pl-10 w-48 lg:w-64 bg-muted/50"
              />
            </div>
          )}
          
          {/* Add New Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-2 lg:px-4">
                <Plus className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Add new</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>New Campaign</DropdownMenuItem>
              <DropdownMenuItem>New Contact</DropdownMenuItem>
              <DropdownMenuItem>New Company</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Import Contacts</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Notifications */}
          <NotificationCenter />
          <ThemeToggle />
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`flex items-center gap-2 ${isConversational ? 'text-white hover:text-gray-300' : ''}`}>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">J</span>
                </div>
                <span className={`hidden md:inline-block ${isConversational ? 'text-white' : ''}`}>Jennifer</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Workspace Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}