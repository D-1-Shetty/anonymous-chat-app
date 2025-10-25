import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useUser } from '../context/UserContext';
import { getRoomMessages, getRoom } from '../utils/api';
import Message from '../components/Message';  // Import the Message component

const Chat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const socketRef = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomId) {
      setError('No room ID provided');
      setLoading(false);
      return;
    }

    const initializeRoom = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch room details
        const roomData = await getRoom(roomId);
        if (!roomData) {
          setError('Room not found');
          return;
        }
        setRoom(roomData);

        // Fetch previous messages
        const previousMessages = await getRoomMessages(roomId);
        setMessages(previousMessages);

      } catch (error) {
        console.error('Error initializing room:', error);
        setError('Failed to load room. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeRoom();
  }, [roomId]);

  useEffect(() => {
    if (!socketRef.current || !user || !roomId || loading) return;

    // Join the room
    socketRef.current.emit('join_room', roomId);
    console.log(`User ${user.anonymousId} joined room ${roomId}`);

    // Listen for new messages
    const handleReceiveMessage = (data) => {
      setMessages(prev => [...prev, data]);
    };

    // Listen for user join/leave events
    const handleUserJoined = (data) => {
      setOnlineUsers(prev => [...prev, data.userId]);
      // Add system message for user join
      setMessages(prev => [...prev, {
        _id: `system-join-${Date.now()}`,
        content: `User joined the room`,
        anonymousId: 'system',
        userColor: '#6B7280',
        timestamp: new Date(),
        isSystem: true
      }]);
    };

    const handleUserLeft = (data) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      // Add system message for user leave
      setMessages(prev => [...prev, {
        _id: `system-left-${Date.now()}`,
        content: `User left the room`,
        anonymousId: 'system',
        userColor: '#6B7280',
        timestamp: new Date(),
        isSystem: true
      }]);
    };

    // Listen for online users list
    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    // Socket event listeners
    socketRef.current.on('receive_message', handleReceiveMessage);
    socketRef.current.on('user_joined', handleUserJoined);
    socketRef.current.on('user_left', handleUserLeft);
    socketRef.current.on('online_users', handleOnlineUsers);

    // Request online users
    socketRef.current.emit('get_online_users', roomId);

    return () => {
      // Leave room and clean up listeners
      socketRef.current.emit('leave_room', roomId);
      socketRef.current.off('receive_message', handleReceiveMessage);
      socketRef.current.off('user_joined', handleUserJoined);
      socketRef.current.off('user_left', handleUserLeft);
      socketRef.current.off('online_users', handleOnlineUsers);
    };
  }, [socketRef, user, roomId, loading]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !user) return;

    const messageData = {
      roomId,
      anonymousId: user.anonymousId,
      userColor: user.color,
      content: newMessage.trim(),
      timestamp: new Date()
    };

    // Clear input immediately for better UX
    setNewMessage('');
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Send message via socket
    socketRef.current.emit('send_message', messageData);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">User session not found</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800 transition duration-200 flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back to Rooms</span>
              </button>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-800 truncate">
                  {room?.name || 'Unknown Room'}
                </h1>
                {room?.description && (
                  <p className="text-sm text-gray-600 truncate">{room.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Online Users Count */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{onlineUsers.length} online</span>
              </div>
              
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: user.color }}
                ></div>
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-gray-800">
                    {user.anonymousId}
                  </div>
                  <div className="text-xs text-gray-500">You</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-200px)] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Start the conversation by sending a message!</p>
              </div>
            ) : (
              messages.map((message) => (
                <Message key={message._id || message.timestamp} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t p-4 bg-gray-50 rounded-b-lg">
            <form onSubmit={sendMessage} className="flex space-x-4">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (Press Enter to send)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 pr-20"
                  maxLength={1000}
                  disabled={!room}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  {newMessage.length}/1000
                </div>
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || !room}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition duration-200 transform hover:scale-105 disabled:hover:scale-100 whitespace-nowrap"
              >
                Send
              </button>
            </form>
            <div className="text-xs text-gray-500 mt-2 text-center">
              💬 Messages are anonymous and end-to-end encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;