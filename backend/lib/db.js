import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
mongoose.connection.on('error', err => console.error('MongoDB error:', err.message));

export const connectDB = async (retries = MAX_RETRIES) => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        if (retries > 0) {
            console.log(`Retrying in ${RETRY_DELAY / 1000}s... (${retries} attempts left)`);
            await new Promise(res => setTimeout(res, RETRY_DELAY));
            return connectDB(retries - 1);
        }
        console.error('All retries exhausted. Server will continue without DB.');
    }
} 