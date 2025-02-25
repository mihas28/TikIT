import cors from 'cors';
import helmet from 'helmet';
import express, { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
    user?: { userId: number };
}
import dotenv from 'dotenv';
import { getPostgresData, getCompany } from './db/postgres';
import connectMongo, { getChatsByTicketId, createChat } from './db/mongo';
import { authenticateJWT, generateAccessToken, generateRefreshToken, refreshToken } from './middleware/auth';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware za obdelavo JSON telesa
app.use(express.json());

// Nastavitve za CORS
app.use(cors({
    origin: 'http://localhost:5173', // Dovoli samo tvoj frontend (prilagodi po potrebi)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Uporaba Helmet za zaščito HTTP headerjev
app.use(helmet());

// Povežemo se na baze
const initializeDatabases = async () => {
  await connectMongo();
  console.log('MongoDB povezan.');
  console.log('PostgreSQL pool pripravljen.');
};

// **API endpoint za prijavo (vrne Access & Refresh Token)**
app.post('/login', (req: Request, res: Response) => {
    const userId = 1; // Simuliran uporabnik, v realnosti bi to prišlo iz baze

    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    res.json({ accessToken, refreshToken });
});

app.post('/refresh', async (req: Request, res: Response) => {
    refreshToken(req, res);
});

// **Zaščiten API endpoint (zahteva JWT token)**
app.get('/protected', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
    console.log("Decoded JWT user:", req.user); // Preveri kaj vsebuje token
    res.json({ message: `Pozdravljen, uporabnik ${req.user?.userId}!` });
});

// **API endpoint za pridobitev podatkov iz PostgreSQL**
app.get('/postgress', async (req, res) => {
  try {
    const postgresData = await getPostgresData();
    res.status(200).json(postgresData);
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz PostgreSQL:', error);
    res.status(500).json({ error: 'Napaka pri dostopu do PostgreSQL' });
  }
});

// **API endpoint za pridobitev podatkov iz PostgreSQL (company)**
app.get('/company', async (req, res) => {
    try {
      const postgresData = await getCompany();
      res.status(200).json(postgresData);
    } catch (error) {
      console.error('Napaka pri pridobivanju podatkov iz PostgreSQL:', error);
      res.status(500).json({ error: 'Napaka pri dostopu do PostgreSQL' });
    }
});

// **API endpoint za pridobitev chat podatkov glede na `ticket_id`**
app.get('/chats/ticket/:ticket_id', async (req: Request, res: Response) => {
    try {
        const ticketIdParam = req.params.ticket_id;

        const ticketId = parseInt(ticketIdParam, 10);
        const chatData = await getChatsByTicketId(ticketId);
        res.status(200).json(chatData);
    } catch (error) {
        console.error(`Napaka pri pridobivanju podatkov za ticket_id=${req.params.ticket_id}:`, error);
        res.status(500).json({ error: `Napaka pri dostopu do podatkov za ticket_id=${req.params.ticket_id}` });
    }
});

// **API endpoint za ustvarjanje novega chat sporočila**
app.post('/chat', async (req: Request, res: Response) => {
    try {
        const { ticket_id, message } = req.body as { ticket_id: number; message: { type: string; content: string | Buffer } };

        if (!ticket_id || !message || !message.type || !message.content) {
            res.status(400).json({ error: 'Manjkajoči podatki: ticket_id, message.type, message.content' });
            return;
        }

        if (!['text', 'image', 'document'].includes(message.type)) {
            res.status(400).json({ error: 'Neveljaven tip sporočila' })
            return;
        }
        
        const newChat = await createChat(ticket_id, message);
        res.status(201).json(newChat);
    } catch (error) {
        console.error('Napaka pri ustvarjanju chat sporočila:', error);
        res.status(500).json({ error: 'Napaka pri ustvarjanju chat sporočila' });
    }
});

// Inicializacija baz in zagon Express strežnika
initializeDatabases().then(() => {
  app.listen(PORT, () => {
    console.log(`Express strežnik teče na http://localhost:${PORT}`);
  });
});
