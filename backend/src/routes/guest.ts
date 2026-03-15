import express from "express";
import User from "../models/User"
import { authorizeRoles } from "../middleware/rbac"

const guestrouter = express.Router();

guestrouter.get("/", authorizeRoles('admin'), async (req, res) => {
    try {
        const guests = await User.find().sort({ createdAt: -1 });
        const formattedGuests = guests.filter(guest => guest.role == 'user').map(guest => ({
            id: guest._id,
            full_name: guest.full_name,
            email: guest.email,
            phone: guest.phone
        }));

        res.status(200).json(formattedGuests);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
})

guestrouter.put("/:id", authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedguest = await User.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,            // return updated document
                runValidators: true,  // enforce schema validation
            }
        );

        if (!updatedguest) {
            return res.status(404).json({ message: "guest not found" });
        }

        res.status(200).json({
            id: updatedguest._id,
            full_name: updatedguest.full_name,
            email: updatedguest.email,
            phone: updatedguest.phone
        })

    } catch (err: any) {
        console.error(err);

        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: "Server error" });
    }
})

guestrouter.delete("/:id", authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const deletedguest = await User.findByIdAndDelete(id);

        if (!deletedguest) {
            return res.status(404).json({ message: "guest not found" });
        }

        res.status(200).json({
            id: deletedguest._id,
            full_name: deletedguest.full_name,
            email: deletedguest.email,
            phone: deletedguest.phone
        });

    } catch (err: any) {
        console.error(err);

        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid guest ID" });
        }

        res.status(500).json({ message: "Server error" });
    }
})

export default guestrouter