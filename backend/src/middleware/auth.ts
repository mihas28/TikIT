import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
    user?: any;
}
import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// **Preverimo, ali so JWT ključi nastavljeni**
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error('Napaka: JWT_SECRET ali JWT_REFRESH_SECRET ni nastavljen v .env datoteki!');
}

// **Funkcija za generiranje Access Tokena**
export const generateAccessToken = (userId: number): string => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '15m' } as SignOptions // Pusti kot string
    );
};

// **Funkcija za generiranje Refresh Tokena**
export const generateRefreshToken = (userId: number): string => {
    return jwt.sign(
        { userId },
        JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' } as SignOptions // Pusti kot string
    );
};

// **Middleware za preverjanje Access Tokena**
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'Manjka JWT token.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            res.status(403).json({ error: 'Neveljaven ali potekel JWT token.' });
            return;
        }

        req.user = user;
        next();
    });
};

// **Funkcija za preverjanje in osvežitev Refresh Tokena**
export const refreshToken = (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Manjka refresh token.' });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: number };

        const newAccessToken = jwt.sign(
            { userId: decoded.userId },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION } as SignOptions
        );

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error("Napaka pri preverjanju refresh tokena:", error);
        return res.status(403).json({ error: 'Neveljaven ali potekel refresh token.' });
    }
};
