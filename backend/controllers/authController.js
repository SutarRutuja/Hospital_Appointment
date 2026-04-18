const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');

const register = async (req, res) => {
    try {
        const db = getDB();
        const { name, email, password, age, gender, contact, medicalHistory } = req.body;

        // Check if user exists by email or contact
        const existingUser = await db.collection('users').findOne({ $or: [{ email }, { contact }] });
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'User with this email already exists' });
            } else {
                return res.status(400).json({ message: 'User with this phone number already exists' });
            }
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`[OTP] Generated OTP for ${email}: ${otp}`);

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const pendingUser = {
            name,
            email,
            password: hashedPassword,
            age,
            gender,
            contact,
            medicalHistory: medicalHistory || {},
            role: 'patient',
            otp,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiration
        };

        // Upsert pending registration by email
        await db.collection('pending_registrations').updateOne(
            { email },
            { $set: pendingUser },
            { upsert: true }
        );

        res.status(200).json({ message: 'OTP sent successfully', otp }); // Include OTP in response for dev testing
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const db = getDB();
        const { email, otp } = req.body;

        const pending = await db.collection('pending_registrations').findOne({ email });

        if (!pending) {
            return res.status(400).json({ message: 'No pending registration found or it has expired' });
        }

        if (pending.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (pending.expiresAt < new Date()) {
            await db.collection('pending_registrations').deleteOne({ email });
            return res.status(400).json({ message: 'OTP has expired. Please register again.' });
        }

        // Move to users
        const newUser = {
            name: pending.name,
            email: pending.email,
            password: pending.password,
            age: pending.age,
            gender: pending.gender,
            contact: pending.contact,
            medicalHistory: pending.medicalHistory,
            role: pending.role,
            createdAt: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);
        await db.collection('pending_registrations').deleteOne({ email });

        const token = jwt.sign({ id: result.insertedId, role: 'patient' }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({ token, user: { id: result.insertedId, name: pending.name, email: pending.email, role: 'patient' } });
    } catch (error) {
        console.error('OTP Verification Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    try {
        const db = getDB();
        const { email, password } = req.body;

        // Check users collection
        let user = await db.collection('users').findOne({ email });
        let role = 'patient';

        // Check doctors if not a patient
        if (!user) {
            user = await db.collection('doctors').findOne({ email });
            role = 'doctor';
        }

        // Check admins if not a doctor
        if (!user) {
            user = await db.collection('admins').findOne({ email });
            role = 'admin';
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login, verifyOtp };
