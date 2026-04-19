const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const getDailyAppointments = async (req, res) => {
    try {
        const db = getDB();
        const doctorId = req.params.id;
        const date = req.query.date; // expecting YYYY-MM-DD
        
        if (req.user.role === 'doctor' && req.user.id !== doctorId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        let query = { doctorId: new ObjectId(doctorId) };
        if (date) {
            query.date = date;
        }

        const appointments = await db.collection('appointments').aggregate([
            { $match: query },
            { 
                $lookup: {
                    from: 'users',
                    localField: 'patientId',
                    foreignField: '_id',
                    as: 'patient'
                }
            },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            { $project: { 'patient.password': 0 } },
            {
                $lookup: {
                    from: 'medical_records',
                    localField: '_id',
                    foreignField: 'appointmentId',
                    as: 'medicalRecord'
                }
            },
            { $unwind: { path: '$medicalRecord', preserveNullAndEmptyArrays: true } },
            { $sort: { timeSlot: 1 } }
        ]).toArray();

        res.json({ appointments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching appointments' });
    }
};

const addMedicalRecord = async (req, res) => {
    try {
        const db = getDB();
        const { appointmentId, patientId, diagnosis, prescription, doctorNotes } = req.body;
        const doctorId = req.user.id;

        const record = {
            appointmentId: new ObjectId(appointmentId),
            patientId: new ObjectId(patientId),
            doctorId: new ObjectId(doctorId),
            diagnosis,
            prescription,
            doctorNotes,
            createdAt: new Date()
        };

        const result = await db.collection('medical_records').insertOne(record);
        
        // Update appointment status to completed
        await db.collection('appointments').updateOne(
            { _id: new ObjectId(appointmentId) },
            { $set: { status: 'completed' } }
        );

        res.status(201).json({ message: 'Record added and appointment completed', recordId: result.insertedId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error adding record' });
    }
};

const updateAppointmentStatus = async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { status } = req.body;
        
        await db.collection('appointments').updateOne(
            { _id: new ObjectId(id), doctorId: new ObjectId(req.user.id) },
            { $set: { status } }
        );
        
        res.json({ message: `Appointment marked as ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating status' });
    }
};

module.exports = { getDailyAppointments, addMedicalRecord, updateAppointmentStatus };
