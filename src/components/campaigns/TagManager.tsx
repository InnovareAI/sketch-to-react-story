import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  AlertCircle,
  Palette,
  Hash,
  Users,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TagData {
  id?: string;
  value: string;
  label: string;
  color: string;
  description?: string;
  usage_count?: number;
  created_at?: string;
}

const colorOptions = [
  { value: 'bg-red-100 text-red-800', label: 'Red', preview: 'bg-red-100' },
  { value: 'bg-yellow-100 text-yellow-800', label: 'Yellow', preview: 'bg-yellow-100' },
  { value: 'bg-green-100 text-green-800', label: 'Green', preview: 'bg-green-100' },
  { value: 'bg-blue-100 text-blue-800', label: 'Blue', preview: 'bg-blue-100' },
  { value: 'bg-purple-100 text-purple-800', label: 'Purple', preview: 'bg-purple-100' },
  { value: 'bg-indigo-100 text-indigo-800', label: 'Indigo', preview: 'bg-indigo-100' },
  { value: 'bg-pink-100 text-pink-800', label: 'Pink', preview: 'bg-pink-100' },
  { value: 'bg-orange-100 text-orange-800', label: 'Orange', preview: 'bg-orange-100' },
  { value: 'bg-gray-100 text-gray-800', label: 'Gray', preview: 'bg-gray-100' },
  { value: 'bg-teal-100 text-teal-800', label: 'Teal', preview: 'bg-teal-100' },
];

// Default system tags
const defaultTags: TagData[] = [
  { value: 'important', label: 'Important', color: 'bg-red-100 text-red-800', description: 'High priority items' },
  { value: 'follow-up', label: 'Follow Up', color: 'bg-yellow-100 text-yellow-800', description: 'Requires follow-up action' },
  { value: 'prospect', label: 'Prospect', color: 'bg-green-100 text-green-800', description: 'Potential customer' },
  { value: 'client', label: 'Client', color: 'bg-blue-100 text-blue-800', description: 'Existing client' },
  { value: 'partner', label: 'Partner', color: 'bg-purple-100 text-purple-800', description: 'Business partner' },
  { value: 'vendor', label: 'Vendor', color: 'bg-indigo-100 text-indigo-800', description: 'Service provider' },
  { value: 'urgent', label: 'Urgent', color: 'bg-orange-100 text-orange-800', description: 'Needs immediate attention' },
  { value: 'later', label: 'Later', color: 'bg-gray-100 text-gray-800', description: 'Can be addressed later' },
];

