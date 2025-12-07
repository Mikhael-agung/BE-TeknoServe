const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const validation = require('../middleware/validation');

router.post('/register', validation(), AuthController.register);
router.post('/login', validation(), AuthController.login);

module.exports = router;
