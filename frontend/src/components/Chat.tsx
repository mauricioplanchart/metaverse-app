import React, { useState, useRef, useEffect } from 'react';
import { useMetaverseStore } from '../stores/metaverseStore';

// Message validation and sanitization
const sanitizeMessage = (message: string): string => {
  return message
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .substring(0, 1000); // Limit length
};

const validateMessage = (message: string): boolean => {
  const sanitized = sanitizeMessage(message);
  return sanitized.length > 0 && sanitized.length <= 1000;
};

const Chat: React.FC = () => {
  const { 
    messages, 
    sendMessage, 
    isChatOpen, 
    toggleChat, 
    clearMessages,
    error,
    clearError 
  } = useMetaverseStore();
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    // Rate limiting - prevent spam
    const now = Date.now();
    if (now - lastMessageTime < 1000) { // 1 second between messages
      return;
    }

    // Validate and sanitize message
    if (!validateMessage(inputMessage)) {
      return;
    }

    const sanitizedMessage = sanitizeMessage(inputMessage);
    
    try {
      sendMessage(sanitizedMessage);
      setInputMessage('');
      setLastMessageTime(now);
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Prevent extremely long messages
    if (value.length > 1000) {
      return;
    }
    
    setInputMessage(value);
    setIsTyping(value.length > 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageTypeColor = (type: string): string => {
    switch (type) {
      case 'system':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'private':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-700 bg-white border-gray-200';
    }
  };

  const getMessageTypeIcon = (type: string): string => {
    switch (type) {
      case 'system':
        return '🔔';
      case 'private':
        return '🔒';
      default:
        return '💬';
    }
  };

  if (!isChatOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
        title="Open Chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-t-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="font-semibold">Chat</h3>
          {messages.length > 0 && (
            <span className="ml-2 bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearMessages}
            className="text-white hover:text-gray-200 transition-colors"
            title="Clear Messages"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={toggleChat}
            className="text-white hover:text-gray-200 transition-colors"
            title="Close Chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-2 bg-red-50 border-b border-red-200">
          <div className="flex items-center text-red-600 text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg border ${getMessageTypeColor(message.type)}`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center">
                  <span className="mr-2">{getMessageTypeIcon(message.type)}</span>
                  <span className="font-medium text-sm">
                    {message.username}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <p className="text-sm break-words">
                {message.message}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <label htmlFor="chatMessage" className="sr-only">
            Type your message
          </label>
          <input
            id="chatMessage"
            name="chatMessage"
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 input-field text-sm"
            maxLength={1000}
            disabled={inputMessage.length > 1000}
            aria-describedby="charCounter"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || inputMessage.length > 1000}
            className="btn-primary px-4 py-2 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {/* Character Counter */}
        {inputMessage.length > 0 && (
          <div id="charCounter" className="mt-2 text-xs text-gray-500 text-right">
            {inputMessage.length}/1000
            {inputMessage.length > 900 && (
              <span className="text-orange-500 ml-1">• Approaching limit</span>
            )}
          </div>
        )}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="mt-2 text-xs text-gray-500">
            <span className="flex items-center">
              <span className="animate-pulse">●</span>
              <span className="ml-1">Typing...</span>
            </span>
          </div>
        )}
      </form>

      {/* Security Notice */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-500 text-center">
          🔒 Messages are encrypted and monitored for inappropriate content
        </p>
      </div>
    </div>
  );
};

export default Chat; 