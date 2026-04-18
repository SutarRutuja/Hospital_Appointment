const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { addDepartment, addDoctor, getStats } = require('../controllers/adminController');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.post('/departments', addDepartment);
router.post('/doctors', addDoctor);
router.get('/stats', getStats);

module.exports = router;
