import { useState, useEffect } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  Settings, 
  Users,
  Check,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateUUID } from '@/lib/workspace';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  role: 'owner' | 'admin' | 'member';
  memberCount?: number;
}

export default function WorkspaceSelector() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = () => {
    // Load workspaces from localStorage
    const savedWorkspaces = localStorage.getItem('user_workspaces');
    const currentWorkspaceId = localStorage.getItem('app_workspace_id');
    
    if (savedWorkspaces) {
      const workspaceList = JSON.parse(savedWorkspaces);
      setWorkspaces(workspaceList);
      
      // Find current workspace
      const current = workspaceList.find((w: Workspace) => w.id === currentWorkspaceId);
      if (current) {
        setCurrentWorkspace(current);
      }
    } else {
      // Create default workspace from user profile
      const userProfile = localStorage.getItem('user_auth_profile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        const defaultWorkspace: Workspace = {
          id: profile.workspace_id,
          name: profile.workspace_name || 'My Workspace',
          role: 'owner',
          memberCount: 1
        };
        setWorkspaces([defaultWorkspace]);
        setCurrentWorkspace(defaultWorkspace);
        localStorage.setItem('user_workspaces', JSON.stringify([defaultWorkspace]));
      }
    }
  };

  const switchWorkspace = (workspace: Workspace) => {
    // Update current workspace
    setCurrentWorkspace(workspace);
    localStorage.setItem('app_workspace_id', workspace.id);
    localStorage.setItem('workspace_id', workspace.id);
    
    // Update user profile
    const userProfile = localStorage.getItem('user_auth_profile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      profile.workspace_id = workspace.id;
      profile.workspace_name = workspace.name;
      localStorage.setItem('user_auth_profile', JSON.stringify(profile));
    }
    
    toast.success(`Switched to ${workspace.name}`);
    
    // Reload to apply new workspace
    window.location.reload();
  };

  const createWorkspace = async () => {
    if (!newWorkspace.name) {
      toast.error('Please enter a workspace name');
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const workspace: Workspace = {
        id: generateUUID(),
        name: newWorkspace.name,
        description: newWorkspace.description,
        role: 'owner',
        memberCount: 1
      };
      
      // Add to workspaces list
      const updatedWorkspaces = [...workspaces, workspace];
      setWorkspaces(updatedWorkspaces);
      localStorage.setItem('user_workspaces', JSON.stringify(updatedWorkspaces));
      
      // Switch to new workspace
      switchWorkspace(workspace);
      
      // Reset form and close modal
      setNewWorkspace({ name: '', description: '' });
      setShowCreateModal(false);
      
      toast.success('Workspace created successfully!');
    } catch (error) {
      toast.error('Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
    window.location.reload();
  };

  if (!currentWorkspace) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-3 py-2 h-auto"
          >
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">{currentWorkspace.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {currentWorkspace.role} • {currentWorkspace.memberCount || 1} member{(currentWorkspace.memberCount || 1) !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => switchWorkspace(workspace)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <div>
                    <div className="text-sm">{workspace.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {workspace.role}
                    </div>
                  </div>
                </div>
                {workspace.id === currentWorkspace.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Workspace
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => navigate('/workspace-settings')}
            className="cursor-pointer"
          >
            <Settings className="h-4 w-4 mr-2" />
            Workspace Settings
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => navigate('/members')}
            className="cursor-pointer"
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Members
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-red-600"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Workspace Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to organize your campaigns and team
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name *</Label>
              <Input
                id="workspace-name"
                placeholder="e.g., Marketing Team"
                value={newWorkspace.name}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workspace-description">Description (Optional)</Label>
              <Textarea
                id="workspace-description"
                placeholder="What will this workspace be used for?"
                value={newWorkspace.description}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                disabled={loading}
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWorkspace({ name: '', description: '' });
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={createWorkspace}
                disabled={loading || !newWorkspace.name}
              >
                Create Workspace
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}