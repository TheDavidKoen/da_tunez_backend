const express = require("express");
const router = express.Router();

const auth = require("../controllers/authController");
const users = require("../controllers/userController");
const pokes = require("../controllers/pokeController");
const { getRepliesToPokes } = require("../controllers/messageController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/logout", (req, res) => res.clearCookie("token").json({ message: "Logged out" }));

router.get("/profile", authMiddleware, users.getProfile);
router.put("/profile", authMiddleware, upload.single("profilePicture"), users.updateProfile);

router.get("/users", authMiddleware, users.getAllUsers);
router.get("/users/:id", authMiddleware, users.getUserById);

router.post("/users/:id/poke", authMiddleware, pokes.sendPoke);
router.get("/notifications/pokes", authMiddleware, pokes.getPokeNotifications);

router.get("/notifications/replies", authMiddleware, getRepliesToPokes);

module.exports = router;