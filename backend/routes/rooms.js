const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, maxParticipants, createdBy } = req.body;
    
    const room = new Room({
      name,
      description,
      maxParticipants,
      createdBy
    });

    const savedRoom = await room.save();
    res.status(201).json(savedRoom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.isActive = false;
    await room.save();

    await Message.deleteMany({ roomId: req.params.id });

    res.json({ 
      message: 'Room deleted successfully',
      deletedRoom: room 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:roomId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ timestamp: 1 })
      .limit(100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;