const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Utility: Generate JWT for user with 1-day expiry
const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });

// Utility: Attach token as an HTTP-only cookie and respond with user info
const sendTokenResponse = (res, user, message) => {
  const token = createToken(user._id);
  res
    .cookie("token", token, { httpOnly: true })
    .json({ message, user });
};

// @desc    Register a new user
// @route   POST /auth/register
exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if username already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });

    sendTokenResponse(res, user, "User created");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Log in an existing user
// @route   POST /auth/login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Look up user by username
    const user = await User.findOne({ username });

    // If user doesn't exist or password doesn't match
    const invalidCredentials = !user || !(await bcrypt.compare(password, user.password));
    if (invalidCredentials) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    sendTokenResponse(res, user, "Logged in");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};