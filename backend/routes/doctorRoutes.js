const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { getDailyAppointments, addMedicalRecord, updateAppointmentStatus } = require('../controllers/doctorController');

router.use(authMiddleware);
router.use(roleMiddleware(['doctor', 'admin']));

router.get('/:id/appointments', getDailyAppointments);
router.post('/records', addMedicalRecord);
router.put('/appointments/:id/status', updateAppointmentStatus);

module.exports = router;
