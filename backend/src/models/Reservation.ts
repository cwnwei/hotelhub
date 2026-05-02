import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
    guest_id: { type: String, required: true },
    guest_name: { type: String },
    room_id: { type: String, required: true },
    room_number: { type: String },
    check_in_date: { type: String },
    check_out_date: { type: String },
    num_guests: { type: Number },
    status: { type: String },
    total_amount: { type: Number },
    amount_paid: { type: Number },
    payment_status: { type: String },
    special_requests: { type: String }
});

export default mongoose.model("Reservation", reservationSchema);