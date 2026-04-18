const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { getDB } = require('../config/db');

const addDepartment = async (req, res) => {
    try {
        const db = getDB();
        const { name, description, icon } = req.body;
        
        const result = await db.collection('departments').insertOne({ name, description, icon });
        res.status(201).json({ message: 'Department added', id: result.insertedId });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const addDoctor = async (req, res) => {
    try {
        const db = getDB();
        const { name, email, password, departmentId, experienceYears } = req.body;
        
        const existingInfo = await db.collection('doctors').findOne({ email });
        if (existingInfo) return res.status(400).json({ message: 'Doctor already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newDoctor = {
            name,
            email,
            password: hashedPassword,
            departmentId: new ObjectId(departmentId),
            experienceYears,
            role: 'doctor',
            createdAt: new Date()
        };

        const result = await db.collection('doctors').insertOne(newDoctor);
        res.status(201).json({ message: 'Doctor added', doctorId: result.insertedId });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getStats = async (req, res) => {
    try {
        const db = getDB();
        const patientCount = await db.collection('users').countDocuments();
        const doctorCount = await db.collection('doctors').countDocuments();
        const appointmentCount = await db.collection('appointments').countDocuments();
        
        const appointmentsByDept = await db.collection('appointments').aggregate([
            {
                $group: {
                    _id: '$departmentId',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'departments',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'dept'
                }
            },
            { $unwind: '$dept' },
            {
                $project: {
                    departmentName: '$dept.name',
                    count: 1
                }
            }
        ]).toArray();

        res.json({ patientCount, doctorCount, appointmentCount, appointmentsByDept });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching stats' });
    }
};

module.exports = { addDepartment, addDoctor, getStats };
