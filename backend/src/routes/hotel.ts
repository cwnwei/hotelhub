import express from "express";
import Hotel from "../models/Hotel"
import { authorizeRoles } from "../middleware/rbac"

const hotelrouter = express.Router();

hotelrouter.get("/", authorizeRoles('admin', 'user'), async (req, res) => {
    try {
        const hotels = await Hotel.find().sort({ createdAt: -1 });

        res.status(200).json({
            hotels,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
})

hotelrouter.get("/:id", authorizeRoles('admin', 'user'), async (req, res) => {
    try {
        const { id } = req.params;
        const hotel = await Hotel.findById(id);

        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        res.status(200).json({
            hotel,
        });

    } catch (err: any) {
        console.error(err);

        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid hotel ID" });
        }

        res.status(500).json({ message: "Server error" });
    }
})

hotelrouter.post("/", authorizeRoles('admin'), async (req, res) => {
    try {
        const { name, address, city, country, phone, email, star_rating, image_url, description } = req.body

        const existingHotel = await Hotel.findOne({ name, address })
        if (existingHotel) {
            return res.status(400).json({ message: "Hotel with this name and address already exists" })
        }

        const new_hotel = await Hotel.create({
            name,
            address,
            city,
            country,
            phone,
            email,
            star_rating,
            image_url,
            description
        })

        res.status(201).json({
            message: "Hotel created successfully",
            hotel: {
                "id": new_hotel.id,
                ...new_hotel.toJSON()
            },
        })
    } catch (err: any) {
        console.error(err);

        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: "Server error" });
    }
})

hotelrouter.put("/:id", authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedHotel = await Hotel.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedHotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        res.status(200).json({
            message: "Hotel updated successfully",
            hotel: updatedHotel,
        });

    } catch (err: any) {
        console.error(err);

        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: "Server error" });
    }
})

hotelrouter.delete("/:id", authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const deletedHotel = await Hotel.findByIdAndDelete(id);

        if (!deletedHotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        res.status(200).json({
            message: "Hotel deleted successfully",
            hotel: deletedHotel,
        });

    } catch (err: any) {
        console.error(err);

        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid hotel ID" });
        }

        res.status(500).json({ message: "Server error" });
    }
})

export default hotelrouter
