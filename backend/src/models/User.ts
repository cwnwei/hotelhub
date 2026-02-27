import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { 
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    refreshToken: { type: String },
});

export default mongoose.model("User", userSchema);