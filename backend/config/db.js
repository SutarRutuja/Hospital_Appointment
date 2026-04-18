const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'ent_clinic';

let db;
let client;

const connectDB = async () => {
    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log(`MongoDB connected to database: ${dbName}`);
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
};

const getClient = () => {
    return client;
};

module.exports = { connectDB, getDB, getClient };
