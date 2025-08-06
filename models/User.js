const mongoose = require("mongoose");

const TrackSchema = new mongoose.Schema({
  name: String,
  artist: String,
  uri: String,
  coverArt: String,
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  bio: {
    type: String,
    maxlength: 180,
  },
  profilePicture: String,
  currentFavouriteArtist: TrackSchema,
  songForCloudyDays: TrackSchema,
  songToGetYouExcited: TrackSchema,
  myProfileSong: TrackSchema,
  songToBeLazyTo: TrackSchema,
  songForReminiscence: TrackSchema,
  songToZoneInto: TrackSchema,
  pokeNotifications: [{
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    timestamp: Date,
    song: {
      name: String,
      artist: String,
      uri: String,
      coverArt: String,
    }
  }],
  pokeReplies: [
    {
      fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  sex: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  interests: [{
    type: String,
    enum: ["Male", "Female", "Other"],
  }]
});

module.exports = mongoose.model("User", UserSchema);