import { useState, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  content: string;
  sender: "user" | "sam";
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastUpdated: Date;
}

const STORAGE_KEY = 'sam_chat_history';
const MAX_SESSIONS = 50; // Limit stored sessions

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const sessions = parsed.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          lastUpdated: new Date(session.lastUpdated),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSessions(sessions);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, []);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [sessions]);

  const createNewSession = useCallback((initialMessage?: Message) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newSession: ChatSession = {
      id: sessionId,
      title: initialMessage?.content.slice(0, 50) + (initialMessage?.content.length > 50 ? '...' : '') || 'New Chat',
      messages: initialMessage ? [initialMessage] : [],
      createdAt: now,
      lastUpdated: now
    };

    setSessions(prev => {
      const updated = [newSession, ...prev].slice(0, MAX_SESSIONS);
      return updated;
    });
    
    setCurrentSessionId(sessionId);
    return sessionId;
  }, []);

  const addMessageToSession = useCallback((sessionId: string, message: Message) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedMessages = [...session.messages, message];
        const title = session.messages.length === 0 && message.sender === 'user' 
          ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
          : session.title;

        return {
          ...session,
          title,
          messages: updatedMessages,
          lastUpdated: new Date()
        };
      }
      return session;
    }));
  }, []);

  const loadSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      return session.messages;
    }
    return [];
  }, [sessions]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const clearAllHistory = useCallback(() => {
    setSessions([]);
    setCurrentSessionId(null);
  }, []);

  const getCurrentSession = useCallback(() => {
    if (!currentSessionId) return null;
    return sessions.find(s => s.id === currentSessionId) || null;
  }, [sessions, currentSessionId]);

  return {
    sessions,
    currentSessionId,
    createNewSession,
    addMessageToSession,
    loadSession,
    deleteSession,
    clearAllHistory,
    getCurrentSession
  };
}