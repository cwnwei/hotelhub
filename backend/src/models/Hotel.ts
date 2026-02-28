import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    star_rating: { type: Number, required: true, min: 1, max: 5 },
    image_url: { type: String },
    description: { type: String }
}, {
    timestamps: true
});

export default mongoose.model("Hotel", hotelSchema);
