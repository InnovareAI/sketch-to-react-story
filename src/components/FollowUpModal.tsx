import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, addHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon, 
  Clock, 
  Tag, 
  MessageSquare,
  Send,
  AlertCircle,
  User,
  Building2,
  Mail,
  Phone,
  Linkedin,
  Plus,
  X,
  ChevronDown,
  Flag
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: {
    id: string;
    from: string;
    company: string;
    subject?: string;
    channel: string;
    conversationData?: any;
  };
  onSend: (followUpData: FollowUpData) => void;
}

interface FollowUpData {
  messageId: string;
  content: string;
  scheduledDate?: Date;
  reminder?: boolean;
  tags: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  addToSequence?: boolean;
  sequenceId?: string;
  notes?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    linkedin?: string;
  };
}

const predefinedTags = [
  { value: 'follow-up', label: 'Follow Up', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'meeting', label: 'Meeting', color: 'bg-blue-100 text-blue-800' },
  { value: 'proposal', label: 'Proposal', color: 'bg-green-100 text-green-800' },
  { value: 'check-in', label: 'Check In', color: 'bg-purple-100 text-purple-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  { value: 'question', label: 'Question', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'demo', label: 'Demo', color: 'bg-orange-100 text-orange-800' },
  { value: 'contract', label: 'Contract', color: 'bg-pink-100 text-pink-800' },
];

const followUpTemplates = [
  {
    name: 'Quick Check-in',
    content: "Hi {first_name},\n\nI wanted to follow up on our previous conversation about {topic}. Have you had a chance to review the information I sent?\n\nLooking forward to hearing from you.\n\nBest regards"
  },
  {
    name: 'Meeting Request',
    content: "Hi {first_name},\n\nI hope this message finds you well. I'd love to schedule a brief call to discuss {topic} further.\n\nAre you available for a 15-minute call this week? I have openings on:\n- Tuesday at 2 PM\n- Wednesday at 10 AM\n- Thursday at 3 PM\n\nLet me know what works best for you.\n\nBest regards"
  },
  {
    name: 'Thank You',
    content: "Hi {first_name},\n\nThank you for taking the time to connect today. I really enjoyed our conversation about {topic}.\n\nAs discussed, I'll {next_steps}.\n\nPlease don't hesitate to reach out if you have any questions.\n\nBest regards"
  },
  {
    name: 'Proposal Follow-up',
    content: "Hi {first_name},\n\nI wanted to follow up on the proposal I sent last week regarding {topic}.\n\nDo you have any questions or concerns I can address? I'm happy to hop on a quick call to walk through any details.\n\nLooking forward to your feedback.\n\nBest regards"
  }
];

export default function FollowUpModal({ isOpen, onClose, message, onSend }: FollowUpModalProps) {
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['follow-up']);
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [scheduleType, setScheduleType] = useState<'now' | 'later' | 'custom'>('now');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [reminder, setReminder] = useState(true);
  const [addToSequence, setAddToSequence] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactLinkedIn, setContactLinkedIn] = useState('');

  useEffect(() => {
    // Reset form when modal opens with new message
    if (isOpen && message) {
      setContent('');
      setSelectedTags(['follow-up']);
      setPriority('normal');
      setScheduleType('now');
      setScheduledDate(undefined);
      setReminder(true);
      setAddToSequence(false);
      setNotes('');
      setSelectedTemplate('');
      
      // Try to extract contact info from conversation data
      if (message.conversationData) {
        setContactEmail(message.conversationData.participant_email || '');
        setContactLinkedIn(message.conversationData.metadata?.linkedin_profile_url || '');
      }
    }
  }, [isOpen, message]);

  const handleTemplateSelect = (template: string) => {
    const selectedTemp = followUpTemplates.find(t => t.name === template);
    if (selectedTemp) {
      // Replace placeholders with actual data
      let templateContent = selectedTemp.content;
      templateContent = templateContent.replace('{first_name}', message?.from.split(' ')[0] || 'there');
      templateContent = templateContent.replace('{topic}', '[topic]');
      templateContent = templateContent.replace('{next_steps}', '[next steps]');
      setContent(templateContent);
      setSelectedTemplate(template);
    }
  };

  const handleScheduleTypeChange = (type: 'now' | 'later' | 'custom') => {
    setScheduleType(type);
    if (type === 'later') {
      // Default to tomorrow at 9 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setScheduledDate(tomorrow);
    } else if (type === 'now') {
      setScheduledDate(undefined);
    }
  };

  const handleSendFollowUp = async () => {
    if (!message || !content.trim()) {
      toast.error('Please enter a follow-up message');
      return;
    }

    setSaving(true);
    try {
      // Get workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
      
      if (!workspace) {
        throw new Error('No workspace found');
      }

      // Create follow-up record
      const followUpData: FollowUpData = {
        messageId: message.id,
        content: content.trim(),
        scheduledDate: scheduledDate,
        reminder,
        tags: selectedTags,
        priority,
        addToSequence,
        notes: notes.trim(),
        contactInfo: {
          email: contactEmail,
          phone: contactPhone,
          linkedin: contactLinkedIn
        }
      };

      // Save follow-up to database
      const { error } = await supabase
        .from('follow_ups')
        .insert({
          workspace_id: workspace.id,
          conversation_id: message.id,
          content: followUpData.content,
          scheduled_at: followUpData.scheduledDate?.toISOString(),
          status: scheduleType === 'now' ? 'sent' : 'scheduled',
          tags: followUpData.tags,
          priority: followUpData.priority,
          reminder_enabled: followUpData.reminder,
          notes: followUpData.notes,
          contact_info: followUpData.contactInfo,
          metadata: {
            from: message.from,
            company: message.company,
            channel: message.channel,
            template_used: selectedTemplate || null
          }
        });

      if (error) throw error;

      // Update conversation with follow-up tag
      await supabase
        .from('inbox_conversations')
        .update({
          metadata: supabase.sql`
            CASE 
              WHEN metadata IS NULL THEN jsonb_build_object('has_follow_up', true, 'last_follow_up', ${new Date().toISOString()})
              ELSE metadata || jsonb_build_object('has_follow_up', true, 'last_follow_up', ${new Date().toISOString()})
            END
          `
        })
        .eq('id', message.id);

      toast.success(
        scheduleType === 'now' 
          ? 'Follow-up sent successfully' 
          : `Follow-up scheduled for ${format(scheduledDate!, 'PPP p')}`
      );
      
      onSend(followUpData);
      onClose();
    } catch (error) {
      console.error('Error creating follow-up:', error);
      toast.error('Failed to create follow-up');
    } finally {
      setSaving(false);
    }
  };

  if (!message) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Create Follow-Up
          </DialogTitle>
          <DialogDescription>
            Schedule a follow-up message for {message.from} from {message.company}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contact Info Bar */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium text-gray-900">{message.from}</p>
                  <p className="text-sm text-gray-600">{message.company}</p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {message.channel}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {contactEmail && (
                  <Button variant="ghost" size="sm">
                    <Mail className="h-4 w-4" />
                  </Button>
                )}
                {contactPhone && (
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
                {contactLinkedIn && (
                  <Button variant="ghost" size="sm">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Message Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template or write custom message" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Custom Message</SelectItem>
                {followUpTemplates.map(template => (
                  <SelectItem key={template.name} value={template.name}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label>Follow-Up Message</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your follow-up message here..."
              className="min-h-[150px]"
            />
            <p className="text-xs text-gray-500">
              {content.length}/1000 characters
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {predefinedTags.map(tag => (
                <Badge
                  key={tag.value}
                  variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedTags.includes(tag.value) && tag.color
                  )}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag.value)
                        ? prev.filter(t => t !== tag.value)
                        : [...prev, tag.value]
                    );
                  }}
                >
                  {selectedTags.includes(tag.value) && (
                    <Tag className="h-3 w-3 mr-1" />
                  )}
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-gray-400" />
                    Low Priority
                  </div>
                </SelectItem>
                <SelectItem value="normal">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-blue-500" />
                    Normal Priority
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-orange-500" />
                    High Priority
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-red-500" />
                    Urgent
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <Label>Schedule</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={scheduleType === 'now' ? 'default' : 'outline'}
                onClick={() => handleScheduleTypeChange('now')}
              >
                Send Now
              </Button>
              <Button
                variant={scheduleType === 'later' ? 'default' : 'outline'}
                onClick={() => handleScheduleTypeChange('later')}
              >
                Send Later
              </Button>
              <Button
                variant={scheduleType === 'custom' ? 'default' : 'outline'}
                onClick={() => handleScheduleTypeChange('custom')}
              >
                Custom Time
              </Button>
            </div>
            
            {(scheduleType === 'later' || scheduleType === 'custom') && (
              <div className="flex gap-2 mt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {scheduledDate && (
                  <Input
                    type="time"
                    className="w-32"
                    value={format(scheduledDate, 'HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = new Date(scheduledDate);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setScheduledDate(newDate);
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="reminder" className="font-normal">
                Set reminder for follow-up
              </Label>
              <Checkbox
                id="reminder"
                checked={reminder}
                onCheckedChange={(checked) => setReminder(checked as boolean)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sequence" className="font-normal">
                Add to message sequence
              </Label>
              <Checkbox
                id="sequence"
                checked={addToSequence}
                onCheckedChange={(checked) => setAddToSequence(checked as boolean)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Internal Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any internal notes about this follow-up..."
              className="min-h-[60px]"
            />
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <Label>Contact Information</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                type="email"
              />
              <Input
                placeholder="Phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                type="tel"
              />
              <Input
                placeholder="LinkedIn URL"
                value={contactLinkedIn}
                onChange={(e) => setContactLinkedIn(e.target.value)}
                type="url"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSendFollowUp} disabled={saving || !content.trim()}>
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {scheduleType === 'now' ? 'Send Follow-Up' : 'Schedule Follow-Up'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}