import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    room_number: { type: String, required: true, unique: true },
    room_type: { type: String, required: true },
    floor: { type: Number, required: true },
    price_per_night: { type: Number },
    status: { 
        type: String,
        enum: ['available', 'occupied', 'cleaning'],
        default: 'available'
    },
    amenities: { type: Array },
    max_guests: { type: String },
    image_url: { type: String }
});

export default mongoose.model("Room", roomSchema);