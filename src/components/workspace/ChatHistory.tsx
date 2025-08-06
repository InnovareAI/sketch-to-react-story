import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { History, Trash2, MessageSquare, Clock } from 'lucide-react';
import { useChatHistory } from '@/hooks/useChatHistory';

interface Message {
  id: string;
  content: string;
  sender: "user" | "sam";
  timestamp: Date;
}

interface ChatHistoryProps {
  onLoadSession: (messages: Message[]) => void;
  currentSessionId: string | null;
}

export function ChatHistory({ onLoadSession, currentSessionId }: ChatHistoryProps) {
  const { sessions, loadSession, deleteSession, clearAllHistory } = useChatHistory();
  const [isOpen, setIsOpen] = useState(false);

  const handleLoadSession = (sessionId: string) => {
    const messages = loadSession(sessionId);
    onLoadSession(messages);
    setIsOpen(false);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const groupSessionsByDate = () => {
    const groups: { [key: string]: typeof sessions } = {};
    
    sessions.forEach(session => {
      const dateKey = session.lastUpdated.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(session);
    });
    
    return groups;
  };

  const groupedSessions = groupSessionsByDate();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <History className="h-4 w-4 mr-2" />
          Chat History
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-gray-900 border-gray-700">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat History
          </SheetTitle>
          <SheetDescription className="text-gray-300">
            Your previous conversations with Sam
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {sessions.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{sessions.length} conversations</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-800 border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Clear All History</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300">
                      This action cannot be undone. All your chat history will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 text-gray-300 border-gray-600">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearAllHistory}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          
          <ScrollArea className="h-[calc(100vh-200px)]">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No chat history yet</p>
                <p className="text-gray-500 text-xs mt-1">Your conversations with Sam will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedSessions).map(([dateKey, dateSessions]) => (
                  <div key={dateKey} className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-500 font-medium">
                        {new Date(dateKey).toLocaleDateString(undefined, { 
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {dateSessions.map((session) => (
                      <Card
                        key={session.id}
                        className={`p-3 cursor-pointer transition-all duration-200 hover:bg-gray-700 border-gray-600 ${
                          currentSessionId === session.id ? 'bg-gray-700 border-blue-500' : 'bg-gray-800'
                        }`}
                        onClick={() => handleLoadSession(session.id)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate font-medium">
                              {session.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs px-1.5 py-0 border-gray-600 text-gray-400">
                                {session.messages.length} messages
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(session.lastUpdated)}
                              </span>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-400" />
                          </Button>
                        </div>
                        
                        {currentSessionId === session.id && (
                          <Badge className="mt-2 text-xs bg-blue-600 hover:bg-blue-600">
                            Current Session
                          </Badge>
                        )}
                      </Card>
                    ))}
                    
                    {Object.keys(groupedSessions).indexOf(dateKey) < Object.keys(groupedSessions).length - 1 && (
                      <Separator className="bg-gray-700" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}