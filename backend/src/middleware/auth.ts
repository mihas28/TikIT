import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
    user?: any;
}
interface CustomRequest extends Request {
    user?: { userId: number; role: string };
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
export const generateAccessToken = (userId: number, role: string): string => {
    return jwt.sign(
        { userId, role },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '15m' } as SignOptions // Pusti kot string
    );
};

// **Funkcija za generiranje Refresh Tokena**
export const generateRefreshToken = (userId: number, role: string): string => {
    return jwt.sign(
        { userId, role },
        JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' } as SignOptions // Pusti kot string
    );
};

// **Middleware za preverjanje Access Tokena**
export const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET as string, (err, user: any) => {
            if (err) {
                return res.status(403).json({ error: 'Neveljaven ali potekel JWT token' });
            }
            req.user = user; // Shranimo uporabnika v zahtevo
            next();
        });
    } else {
        res.status(401).json({ error: 'Manjkajoč JWT token' });
    }
};

// **Middleware za preverjanje vloge uporabnika**
export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Nimate dovoljenja za dostop do tega vira' });
            return;
        }
        next();
    };
};

// **Funkcija za preverjanje in osvežitev Refresh Tokena**
export const refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Manjka refresh token.' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { userId: number; role: string };

        // Ustvari nov Access Token na podlagi refresh tokena
        const newAccessToken = generateAccessToken(decoded.userId, decoded.role);

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        return res.status(403).json({ error: 'Neveljaven ali potekel refresh token.' });
    }
};
