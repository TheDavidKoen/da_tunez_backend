const express = require("express");
const router = express.Router();
const { sendMessage, getMessagesWithUser } = require("../controllers/messageController");
const pokes = require("../controllers/pokeController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, sendMessage);
router.get("/:userId", authMiddleware, getMessagesWithUser);

router.get("/notifications/replies", authMiddleware, pokes.getPokeReplies);

module.exports = router;