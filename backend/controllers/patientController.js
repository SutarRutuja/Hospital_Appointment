const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const getDepartments = async (req, res) => {
    try {
        const db = getDB();
        const departments = await db.collection('departments').find({}).toArray();
        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching departments' });
    }
};

const getDoctorsByDepartment = async (req, res) => {
    try {
        const db = getDB();
        const { departmentId } = req.query;
        let query = {};
        if (departmentId) {
            query.departmentId = new ObjectId(departmentId);
        }
        
        const doctors = await db.collection('doctors').aggregate([
            { $match: query },
            { $project: { password: 0 } },
            { 
                $lookup: {
                    from: 'departments',
                    localField: 'departmentId',
                    foreignField: '_id',
                    as: 'department'
                }
            },
            { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } }
        ]).toArray();
        
        res.json(doctors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching doctors' });
    }
};

const checkAvailableSlots = async (req, res) => {
    try {
        const db = getDB();
        const { doctorId, date } = req.query;
        
        if (!doctorId || !date) {
            return res.status(400).json({ message: 'Doctor ID and date required' });
        }

        const bookedAppointments = await db.collection('appointments').find({
            doctorId: new ObjectId(doctorId),
            date: date,
            status: { $ne: 'cancelled' }
        }).project({ timeSlot: 1 }).toArray();

        const bookedSlots = bookedAppointments.map(a => a.timeSlot);
        
        // Define all possible slots
        const allSlots = [
            '09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM',
            '10:00 AM - 10:30 AM', '10:30 AM - 11:00 AM',
            '11:00 AM - 11:30 AM', '11:30 AM - 12:00 PM',
            '02:00 PM - 02:30 PM', '02:30 PM - 03:00 PM',
            '03:00 PM - 03:30 PM', '03:30 PM - 04:00 PM'
        ];

        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        res.json({ availableSlots });
    } catch (error) {
        res.status(500).json({ message: 'Server error checking slots' });
    }
};

const bookAppointment = async (req, res) => {
    try {
        const db = getDB();
        const { doctorId, departmentId, date, timeSlot } = req.body;
        const patientId = req.user.id;

        // Prevent double booking atomicity check
        const existing = await db.collection('appointments').findOne({
            doctorId: new ObjectId(doctorId),
            date,
            timeSlot,
            status: { $ne: 'cancelled' }
        });

        if (existing) {
            return res.status(400).json({ message: 'Time slot is already booked' });
        }

        const newAppointment = {
            patientId: new ObjectId(patientId),
            doctorId: new ObjectId(doctorId),
            departmentId: new ObjectId(departmentId),
            date,
            timeSlot,
            status: 'scheduled',
            createdAt: new Date()
        };

        const result = await db.collection('appointments').insertOne(newAppointment);
        res.status(201).json({ message: 'Appointment booked successfully', appointmentId: result.insertedId });
    } catch (error) {
        res.status(500).json({ message: 'Server error booking appointment' });
    }
};

const getPatientHistory = async (req, res) => {
    try {
        const db = getDB();
        const patientId = req.params.id;
        
        // Ensure user is requesting their own data or is admin/doctor
        if (req.user.role === 'patient' && req.user.id !== patientId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const appointments = await db.collection('appointments').aggregate([
            { $match: { patientId: new ObjectId(patientId) } },
            { 
                $lookup: {
                    from: 'doctors',
                    localField: 'doctorId',
                    foreignField: '_id',
                    as: 'doctor'
                }
            },
            { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
            { 
                $lookup: {
                    from: 'departments',
                    localField: 'departmentId',
                    foreignField: '_id',
                    as: 'department'
                }
            },
            { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'medical_records',
                    localField: '_id',
                    foreignField: 'appointmentId',
                    as: 'record'
                }
            },
            { $unwind: { path: '$record', preserveNullAndEmptyArrays: true } },
            { $project: { 'doctor.password': 0 } },
            { $sort: { date: -1 } }
        ]).toArray();

        res.json({ appointments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching history' });
    }
};

module.exports = {
    getDepartments,
    getDoctorsByDepartment,
    checkAvailableSlots,
    bookAppointment,
    getPatientHistory
};
