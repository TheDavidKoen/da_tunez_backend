const User = require("../models/User");
const Message = require("../models/Message");

// @desc    Send a poke to another user with an optional song
// @route   POST /users/:id/poke
exports.sendPoke = async (req, res) => {
  const targetUserId = req.params.id;
  const { song } = req.body;

  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (targetUserId === req.userId) {
      return res.status(400).json({ message: "You can't poke yourself." });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate song structure
    if (!song?.name || !song?.artist) {
      return res.status(400).json({ message: "Song must be included with the poke." });
    }

    // Prevent duplicate pokes
    const alreadyPoked = targetUser.pokeNotifications.some(
      (poke) => poke.fromUserId.toString() === req.userId
    );
    if (alreadyPoked) {
      return res.status(400).json({ message: "Already poked this user." });
    }

    // Add the poke
    targetUser.pokeNotifications.push({
      fromUserId: req.userId,
      timestamp: new Date(),
      song,
    });

    await targetUser.save();
    res.status(200).json({ message: "Poke sent!" });
  } catch (err) {
    console.error("Error sending poke:", err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get poke notifications for the logged-in user
// @route   GET /users/pokes
exports.getPokeNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("pokeNotifications")
      .lean();

    const enrichedPokes = await Promise.all(
      user.pokeNotifications.map(async (poke) => {
        const fromUser = await User.findById(poke.fromUserId)
          .select("username profilePicture")
          .lean();

        const hasMessaged = await Message.exists({
          $or: [
            { fromUser: req.userId, toUser: poke.fromUserId },
            { fromUser: poke.fromUserId, toUser: req.userId },
          ],
        });

        return {
          ...poke,
          fromUserId: fromUser,
          hasMessaged: Boolean(hasMessaged),
        };
      })
    );

    // Return in reverse chronological order (most recent first)
    res.json(enrichedPokes.reverse());
  } catch (err) {
    console.error("Error fetching poke notifications:", err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get replies to the user's pokes
// @route   GET /users/pokes/replies
exports.getPokeReplies = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("pokeReplies")
      .populate("pokeReplies.fromUserId", "username profilePicture")
      .lean();

    // Return in reverse chronological order
    res.json(user.pokeReplies.reverse());
  } catch (err) {
    console.error("Error fetching poke replies:", err);
    res.status(500).json({ error: err.message });
  }
};