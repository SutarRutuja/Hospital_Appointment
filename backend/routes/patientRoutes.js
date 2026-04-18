const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { getDepartments, getDoctorsByDepartment, checkAvailableSlots, bookAppointment, getPatientHistory } = require('../controllers/patientController');

router.get('/departments', getDepartments);
router.get('/doctors', getDoctorsByDepartment);
router.get('/appointments/available-slots', checkAvailableSlots);

// Protected routes
router.use(authMiddleware);
router.post('/appointments', roleMiddleware(['patient', 'admin']), bookAppointment);
router.get('/:id/history', getPatientHistory);

module.exports = router;
