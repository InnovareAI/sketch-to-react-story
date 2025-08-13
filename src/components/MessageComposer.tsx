import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, X, Paperclip, Smile, Bold, Italic, Link, AtSign, Search } from 'lucide-react';
import { toast } from 'sonner';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';
import { supabase } from '@/integrations/supabase/client';

interface MessageComposerProps {
  mode: 'reply' | 'new';
  recipientName?: string;
  recipientId?: string;
  recipientAvatar?: string;
  conversationId?: string;
  chatId?: string;
  onSend?: () => void;
  onClose?: () => void;
  isOpen?: boolean;
}

interface LinkedInContact {
  id: string;
  name: string;
  headline?: string;
  avatar?: string;
  company?: string;
}

export default function MessageComposer({
  mode,
  recipientName,
  recipientId,
  recipientAvatar,
  conversationId,
  chatId,
  onSend,
  onClose,
  isOpen = true
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LinkedInContact[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<LinkedInContact | null>(
    recipientName ? { id: recipientId || '', name: recipientName, avatar: recipientAvatar } : null
  );
  const [showSearch, setShowSearch] = useState(mode === 'new');

  const searchContacts = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // Search in our synced contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (contacts) {
        const results: LinkedInContact[] = contacts.map(c => ({
          id: c.linkedin_url || c.email,
          name: `${c.first_name} ${c.last_name}`.trim(),
          headline: c.title,
          company: c.metadata?.company,
          avatar: c.scraped_data?.profile_picture
        }));
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching contacts:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (mode === 'new' && !selectedRecipient) {
      toast.error('Please select a recipient');
      return;
    }

    setSending(true);
    try {
      // Get the account ID (we're using Thorsten's account)
      const accounts = await unipileRealTimeSync.testConnection();
      const account = accounts.accounts?.[0];
      
      if (!account) {
        throw new Error('No LinkedIn account connected');
      }

      // Send via Unipile API
      const success = await unipileRealTimeSync.sendMessage(
        account.id,
        selectedRecipient?.id || recipientId || '',
        message
      );

      if (success) {
        // Save to our database
        if (conversationId) {
          await supabase
            .from('inbox_messages')
            .insert({
              conversation_id: conversationId,
              role: 'user',
              content: message,
              metadata: {
                sender_name: 'You',
                direction: 'outbound',
                sent_via: 'composer',
                timestamp: new Date().toISOString()
              }
            });
        }

        toast.success('Message sent successfully!');
        setMessage('');
        onSend?.();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Recipient Selection for New Messages */}
      {mode === 'new' && showSearch && (
        <div className="space-y-2">
          <Label>To</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search LinkedIn contacts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchContacts(e.target.value);
              }}
              className="pl-10"
            />
          </div>
          
          {searchResults.length > 0 && (
            <Card className="max-h-48 overflow-y-auto">
              <CardContent className="p-0">
                {searchResults.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                    onClick={() => {
                      setSelectedRecipient(contact);
                      setShowSearch(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{contact.name}</div>
                        {contact.headline && (
                          <div className="text-xs text-gray-600">{contact.headline}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Selected Recipient Display */}
      {selectedRecipient && !showSearch && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedRecipient.avatar} />
              <AvatarFallback>
                {selectedRecipient.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{selectedRecipient.name}</div>
              {selectedRecipient.headline && (
                <div className="text-sm text-gray-600">{selectedRecipient.headline}</div>
              )}
            </div>
          </div>
          {mode === 'new' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedRecipient(null);
                setShowSearch(true);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Message Composer */}
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          placeholder={mode === 'reply' ? 'Type your reply...' : 'Type your message...'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[200px] resize-none"
        />
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{message.length} characters</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AtSign className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Smile className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Replies */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-500">Quick Replies</Label>
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => setMessage("Thanks for connecting! Looking forward to our conversation.")}
          >
            Thanks for connecting
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => setMessage("I'd be happy to schedule a call to discuss this further. What times work for you?")}
          >
            Schedule a call
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => setMessage("That sounds interesting! Can you tell me more about...")}
          >
            Tell me more
          </Badge>
        </div>
      </div>
    </div>
  );

  if (mode === 'reply') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Reply to {recipientName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose?.()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New LinkedIn Message</DialogTitle>
          <DialogDescription>
            Compose and send a message to a LinkedIn connection
          </DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending || !message.trim() || !selectedRecipient}
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}