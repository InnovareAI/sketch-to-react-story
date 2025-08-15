import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, User, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReplyModal({ isOpen, onClose }: ReplyModalProps) {
  const [replyMessage, setReplyMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientCompany, setRecipientCompany] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [sending, setSending] = useState(false);

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!recipientName.trim()) {
      toast.error('Please enter recipient name');
      return;
    }

    setSending(true);

    try {
      // Simulate sending the reply
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Sending reply:', {
        to: recipientName,
        company: recipientCompany,
        message: replyMessage,
        platform: platform
      });

      toast.success(`Reply sent to ${recipientName} via ${platform}!`);
      
      // Reset form and close modal
      setReplyMessage('');
      setRecipientName('');
      setRecipientCompany('');
      setPlatform('linkedin');
      onClose();

    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setReplyMessage('');
      setRecipientName('');
      setRecipientCompany('');
      setPlatform('linkedin');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Reply Message
          </DialogTitle>
          <DialogDescription>
            Send a direct reply message to a contact
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="pl-10"
                  disabled={sending}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipientCompany">Company (Optional)</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="recipientCompany"
                  value={recipientCompany}
                  onChange={(e) => setRecipientCompany(e.target.value)}
                  placeholder="e.g., Tech Corp"
                  className="pl-10"
                  disabled={sending}
                />
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform} disabled={sending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reply Message */}
          <div className="space-y-2">
            <Label htmlFor="replyMessage">Your Message *</Label>
            <Textarea
              id="replyMessage"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply message here..."
              rows={6}
              className="resize-none"
              disabled={sending}
            />
            <p className="text-xs text-gray-500">
              This message will be sent via {platform}
            </p>
          </div>

          {/* Preview */}
          {recipientName && replyMessage && (
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Message Preview:</h4>
              <div className="text-sm text-gray-700">
                <p><strong>To:</strong> {recipientName}{recipientCompany && ` at ${recipientCompany}`}</p>
                <p><strong>Platform:</strong> {platform}</p>
                <p><strong>Message:</strong></p>
                <div className="mt-2 p-3 bg-white rounded border-l-4 border-blue-500">
                  {replyMessage}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendReply} 
            disabled={sending || !replyMessage.trim() || !recipientName.trim()}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Reply
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}