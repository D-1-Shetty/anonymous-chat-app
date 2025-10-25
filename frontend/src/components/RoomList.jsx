import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteRoom } from '../utils/api'; // This should work now
import { useUser } from '../context/UserContext';

const RoomList = ({ rooms, onRoomDeleted }) => {
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [copiedRoomId, setCopiedRoomId] = useState(null);
  const { user } = useUser();

  // Ensure rooms is always an array
  const roomsArray = Array.isArray(rooms) ? rooms : [];

  const handleCopyInviteLink = async (roomId, roomName) => {
    const inviteLink = `${window.location.origin}/chat/${roomId}`;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedRoomId(roomId);
      setTimeout(() => setCopiedRoomId(null), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedRoomId(roomId);
      setTimeout(() => setCopiedRoomId(null), 2000);
    }
  };

  const handleDeleteRoom = async (roomId, roomCreatedBy) => {
    const canDelete = !roomCreatedBy || 
                     roomCreatedBy === 'unknown_user' || 
                     user.anonymousId === roomCreatedBy;

    if (!canDelete) {
      alert('You can only delete rooms that you created.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    setDeletingRoomId(roomId);
    try {
      await deleteRoom(roomId); // This should work now
      if (onRoomDeleted) {
        onRoomDeleted(roomId);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room. Please try again.');
    } finally {
      setDeletingRoomId(null);
    }
  };

  const canUserDeleteRoom = (room) => {
    return !room.createdBy || 
           room.createdBy === 'unknown_user' || 
           (user && user.anonymousId === room.createdBy);
  };

  if (roomsArray.length === 0) {
    return (
      <div className="text-center py-12 fade-in">
        <div className="text-gray-500 text-lg mb-4">No rooms available</div>
        <p className="text-gray-400">Be the first to create a discussion room!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 fade-in">
      {roomsArray.map((room) => (
        <div
          key={room._id}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition duration-200 p-6 border border-gray-200 hover:border-blue-300 transform hover:-translate-y-1 relative group"
        >
          {/* Share button */}
          <button
            onClick={() => handleCopyInviteLink(room._id, room.name)}
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-blue-500 transition duration-200 opacity-0 group-hover:opacity-100"
            title="Copy invite link"
          >
            {copiedRoomId === room._id ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
          </button>

          {/* Delete button - only for room creator */}
          {user && canUserDeleteRoom(room) && (
            <button
              onClick={() => handleDeleteRoom(room._id, room.createdBy)}
              disabled={deletingRoomId === room._id}
              className="absolute top-3 right-12 p-2 text-gray-400 hover:text-red-500 transition duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
              title="Delete room"
            >
              {deletingRoomId === room._id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}

          <Link to={`/chat/${room._id}`} className="block">
            <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1 pr-20">
              {room.name}
            </h3>
            {room.description && (
              <p className="text-gray-600 mb-4 line-clamp-2">
                {room.description}
              </p>
            )}
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Max: {room.maxParticipants || 50}
              </span>
              <span>
                {room.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'Unknown date'}
              </span>
            </div>
          </Link>

          {/* Invite button at bottom */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => handleCopyInviteLink(room._id, room.name)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition duration-200 flex items-center justify-center space-x-2"
            >
              {copiedRoomId === room._id ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Invite Colleagues</span>
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoomList;