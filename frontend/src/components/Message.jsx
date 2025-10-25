import React from 'react';
import { useUser } from '../context/UserContext';

const Message = ({ message }) => {
  const { user } = useUser();

  const isOwnMessage = message.anonymousId === user?.anonymousId;
  const isSystemMessage = message.anonymousId === 'system';

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatTime(timestamp);
    } else {
      return date.toLocaleDateString() + ' ' + formatTime(timestamp);
    }
  };

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2 fade-in">
        <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm italic max-w-md text-center">
          {message.content}
          <span className="text-xs block mt-1 opacity-75">
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} my-2 fade-in`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
          isOwnMessage 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        {/* Message header - show for other users' messages */}
        {!isOwnMessage && (
          <div className="flex items-center space-x-2 mb-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: message.userColor }}
            ></div>
            <span className="text-xs font-medium opacity-75">
              {`User${message.anonymousId?.slice(-4)}`}
            </span>
          </div>
        )}
        
        {/* Message content */}
        <p className="text-sm break-words whitespace-pre-wrap">
          {message.content}
        </p>
        
        {/* Message timestamp */}
        <span className={`text-xs block mt-1 ${
          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {formatMessageTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default Message;