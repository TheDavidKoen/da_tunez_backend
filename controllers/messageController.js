const Message = require("../models/Message");
const User = require("../models/User");

// Utility: Check if sender was poked by recipient
const wasPokedBy = (sender, fromUserId) =>
  sender.pokeNotifications.some(poke => poke.fromUserId.toString() === fromUserId);

// @desc    Send a message to another user (with optional poke reply logic)
// @route   POST /messages
exports.sendMessage = async (req, res) => {
  const { toUserId, text } = req.body;

  if (!text || !toUserId) {
    return res.status(400).json({ message: "Missing message or recipient." });
  }

  try {
    // Create the message record
    const message = await Message.create({
      fromUser: req.userId,
      toUser: toUserId,
      text,
    });

    // Load both users involved in the conversation
    const [recipient, sender] = await Promise.all([
      User.findById(toUserId),
      User.findById(req.userId),
    ]);

    // Check if sender is replying to a poke
    if (wasPokedBy(sender, toUserId)) {
      recipient.pokeReplies.push({
        fromUserId: req.userId,
        text,
      });
      await recipient.save(); // Save reply only if poke existed
    }

    res.status(201).json({ message: "Message sent", data: message });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get all messages between logged-in user and another user
// @route   GET /messages/:userId
exports.getMessagesWithUser = async (req, res) => {
  const otherUserId = req.params.userId;

  try {
    const messages = await Message.find({
      $or: [
        { fromUser: req.userId, toUser: otherUserId },
        { fromUser: otherUserId, toUser: req.userId },
      ],
    })
      .sort({ timestamp: 1 }) // Sort chronologically
      .populate("fromUser", "username profilePicture")
      .populate("toUser", "username profilePicture");

    res.json(messages);
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get latest messages sent *to* the user (typically poke replies)
// @route   GET /messages/replies
exports.getRepliesToPokes = async (req, res) => {
  try {
    const messages = await Message.find({ toUser: req.userId })
      .sort({ timestamp: -1 }) // Most recent first
      .limit(20)
      .populate("fromUser", "username profilePicture");

    res.json(messages);
  } catch (err) {
    console.error("Error fetching replies:", err);
    res.status(500).json({ error: err.message });
  }
};