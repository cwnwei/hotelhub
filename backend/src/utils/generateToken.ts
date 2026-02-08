import jwt from "jsonwebtoken";

export interface UserPayload extends jwt.JwtPayload {
    userId: string;
    role: string;
}

export const generateAccessToken = (userId: string, role: string) => {
    return jwt.sign(
        { userId, role },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: "10m" }
    );
};

export const generateRefreshToken = (userId: string) => {
    return jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN_SECRET!,
        { expiresIn: "7d" }
    );
};