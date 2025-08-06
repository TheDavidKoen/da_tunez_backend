const express = require('express');
const router = express.Router();
const spotifyController = require('../controllers/spotifyController');

router.get('/login', spotifyController.login);
router.get('/callback', spotifyController.callback);
router.get('/token', spotifyController.getToken);
router.get('/search', spotifyController.search); 

module.exports = router;