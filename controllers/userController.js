const User = require("../models/User");

// @desc    Get the logged-in user's profile (excluding password)
// @route   GET /auth/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper: safely parse a JSON field or return null
const parseField = (body, field) => {
  try {
    return body[field] ? JSON.parse(body[field]) : null;
  } catch {
    return null;
  }
};

// @desc    Update logged-in user's profile
// @route   PUT /auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { body, file } = req;

    if (body.bio && body.bio.length > 180) {
      return res.status(400).json({ error: "Bio cannot exceed 180 characters." });
    }

    // Construct the update object with optional fields
    const updateData = {
      ...(body.name && { name: body.name }),
      ...(body.bio && { bio: body.bio }),
      ...(body.sex && { sex: body.sex }),
      ...(body.interests && { interests: parseField(body, "interests") }),
      ...(parseField(body, "currentFavouriteArtist") && {
        currentFavouriteArtist: parseField(body, "currentFavouriteArtist"),
      }),
      ...(parseField(body, "songForCloudyDays") && {
        songForCloudyDays: parseField(body, "songForCloudyDays"),
      }),
      ...(parseField(body, "songToGetYouExcited") && {
        songToGetYouExcited: parseField(body, "songToGetYouExcited"),
      }),
      ...(parseField(body, "songToBeLazyTo") && {
        songToBeLazyTo: parseField(body, "songToBeLazyTo"),
      }),
      ...(parseField(body, "songForReminiscence") && {
        songForReminiscence: parseField(body, "songForReminiscence"),
      }),
      ...(parseField(body, "songToZoneInto") && {
        songToZoneInto: parseField(body, "songToZoneInto"),
      }),
      ...(parseField(body, "myProfileSong") && {
        myProfileSong: parseField(body, "myProfileSong"),
      }),
    };

    // If profile picture was uploaded, attach it
    if (file) {
      updateData.profilePicture = `/uploads/${file.filename}`;
    }

    const updated = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
    }).select("-password");

    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get all users (excluding passwords)
// @route   GET /auth/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get a specific user by ID (excluding password)
// @route   GET /auth/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};