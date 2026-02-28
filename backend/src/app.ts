import express from "express";
import authrouter from "./routes/auth";
import roomrouter from "./routes/room";
import dotenv from "dotenv";
import cors from "cors"
import { connectDB } from "./config/database";
import mongoose from "mongoose";
import cookieParser from 'cookie-parser';


dotenv.config();
const app = express();
const port = process.env.PORT || "3000";

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: 'http://localhost:5173', // TODO: add into env for production
    credentials: true
}))

app.use("/auth", authrouter)
app.use("/rooms", roomrouter)

app.get("/", (req, res) => {
    res.send("Hello World!");
    console.log("Response sent");
});

app.get("/health", (_req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'ok',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

const main = async () => {
    await connectDB();

    app.listen(port, () => {
        console.log(`HotelHub server listening on port ${port}`);
    });
}

main();