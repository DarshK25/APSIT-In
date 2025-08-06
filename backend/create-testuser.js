import mongoose from 'mongoose';
import User from './models/user.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function createTestUser() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Check if testuser already exists
        const existingUser = await User.findOne({ username: 'testuser' });
        if (existingUser) {
            console.log('testuser already exists:', existingUser.username);
            process.exit(0);
        }

        // Create testuser
        const testUser = new User({
            name: 'Test User',
            username: 'testuser',
            email: 'testuser@apsit.edu.in',
            password: 'abcdef', // This will be hashed by the pre-save middleware
            accountType: 'student',
            studentId: '12345678'
        });

        await testUser.save();
        console.log('✅ testuser created successfully!');
        console.log('Username:', testUser.username);
        console.log('Email:', testUser.email);
        console.log('Account Type:', testUser.accountType);
        
    } catch (error) {
        console.error('❌ Error creating testuser:', error);
    } finally {
        // Close the connection
        mongoose.connection.close();
    }
}

createTestUser();
