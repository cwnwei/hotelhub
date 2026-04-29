import express from "express";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import User from "../models/User"
import { generateAccessToken, generateRefreshToken, UserPayload } from "../utils/generateToken";

const authrouter = express.Router();

authrouter.post("/register", async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    const user = await User.findOne({ email })
    if (user) return res.status(400).json("User already exists")

    const hashed_password = await bcrypt.hash(password, 10)
    const new_user = await User.create({
        'full_name': name,
        phone,
        email,
        'password': hashed_password,
        role,
    })

    res.status(200).json('User created successfully')
})

authrouter.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // get user
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json("User not found")

    // authenticate password
    const password_match = await bcrypt.compare(password, user.password)
    if (!password_match) return res.status(403).json("Invalid password")

    const jwt_token = generateAccessToken(user.id, user.role)
    const refresh_token = generateRefreshToken(user.id)

    // save refresh_token to DB
    user.refreshToken = refresh_token
    await user.save()

    // save refresh_token to client cookies
    res.cookie("refreshToken", refresh_token, {
        httpOnly: true,
        secure: false, // false for local testinng
        sameSite: "lax",
        path: "/auth/refresh",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.cookie("jwtToken", jwt_token, {
        httpOnly: true,
        secure: false, // false for local testinng
        sameSite: "lax",
        path: "/",
        maxAge: 5 * 60 * 1000,
    })

    // return jwt access token
    const { password: remove_password, refreshToken, ...body} = user.toJSON()
    res.json(body)
})

authrouter.post("/logout", async (req, res) => {
    const refresh_token = req.cookies.refreshToken;
    if (!refresh_token) return res.sendStatus(200)

    // clear refresh token from DB
    const user = await User.findOne({ refreshToken: refresh_token })
    if (user) {
        user.refreshToken = ''
        await user.save()
    }

    // clear client cookies
    res.clearCookie("refreshToken")
    res.clearCookie("jwtToken")
    res.sendStatus(200)
})

authrouter.post("/refresh", async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json("No refresh token sent");

    try {
        const decoded = jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECRET!
        ) as UserPayload;

        const user = await User.findById(decoded.userId)
        if (!user)
            return res.status(404).json("User not found");
        if (!user.refreshToken) return res.status(401).json("No refresh token, please login again")

        const new_jwt_token = generateAccessToken(user.id, user.role);
        res.cookie("jwtToken", new_jwt_token, {
            httpOnly: true,
            secure: false, // false for local testinng
            sameSite: "lax",
            path: "/",
            maxAge: 5 * 60 * 1000,
        })
        res.sendStatus(200)
    }
    catch {
        res.status(401).json("Invalid refresh token, please login again")
    }
});

export default authrouter