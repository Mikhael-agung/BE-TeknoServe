const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

router.use(auth);

router.get('/me', UserController.getProfile);
router.put('/me', validation(), UserController.updateProfile);

module.exports = router;
