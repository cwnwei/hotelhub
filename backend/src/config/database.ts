import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }

        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');
        console.log(`Connected to database: ${mongoose.connection.name}`);

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });

    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
