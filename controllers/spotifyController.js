const querystring = require("querystring");
const axios = require("axios");
const User = require("../models/User");

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
const stateKey = "spotify_auth_state";

/**
 * Generates a random alphanumeric string for CSRF protection (OAuth state param)
 */
const generateRandomString = (length) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
};

/**
 * Helper: Returns the base64-encoded Spotify client credentials
 */
const getBasicAuthHeader = () =>
  "Basic " + Buffer.from(`${client_id}:${client_secret}`).toString("base64");

/**
 * Redirects user to Spotify's OAuth screen
 * @route GET /auth/spotify/login
 */
exports.login = (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "playlist-read-private"
  ].join(" ");

  const queryParams = querystring.stringify({
    response_type: "code",
    client_id,
    scope,
    redirect_uri,
    state,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
};

/**
 * Handles the Spotify OAuth callback and exchanges code for tokens
 * @route GET /auth/spotify/callback
 */
exports.callback = async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies?.[stateKey];

  if (!state || state !== storedState) {
    return res.status(400).json({ message: "State mismatch" });
  }

  res.clearCookie(stateKey);

  try {
    // Exchange code for access & refresh tokens
    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: getBasicAuthHeader(),
        },
      }
    );

    const { access_token, refresh_token } = tokenRes.data;

    // Fetch user profile
    const userRes = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    res.json({
      spotifyProfile: userRes.data,
      access_token,
      refresh_token,
    });
  } catch (err) {
    console.error("Spotify token error", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to get tokens" });
  }
};

/**
 * Retrieves a client credentials access token (no user context)
 * @route GET /auth/spotify/token
 */
exports.getToken = async (req, res) => {
  try {
    const token = await getClientToken();
    res.json({ access_token: token });
  } catch (err) {
    console.error("Failed to get Spotify client credentials token", err.message);
    res.status(500).json({ error: "Failed to get Spotify token" });
  }
};

/**
 * Helper: Gets a Spotify access token using client credentials grant
 */
const getClientToken = async () => {
  const params = querystring.stringify({ grant_type: "client_credentials" });

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    params,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: getBasicAuthHeader(),
      },
    }
  );

  return response.data.access_token;
};

/**
 * Searches for tracks on Spotify by query
 * @route GET /auth/spotify/search?q=query
 */
exports.search = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Missing search query" });

  try {
    const token = await getClientToken();
    const result = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(result.data);
  } catch (err) {
    console.error("Spotify search failed:", err.message);
    res.status(500).json({ error: "Spotify search failed" });
  }
};