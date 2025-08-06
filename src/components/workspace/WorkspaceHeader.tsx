import { Search, Bell, Plus, User, MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
    <header className="border-b border-border bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Mode Toggle */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
              <BarChart3 className={`h-4 w-4 ${!isConversational ? 'text-premium-purple' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${!isConversational ? 'text-foreground' : 'text-muted-foreground'}`}>
                Work Mode
              </span>
            </div>
            <Switch 
              checked={isConversational}
              onCheckedChange={onToggleMode}
              className="data-[state=checked]:bg-premium-purple"
            />
            <div className="flex items-center gap-2">
              <MessageSquare className={`h-4 w-4 ${isConversational ? 'text-premium-purple' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${isConversational ? 'text-foreground' : 'text-muted-foreground'}`}>
                Agent Mode
              </span>
            </div>
          </div>
        </div>
        
        {/* Right Section - Actions & User */}
        <div className="flex items-center gap-4">
          {/* Search - only show in work mode */}
          {!isConversational && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Jump into page..."
                className="pl-10 w-64 bg-muted/50"
              />
            </div>
          )}
          
          {/* Add New Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add new
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
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              3
            </Badge>
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">J</span>
                </div>
                <span className="hidden md:inline-block">Jennifer</span>
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