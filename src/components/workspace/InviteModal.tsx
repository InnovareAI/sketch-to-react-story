import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Users, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/workspace';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

export default function InviteModal({ isOpen, onClose, workspaceId, workspaceName }: InviteModalProps) {
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generateInviteLink = () => {
    const inviteCode = generateUUID().split('-')[0];
    const link = `${window.location.origin}/join/${workspaceId}/${inviteCode}`;
    setInviteLink(link);
    return link;
  };

  const handleSendInvites = async () => {
    const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
    
    if (emailList.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }
    
    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email(s): ${invalidEmails.join(', ')}`);
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate sending invites
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store invites locally (in a real app, this would be sent to backend)
      const invites = emailList.map(email => ({
        id: generateUUID(),
        email,
        workspaceId,
        workspaceName,
        role,
        message,
        inviteLink: generateInviteLink(),
        status: 'pending',
        sentAt: new Date().toISOString()
      }));
      
      const existingInvites = localStorage.getItem('workspace_invites');
      const allInvites = existingInvites ? JSON.parse(existingInvites) : [];
      allInvites.push(...invites);
      localStorage.setItem('workspace_invites', JSON.stringify(allInvites));
      
      toast.success(`Invited ${emailList.length} ${emailList.length === 1 ? 'person' : 'people'} to ${workspaceName}`);
      
      // Reset form
      setEmails('');
      setMessage('');
      setRole('member');
      onClose();
    } catch (error) {
      toast.error('Failed to send invites');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const link = inviteLink || generateInviteLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Invite link copied to clipboard');
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite team members</DialogTitle>
          <DialogDescription>
            Invite people to join {workspaceName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="emails">Email addresses</Label>
            <Textarea
              id="emails"
              placeholder="Enter email addresses separated by commas"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple emails with commas
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'member') => setRole(value)}>
              <SelectTrigger id="role" disabled={loading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  <div>
                    <div className="font-medium">Member</div>
                    <div className="text-xs text-muted-foreground">Can view and edit campaigns</div>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div>
                    <div className="font-medium">Admin</div>
                    <div className="text-xs text-muted-foreground">Can manage workspace settings and members</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Personal message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>
          
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Or share invite link</span>
              <Button
                size="sm"
                variant="outline"
                onClick={copyInviteLink}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy link
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can join your workspace
            </p>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvites}
              disabled={loading || !emails.trim()}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send invites
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}