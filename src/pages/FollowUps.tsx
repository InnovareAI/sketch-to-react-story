import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDemoWorkspaceId, initSimpleAuth } from '@/utils/simpleAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon,
  Clock,
  MessageSquare,
  User,
  Building2,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Send,
  Calendar as CalendarDays,
  CheckCircle,
  XCircle,
  AlertCircle,
  Tag,
  Flag,
  ExternalLink,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { apifyCalendarService, type CalendarEvent as ApifyCalendarEvent } from '@/services/ApifyCalendarService';

interface FollowUp {
  id: string;
  workspace_id: string;
  conversation_id: string;
  content: string;
  scheduled_at: string | null;
  sent_at: string | null;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  tags: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  reminder_enabled: boolean;
  notes: string | null;
  contact_info: any;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  attendees?: string[];
  location?: string;
  type: 'meeting' | 'call' | 'demo' | 'follow_up';
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusColors = {
  scheduled: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

export default function FollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showScheduleMeeting, setShowScheduleMeeting] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  
  // Meeting scheduler state
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingDate, setMeetingDate] = useState<Date | undefined>();
  const [meetingDuration, setMeetingDuration] = useState('30');
  const [attendeeEmails, setAttendeeEmails] = useState('');
  
  // Response modal state
  const [responseMessage, setResponseMessage] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const [createTask, setCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadFollowUps();
    loadCalendarEvents();
  }, []);

  const loadFollowUps = async () => {
    try {
      await initSimpleAuth();
      const workspaceId = getDemoWorkspaceId();

      console.log('Loading follow-ups for workspace:', workspaceId);

      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Follow-ups loaded:', data?.length || 0);
      setFollowUps(data || []);
    } catch (error) {
      console.error('Error loading follow-ups:', error);
      toast.error('Failed to load follow-ups');
      // Set empty array so the page still renders
      setFollowUps([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      console.log('📅 Loading calendar events via Apify...');
      
      // Load calendar events using Apify service
      const apifyEvents = await apifyCalendarService.syncAllCalendars();
      
      // Transform Apify events to our local format
      const transformedEvents: CalendarEvent[] = apifyEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        description: event.description,
        attendees: event.attendees,
        location: event.location,
        type: event.type
      }));
      
      setCalendarEvents(transformedEvents);
      
      console.log(`📅 Loaded ${transformedEvents.length} calendar events via Apify`);
      toast.success(`Calendar synced: ${transformedEvents.length} events loaded`);
    } catch (error) {
      console.error('Error loading calendar events:', error);
      // Don't show error toast for calendar since it's using mock data
      // Just set empty array so the page still renders
      setCalendarEvents([]);
    }
  };

  const filteredFollowUps = followUps.filter(followUp => {
    const matchesSearch = 
      followUp.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.metadata?.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.metadata?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || followUp.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || followUp.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const scheduleFollowUpMeeting = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setMeetingTitle(`Follow-up meeting with ${followUp.metadata?.from || 'Contact'}`);
    setMeetingDescription(`Following up on: ${followUp.content.substring(0, 100)}...`);
    setShowScheduleMeeting(true);
  };

  const handleScheduleMeeting = async () => {
    if (!meetingTitle || !meetingDate || !selectedFollowUp) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Create calendar event (mock for now)
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: meetingTitle,
        start: meetingDate.toISOString(),
        end: new Date(meetingDate.getTime() + parseInt(meetingDuration) * 60 * 1000).toISOString(),
        description: meetingDescription,
        attendees: attendeeEmails.split(',').map(email => email.trim()).filter(Boolean),
        type: 'meeting'
      };

      setCalendarEvents(prev => [...prev, newEvent]);
      
      // Update follow-up with meeting info
      await supabase
        .from('follow_ups')
        .update({
          metadata: {
            ...selectedFollowUp.metadata,
            has_meeting: true,
            meeting_id: newEvent.id,
            meeting_scheduled_at: newEvent.start
          }
        })
        .eq('id', selectedFollowUp.id);

      toast.success('Meeting scheduled successfully!');
      setShowScheduleMeeting(false);
      setSelectedFollowUp(null);
      loadFollowUps();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error('Failed to schedule meeting');
    }
  };

  // Response modal functions
  const openResponseModal = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setResponseMessage(`Hi ${followUp.metadata?.from || 'there'},\n\n`);
    setShowResponseModal(true);
  };

  const handleSendResponse = async () => {
    if (!responseMessage.trim() || !selectedFollowUp) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);

    try {
      // 1. Update the follow-up status to 'sent'
      await supabase
        .from('follow_ups')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: {
            ...selectedFollowUp.metadata,
            response_sent: true,
            response_content: responseMessage
          }
        })
        .eq('id', selectedFollowUp.id);

      // 2. Create a new follow-up if reminder is set
      if (reminderDate) {
        await supabase
          .from('follow_ups')
          .insert({
            workspace_id: selectedFollowUp.workspace_id,
            conversation_id: selectedFollowUp.conversation_id,
            content: `Follow-up reminder: ${taskTitle || 'Check response from ' + (selectedFollowUp.metadata?.from || 'contact')}`,
            scheduled_at: reminderDate.toISOString(),
            status: 'scheduled',
            priority: taskPriority,
            tags: ['reminder', ...selectedFollowUp.tags],
            reminder_enabled: true,
            contact_info: selectedFollowUp.contact_info,
            metadata: {
              ...selectedFollowUp.metadata,
              is_reminder: true,
              original_follow_up_id: selectedFollowUp.id
            }
          });
      }

      // 3. Create task if requested (simulated for demo)
      if (createTask && taskTitle) {
        console.log('Creating task:', { title: taskTitle, priority: taskPriority });
        toast.success(`Task created: ${taskTitle}`);
      }

      // 4. Simulate message sending (in real app, this would integrate with LinkedIn/email)
      console.log('Sending message:', {
        to: selectedFollowUp.metadata?.from,
        content: responseMessage,
        platform: selectedFollowUp.metadata?.channel || 'linkedin'
      });

      toast.success('Response sent successfully!');
      
      // Reset form and close modal
      setShowResponseModal(false);
      setResponseMessage('');
      setReminderDate(undefined);
      setCreateTask(false);
      setTaskTitle('');
      setTaskPriority('normal');
      setSelectedFollowUp(null);
      
      // Reload follow-ups to show updated status
      loadFollowUps();

    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Failed to send response');
    } finally {
      setSending(false);
    }
  };

  const getUpcomingEvents = () => {
    return calendarEvents
      .filter(event => isFuture(parseISO(event.start)))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  };

  const getTodayEvents = () => {
    return calendarEvents.filter(event => isToday(parseISO(event.start)));
  };

  const getFollowUpStats = () => {
    const scheduled = followUps.filter(f => f.status === 'scheduled').length;
    const sent = followUps.filter(f => f.status === 'sent').length;
    const overdue = followUps.filter(f => 
      f.status === 'scheduled' && 
      f.scheduled_at && 
      isPast(parseISO(f.scheduled_at))
    ).length;
    
    return { scheduled, sent, overdue };
  };

  const stats = getFollowUpStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading follow-ups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-gray-600 mt-1">Manage your scheduled follow-ups and meetings</p>
        </div>
        <Button onClick={() => window.location.href = '/inbox'}>
          <Plus className="h-4 w-4 mr-2" />
          Create Follow-up
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{getTodayEvents().length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="follow-ups" className="space-y-6">
        <TabsList>
          <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="follow-ups" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search follow-ups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <Flag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Follow-ups List */}
          <div className="space-y-4">
            {filteredFollowUps.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No follow-ups found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Create your first follow-up from the inbox'}
                  </p>
                  <Button onClick={() => window.location.href = '/inbox'}>
                    Go to Inbox
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredFollowUps.map((followUp) => (
                <Card key={followUp.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={cn('text-xs', statusColors[followUp.status])}>
                            {followUp.status}
                          </Badge>
                          <Badge className={cn('text-xs', priorityColors[followUp.priority])}>
                            {followUp.priority}
                          </Badge>
                          {followUp.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{followUp.metadata?.from || 'Unknown Contact'}</span>
                          {followUp.metadata?.company && (
                            <>
                              <Building2 className="h-4 w-4 ml-2" />
                              <span>{followUp.metadata.company}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openResponseModal(followUp)}
                          disabled={followUp.status === 'sent'}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {followUp.status === 'sent' ? 'Sent' : 'Respond'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => scheduleFollowUpMeeting(followUp)}
                        >
                          <CalendarDays className="h-4 w-4 mr-1" />
                          Schedule Meeting
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-700 mb-3 line-clamp-2">{followUp.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        {followUp.scheduled_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Scheduled: {format(parseISO(followUp.scheduled_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        )}
                        {followUp.sent_at && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>
                              Sent: {format(parseISO(followUp.sent_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                      <span>Created {format(parseISO(followUp.created_at), 'MMM d')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Upcoming Meetings
              </CardTitle>
              <CardDescription>
                Calendar events extracted from your connected accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getUpcomingEvents().length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming meetings</h3>
                  <p className="text-gray-600">Schedule a meeting from your follow-ups</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getUpcomingEvents().map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{format(parseISO(event.start), 'MMM d, h:mm a')}</span>
                            </div>
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-gray-600 text-sm mt-2">{event.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {event.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Meeting Modal */}
      <Dialog open={showScheduleMeeting} onOpenChange={setShowScheduleMeeting}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Schedule Meeting
            </DialogTitle>
            <DialogDescription>
              Schedule a meeting related to this follow-up
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Meeting Title</Label>
              <Input
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Enter meeting title"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                placeholder="Meeting agenda or description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {meetingDate ? format(meetingDate, 'PPP p') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={meetingDate}
                      onSelect={setMeetingDate}
                      initialFocus
                    />
                    {meetingDate && (
                      <div className="p-3 border-t">
                        <Input
                          type="time"
                          value={format(meetingDate, 'HH:mm')}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':');
                            const newDate = new Date(meetingDate);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            setMeetingDate(newDate);
                          }}
                        />
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={meetingDuration} onValueChange={setMeetingDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attendee Emails</Label>
              <Input
                value={attendeeEmails}
                onChange={(e) => setAttendeeEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
              />
              <p className="text-xs text-gray-500">Separate multiple emails with commas</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleMeeting(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleMeeting}>
              <Send className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Modal */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Respond to Follow-up
            </DialogTitle>
            <DialogDescription>
              Send a response to {selectedFollowUp?.metadata?.from || 'this contact'} and set up reminders or tasks
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Response Message */}
            <div className="space-y-2">
              <Label>Your Response</Label>
              <Textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Type your response message here..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                This message will be sent via {selectedFollowUp?.metadata?.channel || 'LinkedIn'}
              </p>
            </div>

            {/* Reminder Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Label>Set Reminder (Optional)</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reminderDate ? format(reminderDate, 'PPP p') : 'Set reminder date & time'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reminderDate}
                    onSelect={setReminderDate}
                    initialFocus
                  />
                  {reminderDate && (
                    <div className="p-3 border-t">
                      <Input
                        type="time"
                        value={reminderDate ? format(reminderDate, 'HH:mm') : ''}
                        onChange={(e) => {
                          if (reminderDate) {
                            const [hours, minutes] = e.target.value.split(':');
                            const newDate = new Date(reminderDate);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            setReminderDate(newDate);
                          }
                        }}
                      />
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              {reminderDate && (
                <p className="text-xs text-gray-600">
                  A reminder follow-up will be created for {format(reminderDate, 'PPP p')}
                </p>
              )}
            </div>

            {/* Task Creation Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-task"
                  checked={createTask}
                  onChange={(e) => setCreateTask(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="create-task" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Create Task
                </Label>
              </div>
              
              {createTask && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Task Title</Label>
                    <Input
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g., Follow up on proposal response"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Task Priority</Label>
                    <Select value={taskPriority} onValueChange={(value: any) => setTaskPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="normal">Normal Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="urgent">Urgent Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Info */}
            {selectedFollowUp && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <strong>Sending to:</strong> {selectedFollowUp.metadata?.from || 'Contact'} 
                  {selectedFollowUp.metadata?.company && ` at ${selectedFollowUp.metadata.company}`}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Platform:</strong> {selectedFollowUp.metadata?.channel || 'LinkedIn'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendResponse} disabled={sending || !responseMessage.trim()}>
              {sending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Response
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}