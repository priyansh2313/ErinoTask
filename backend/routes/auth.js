const router = require('express').Router();
const { register, login, logout, me } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, logout);
router.get('/me', auth, me);

module.exports = router;
