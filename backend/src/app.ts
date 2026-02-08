import express from "express";
import authrouter from "./routes/auth";
import mongodbserver from "mongodb-memory-server"
import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config();
const app = express();
const port = "3000";

app.use(express.json())

app.use("/auth", authrouter)

app.get("/", (req, res) => {
    res.send("Hello World!");
    console.log("Response sent");
});

const main = async () => {
    // for testing only, change memory server to a persistent mongodb server
    const db_server = await mongodbserver.MongoMemoryServer.create();
    const uri = db_server.getUri()
    await mongoose.connect(uri);

    app.listen(port, () => {
        console.log(`HotelHub server listening on port ${port}`);
    });
}

main();