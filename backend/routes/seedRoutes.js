const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDB } = require('../config/db');

router.post('/init', async (req, res) => {
    try {
        const db = getDB();
        
        // 1. Create Admin
        const salt = await bcrypt.genSalt(10);
        const adminPass = await bcrypt.hash('admin123', salt);
        await db.collection('admins').updateOne(
            { email: 'admin@entclinic.com' },
            { $set: { name: 'System Admin', email: 'admin@entclinic.com', password: adminPass, role: 'admin' } },
            { upsert: true }
        );

        // 2. Create Departments
        const depts = [
            { name: 'Audiology', description: 'Hearing related issues', icon: 'ear-icon' },
            { name: 'Rhinology', description: 'Nasal and sinus diseases', icon: 'nose-icon' },
            { name: 'Laryngology', description: 'Throat and voice disorders', icon: 'throat-icon' },
            { name: 'Otology', description: 'Ear diseases', icon: 'ear-icon' }
        ];

        for (const dept of depts) {
            await db.collection('departments').updateOne(
                { name: dept.name },
                { $set: dept },
                { upsert: true }
            );
        }

        // Fetch depts to get IDs
        const audiology = await db.collection('departments').findOne({ name: 'Audiology' });
        const rhinology = await db.collection('departments').findOne({ name: 'Rhinology' });

        // 3. Create Doctors
        const docPass = await bcrypt.hash('doctor123', salt);
        const docs = [
            { name: 'Dr. John Smith', email: 'john.smith@entclinic.com', password: docPass, departmentId: audiology._id, experienceYears: 10, role: 'doctor' },
            { name: 'Dr. Sarah Connor', email: 'sarah.connor@entclinic.com', password: docPass, departmentId: rhinology._id, experienceYears: 8, role: 'doctor' }
        ];

        for (const doc of docs) {
            await db.collection('doctors').updateOne(
                { email: doc.email },
                { $set: doc },
                { upsert: true }
            );
        }

        res.json({ message: 'Database seeded successfully. Admin: admin@entclinic.com / admin123' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Seed failed' });
    }
});

module.exports = router;