export default function TagManager() {
  const [tags, setTags] = useState<TagData[]>(defaultTags);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [newTag, setNewTag] = useState<TagData>({
    value: '',
    label: '',
    color: 'bg-blue-100 text-blue-800',
    description: ''
  });
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      // Get workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
        
      if (!workspace) {
        setTags(defaultTags);
        setLoading(false);
        return;
      }

      // Load custom tags from database
      const { data: customTags, error } = await supabase
        .from('workspace_tags')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('label');

      if (error) {
        console.error('Error loading tags:', error);
        setTags(defaultTags);
      } else if (customTags && customTags.length > 0) {
        // Merge default and custom tags
        const allTags = [...defaultTags];
        customTags.forEach(tag => {
          if (!allTags.find(t => t.value === tag.value)) {
            allTags.push(tag);
          }
        });
        setTags(allTags);
      } else {
        setTags(defaultTags);
      }
    } catch (error) {
      console.error('Error in loadTags:', error);
      setTags(defaultTags);
    } finally {
      setLoading(false);
    }
  };

  const saveTag = async () => {
    if (!newTag.label || !newTag.value) {
      toast.error('Tag name and value are required');
      return;
    }

    // Check for duplicates
    if (tags.some(t => t.value === newTag.value)) {
      toast.error('A tag with this value already exists');
      return;
    }

    try {
      // Get workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
        
      if (!workspace) {
        toast.error('No workspace found');
        return;
      }

      // Save to database
      const { error } = await supabase
        .from('workspace_tags')
        .insert({
          workspace_id: workspace.id,
          ...newTag
        });

      if (error) {
        console.error('Error saving tag:', error);
        toast.error('Failed to save tag');
      } else {
        setTags([...tags, newTag]);
        setShowAddModal(false);
        setNewTag({
          value: '',
          label: '',
          color: 'bg-blue-100 text-blue-800',
          description: ''
        });
        toast.success('Tag created successfully');
      }
    } catch (error) {
      console.error('Error in saveTag:', error);
      toast.error('Failed to create tag');
    }
  };

  const updateTag = async () => {
    if (!editingTag || !editingTag.label || !editingTag.value) {
      toast.error('Tag name and value are required');
      return;
    }

    try {
      // Check if it's a default tag
      const isDefault = defaultTags.some(t => t.value === editingTag.value);
      if (isDefault) {
        toast.error('Cannot edit default system tags');
        return;
      }

      // Get workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
        
      if (!workspace) {
        toast.error('No workspace found');
        return;
      }

      // Update in database
      const { error } = await supabase
        .from('workspace_tags')
        .update({
          label: editingTag.label,
          color: editingTag.color,
          description: editingTag.description
        })
        .eq('workspace_id', workspace.id)
        .eq('value', editingTag.value);

      if (error) {
        console.error('Error updating tag:', error);
        toast.error('Failed to update tag');
      } else {
        setTags(tags.map(t => t.value === editingTag.value ? editingTag : t));
        setShowEditModal(false);
        setEditingTag(null);
        toast.success('Tag updated successfully');
      }
    } catch (error) {
      console.error('Error in updateTag:', error);
      toast.error('Failed to update tag');
    }
  };

  const deleteTag = async (tag: TagData) => {
    // Check if it's a default tag
    const isDefault = defaultTags.some(t => t.value === tag.value);
    if (isDefault) {
      toast.error('Cannot delete default system tags');
      return;
    }

    try {
      // Get workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
        
      if (!workspace) {
        toast.error('No workspace found');
        return;
      }

      // Delete from database
      const { error } = await supabase
        .from('workspace_tags')
        .delete()
        .eq('workspace_id', workspace.id)
        .eq('value', tag.value);

      if (error) {
        console.error('Error deleting tag:', error);
        toast.error('Failed to delete tag');
      } else {
        setTags(tags.filter(t => t.value !== tag.value));
        toast.success('Tag deleted successfully');
      }
    } catch (error) {
      console.error('Error in deleteTag:', error);
      toast.error('Failed to delete tag');
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const generateTagValue = (label: string) => {
    return label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tag Manager
            </CardTitle>
            <CardDescription>
              Manage tags for organizing contacts, messages, and campaigns
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tag
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tags..."
              className="pl-9"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
          <Badge variant="outline">
            {filteredTags.length} tags
          </Badge>
        </div>

        {/* Tags Grid */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading tags...
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tags found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTags.map(tag => {
              const isDefault = defaultTags.some(t => t.value === tag.value);
              return (
                <div 
                  key={tag.value} 
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={tag.color}>
                          {tag.label}
                        </Badge>
                        {isDefault && (
                          <Badge variant="outline" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                      {tag.description && (
                        <p className="text-xs text-muted-foreground">
                          {tag.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        <code>{tag.value}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isDefault && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setEditingTag(tag);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            onClick={() => deleteTag(tag)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Usage Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tags help you organize and filter your contacts, messages, and campaigns. 
            System tags cannot be modified or deleted.
          </AlertDescription>
        </Alert>
      </CardContent>

      {/* Add Tag Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Add a custom tag for organizing your data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tag Name</Label>
              <Input
                placeholder="e.g., Hot Lead"
                value={newTag.label}
                onChange={(e) => {
                  setNewTag({
                    ...newTag,
                    label: e.target.value,
                    value: generateTagValue(e.target.value)
                  });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Value: {newTag.value || 'will-be-generated'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="Brief description of this tag"
                value={newTag.description}
                onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map(color => (
                  <Button
                    key={color.value}
                    variant={newTag.color === color.value ? "default" : "outline"}
                    size="sm"
                    className={`${color.preview} ${newTag.color === color.value ? 'ring-2 ring-offset-2' : ''}`}
                    onClick={() => setNewTag({ ...newTag, color: color.value })}
                  >
                    <span className="text-xs">{color.label}</span>
                  </Button>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <Label>Preview</Label>
              <div className="mt-2">
                <Badge className={newTag.color}>
                  {newTag.label || 'Tag Preview'}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveTag}>
              <Save className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Modify the tag properties
            </DialogDescription>
          </DialogHeader>
          {editingTag && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tag Name</Label>
                <Input
                  value={editingTag.label}
                  onChange={(e) => setEditingTag({ ...editingTag, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of this tag"
                  value={editingTag.description || ''}
                  onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map(color => (
                    <Button
                      key={color.value}
                      variant={editingTag.color === color.value ? "default" : "outline"}
                      size="sm"
                      className={`${color.preview} ${editingTag.color === color.value ? 'ring-2 ring-offset-2' : ''}`}
                      onClick={() => setEditingTag({ ...editingTag, color: color.value })}
                    >
                      <span className="text-xs">{color.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <Label>Preview</Label>
                <div className="mt-2">
                  <Badge className={editingTag.color}>
                    {editingTag.label}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditModal(false);
              setEditingTag(null);
            }}>
              Cancel
            </Button>
            <Button onClick={updateTag}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}