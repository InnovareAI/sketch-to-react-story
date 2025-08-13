import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, ChevronDown, Plus, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role?: string;
  isClient?: boolean;
}

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all workspaces the user has access to
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          workspace_id,
          role,
          workspaces (
            id,
            name,
            slug,
            settings
          )
        `)
        .eq('id', user.id);

      if (error) throw error;

      const workspaceList = profiles?.map(p => ({
        id: p.workspaces.id,
        name: p.workspaces.name,
        slug: p.workspaces.slug,
        role: p.role,
        isClient: p.workspaces.settings?.isClientWorkspace || false
      })) || [];

      setWorkspaces(workspaceList);

      // Get current workspace from localStorage or use first one
      const savedWorkspaceId = localStorage.getItem('current_workspace_id');
      const current = workspaceList.find(w => w.id === savedWorkspaceId) || workspaceList[0];
      
      if (current) {
        setCurrentWorkspace(current);
        localStorage.setItem('current_workspace_id', current.id);
        localStorage.setItem('workspace_name', current.name);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = async (workspace: Workspace) => {
    try {
      // Save new workspace to localStorage
      localStorage.setItem('current_workspace_id', workspace.id);
      localStorage.setItem('workspace_name', workspace.name);
      
      // Update user profile with current workspace
      const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      userProfile.workspace_id = workspace.id;
      userProfile.workspace_name = workspace.name;
      localStorage.setItem('user_auth_profile', JSON.stringify(userProfile));
      
      setCurrentWorkspace(workspace);
      
      toast.success(`Switched to ${workspace.name}`);
      
      // Reload the page to refresh all data with new workspace context
      window.location.reload();
    } catch (error) {
      console.error('Error switching workspace:', error);
      toast.error('Failed to switch workspace');
    }
  };

  const createClientWorkspace = async () => {
    const name = prompt('Enter client company name:');
    if (!name) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create new workspace
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name,
          slug,
          settings: {
            isClientWorkspace: true,
            managedBy: user.id,
            createdAt: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (wsError) throw wsError;

      // Add current user as owner
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          workspace_id: workspace.id,
          email: user.email,
          role: 'owner',
          full_name: userProfile.full_name || user.email
        });

      if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
        throw profileError;
      }

      toast.success(`Created workspace for ${name}`);
      await loadWorkspaces();
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create workspace');
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'owner': return <Shield className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3 opacity-70" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  if (loading) {
    return <div className="h-10 w-48 bg-gray-100 animate-pulse rounded-lg" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{currentWorkspace?.name || 'Select Workspace'}</span>
            {currentWorkspace?.isClient && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Client</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Your Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Agency/Own Workspace */}
        <DropdownMenuLabel className="text-xs text-gray-500 font-normal">Agency</DropdownMenuLabel>
        {workspaces.filter(w => !w.isClient).map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => switchWorkspace(workspace)}
            className={currentWorkspace?.id === workspace.id ? 'bg-gray-100' : ''}
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {workspace.name}
              </span>
              {getRoleIcon(workspace.role)}
            </div>
          </DropdownMenuItem>
        ))}
        
        {/* Client Workspaces */}
        {workspaces.some(w => w.isClient) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500 font-normal">Client Accounts</DropdownMenuLabel>
            {workspaces.filter(w => w.isClient).map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => switchWorkspace(workspace)}
                className={currentWorkspace?.id === workspace.id ? 'bg-gray-100' : ''}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    {workspace.name}
                  </span>
                  {getRoleIcon(workspace.role)}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={createClientWorkspace}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}