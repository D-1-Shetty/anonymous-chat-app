import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RoomList from '../components/RoomList';
import CreateRoomModal from '../components/CreateRoomModal';
import { getRooms } from '../utils/api';
import { useUser } from '../context/UserContext';

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading } = useUser();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        setError(null);
        const roomsData = await getRooms();
        
        // Handle different response formats
        if (Array.isArray(roomsData)) {
          setRooms(roomsData);
        } else if (roomsData && Array.isArray(roomsData.data)) {
          // If response has { data: [] } format
          setRooms(roomsData.data);
        } else if (roomsData && roomsData.success && Array.isArray(roomsData.data)) {
          // If response has { success: true, data: [] } format
          setRooms(roomsData.data);
        } else {
          console.warn('Unexpected rooms response format:', roomsData);
          setRooms([]);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setError('Failed to load rooms');
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  const handleRoomDeleted = (deletedRoomId) => {
    setRooms(prevRooms => prevRooms.filter(room => room._id !== deletedRoomId));
  };

  const refreshRooms = async () => {
    setLoadingRooms(true);
    setError(null);
    try {
      const roomsData = await getRooms();
      
      // Handle different response formats
      if (Array.isArray(roomsData)) {
        setRooms(roomsData);
      } else if (roomsData && Array.isArray(roomsData.data)) {
        setRooms(roomsData.data);
      } else if (roomsData && roomsData.success && Array.isArray(roomsData.data)) {
        setRooms(roomsData.data);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load rooms');
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing anonymous session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Failed to initialize user session</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12 fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Anonymous Group Chat
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Join group discussions anonymously. Share your thoughts freely without revealing your identity.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full shadow-sm">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <span className="text-sm text-blue-800 font-medium">
              Connected as: {user.anonymousId}
            </span>
          </div>
        </header>

        <div className="max-w-6xl mx-auto fade-in">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Available Rooms
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Click on a room to join. Only room creators can delete their rooms.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshRooms}
                disabled={loadingRooms}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingRooms ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Create New Room
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
              <button 
                onClick={refreshRooms}
                className="ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {loadingRooms ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading rooms...</p>
            </div>
          ) : (
            <RoomList rooms={rooms} onRoomDeleted={handleRoomDeleted} />
          )}
        </div>

        {showCreateModal && (
          <CreateRoomModal
            onClose={() => setShowCreateModal(false)}
            onRoomCreated={(newRoom) => {
              setRooms(prev => [newRoom, ...prev]);
              setShowCreateModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Home;