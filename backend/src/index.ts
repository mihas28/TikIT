import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import { Request, Response } from 'express';
import { Application } from 'express-serve-static-core';
import multer from 'multer';
import jwt from "jsonwebtoken";

import http from 'http';
import { Server } from 'socket.io';

interface AuthenticatedRequest extends Request {
    user?: { userId: number };
}
import dotenv from 'dotenv';
import { getCompany, verifyUser, registerUser, getAllCompanies, 
  getCompanyById, createCompany, updateCompany, getAllContracts, getContractById, createContract, updateContract, getAllUsers, 
  getUserById, updateUser, updatePasswordWithOld, updatePasswordWithoutOld, getAllGroups, getGroupById, createGroup, updateGroup, 
  getAllTickets, getTicketById, createTicket, updateTicket, getTimeWorkedByUserAndTicket, createTimeWorked, updateTimeWorked,
  getAllCompaniesEssential, getAllContractsEssential, getAllUsersEssential, getAllGroupsEssential, getAllTicketsEssential,
  getTimeWorkedByTicket, updatePrimary, syncAdditionalResolvers, getNameLastNamebyUserId, resolveTicket, cancelTicket, reOpenTicket, putOnHoldTicket} from './db/postgres';
import connectMongo, { getChatsByTicketId, createChat } from './db/mongo';
import { authenticateJWT, generateAccessToken, generateRefreshToken, refreshToken, authorizeRoles } from './middleware/auth';
import { check } from 'express-validator';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173', // Enako kot za Express
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    },
    transports: ["websocket"], // Omogoči samo WebSocket (brez long polling)
    pingInterval: 25000, // Pošlji ping vsakih 25s
    pingTimeout: 60000, // Počakaj 60s pred timeoutom
});
const PORT = process.env.PORT || 3000;

// Middleware za obdelavo JSON telesa
app.use(express.json());

// Nastavitve za CORS
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Uporaba Helmet za zaščito HTTP headerjev
app.use(helmet());

const formatDate = (date: Date): string => {
    return date.toLocaleString("sl-SI", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).replace(",", "");
};

// Povežemo se na baze
const initializeDatabases = async () => {
  await connectMongo();
  console.log('MongoDB povezan.');
  console.log('PostgreSQL pool pripravljen.');
};

// Konfiguracija multer za shranjevanje datotek v pomnilnik
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/refresh', async (req: Request, res: Response) => {
    refreshToken(req, res);
});

/*// **API endpoint za pridobitev podatkov iz PostgreSQL** ----------- odstani
app.get('/postgress', async (req, res) => {
  try {
    const postgresData = await getPostgresData();
    res.status(200).json(postgresData);
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz PostgreSQL:', error);
    res.status(500).json({ error: 'Napaka pri dostopu do PostgreSQL' });
  }
});*/

// **API endpoint za pridobitev vseh chat podatkov glede na `ticket_id`**
app.get('/chat/privat/:ticket_id', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response): Promise<void> => {
    try {
        const ticketIdParam = req.params.ticket_id;
        const ticketId = parseInt(ticketIdParam, 10);

        if (isNaN(ticketId)) {
            res.status(400).json({ error: 'Neveljaven `ticket_id`' });
            return;
        }

        const chatData = await getChatsByTicketId(ticketId);
        res.status(200).json(chatData);
    } catch (error) {
        console.error(`Napaka pri pridobivanju podatkov za ticket_id=${req.params.ticket_id}:`, error);
        res.status(500).json({ error: `Napaka pri dostopu do podatkov za ticket_id=${req.params.ticket_id}` });
    }
});

// **API endpoint za pridobitev javnih chat podatkov glede na `ticket_id`**
app.get('/chat/public/:ticket_id', authenticateJWT, authorizeRoles('admin', 'operator', 'user'), async (req: Request, res: Response): Promise<void> => {
    try {
        const ticketIdParam = req.params.ticket_id;
        const ticketId = parseInt(ticketIdParam, 10);

        if (isNaN(ticketId)) {
            res.status(400).json({ error: 'Neveljaven `ticket_id`' });
            return;
        }

        const chatData = await getChatsByTicketId(ticketId);
        res.status(200).json(chatData);
    } catch (error) {
        console.error(`Napaka pri pridobivanju podatkov za ticket_id=${req.params.ticket_id}:`, error);
        res.status(500).json({ error: `Napaka pri dostopu do podatkov za ticket_id=${req.params.ticket_id}` });
    }
});

// **API endpoint za ustvarjanje novega privat chat sporočila**
app.post('/chat/privat', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
    try {
        const { ticket_id, message, name } = req.body as { 
          ticket_id: number; 
          message: { type: string; content: string | Buffer, filename: string };
          private: boolean;
          name: string;
        };

        if (!ticket_id || !message || !message.type || !message.content) {
            res.status(400).json({ error: 'Manjkajoči podatki: ticket_id, message.type, message.content, private' });
            return;
        }

        if (!['text', 'image', 'document'].includes(message.type)) {
            res.status(400).json({ error: 'Neveljaven tip sporočila' });
            return;
        }
        
        const newChat = await createChat(ticket_id, message, true, name);
        res.status(201).json(newChat);
    } catch (error) {
        console.error('Napaka pri ustvarjanju chat sporočila:', error);
        res.status(500).json({ error: 'Napaka pri ustvarjanju chat sporočila' });
    }
});

// **API endpoint za ustvarjanje novega javnega chat sporočila**
app.post('/chat/public', authenticateJWT, authorizeRoles('admin', 'operator', 'user'), async (req: Request, res: Response) => {
    try {
        const { ticket_id, message, name } = req.body as { 
          ticket_id: number; 
          message: { type: string; content: string | Buffer, filename: string };
          private: boolean;
          name: string;
        };

        if (!ticket_id || !message || !message.type || !message.content) {
            res.status(400).json({ error: 'Manjkajoči podatki: ticket_id, message.type, message.content, private' });
            return;
        }

        if (!['text', 'image', 'document'].includes(message.type)) {
            res.status(400).json({ error: 'Neveljaven tip sporočila' });
            return;
        }
        
        const newChat = await createChat(ticket_id, message, false, name);
        res.status(201).json(newChat);
    } catch (error) {
        console.error('Napaka pri ustvarjanju chat sporočila:', error);
        res.status(500).json({ error: 'Napaka pri ustvarjanju chat sporočila' });
    }
});

// **API endpoint za registracijo novega uporabnika**
// @ts-ignore
app.post('/register', authenticateJWT, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
      const { username, password, first_name, last_name, email, phone_number, role } = req.body;

      if (!username || !password || !first_name || !last_name || !email || !phone_number) {
          return res.status(400).json({ error: 'Manjkajoči podatki za registracijo.' });
      }

      const newUser = await registerUser(username, password, first_name, last_name, email, phone_number, role);

      // Ustvari JWT tokena z vlogo
      const accessToken = generateAccessToken(newUser.user_id, newUser.role);
      const refreshToken = generateRefreshToken(newUser.user_id, newUser.role);

      res.status(201).json({ accessToken, refreshToken });
  } catch (error) {
      console.error('Napaka pri registraciji:', error);
      res.status(500).json({ error: 'Napaka pri obdelavi registracije' });
  }
});

// **API endpoint za prijavo uporabnika**
// @ts-ignore
app.post('/login', async (req: Request, res: Response) => {
  try {
      const { username, password } = req.body as { username: string; password: string };

      if (!username || !password) {
          return res.status(400).json({ error: 'Manjkajoče uporabniško ime ali geslo.' });
      }

      const user = await verifyUser(username, password);
      if (!user) {
          return res.status(401).json({ error: 'Neveljavno uporabniško ime ali geslo.' });
      }

      // Ustvari JWT tokena z vlogo
      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id, user.role);

      res.json({ accessToken, refreshToken });
  } catch (error) {
      console.error('Napaka pri prijavi:', error);
      res.status(500).json({ error: 'Napaka pri obdelavi prijave' });
  }
});

// **Pridobitev vseh podjetij**
app.get('/company', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
  try {
      const companies = await getAllCompanies();
      res.status(200).json(companies);
  } catch (error) {
      console.error('Napaka pri pridobivanju podjetij:', error);
      res.status(500).json({ error: 'Napaka pri dostopu do podatkov podjetij' });
  }
});

// **Pridobitev vseh osnovnih podatkov podjetij**
app.get('/company/essential', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
    try {
        const companies = await getAllCompaniesEssential();
        res.status(200).json(companies);
    } catch (error) {
        console.error('Napaka pri pridobivanju podjetij:', error);
        res.status(500).json({ error: 'Napaka pri dostopu do podatkov podjetij' });
    }
  });

// **Pridobitev enega podjetja na podlagi company_id**
// @ts-ignore
app.get('/company/:company_id', authenticateJWT, async (req: Request, res: Response) => {
  try {
      const company_id = parseInt(req.params.company_id, 10);
      if (isNaN(company_id)) {
          return res.status(400).json({ error: 'Neveljaven company_id' });
      }

      const company = await getCompanyById(company_id);
      if (!company) {
          return res.status(404).json({ error: 'Podjetje ni najdeno' });
      }

      res.status(200).json(company);
  } catch (error) {
      console.error(`Napaka pri pridobivanju podjetja ID=${req.params.company_id}:`, error);
      res.status(500).json({ error: 'Napaka pri dostopu do podjetja' });
  }
});

// **Dodajanje novega podjetja**
// @ts-ignore
app.post('/company', authenticateJWT, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
      const { company_name, email, phone, street, city, post_code, country, notes } = req.body;

      if (!company_name || !email || !phone || !street || !city || !post_code || !country) {
          return res.status(400).json({ error: 'Manjkajoči podatki' });
      }

      const newCompany = await createCompany(company_name, email, phone, street, city, post_code, country, notes);
      res.status(201).json(newCompany);
  } catch (error) {
      console.error('Napaka pri dodajanju podjetja:', error);
      res.status(500).json({ error: 'Napaka pri dodajanju podjetja' });
  }
});

// **Posodobitev podjetja na podlagi company_id**
// @ts-ignore
app.put('/company/:company_id', authenticateJWT, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
      const company_id = parseInt(req.params.company_id, 10);
      if (isNaN(company_id)) {
          return res.status(400).json({ error: 'Neveljaven company_id' });
      }

      const { company_name, email, phone, street, city, post_code, country, notes } = req.body;

      if (!company_name || !email || !phone || !street || !city || !post_code || !country) {
          return res.status(400).json({ error: 'Manjkajoči podatki' });
      }

      const updatedCompany = await updateCompany(company_id, company_name, email, phone, street, city, post_code, country, notes);
      if (!updatedCompany) {
          return res.status(404).json({ error: 'Podjetje ni najdeno' });
      }

      res.status(200).json(updatedCompany);
  } catch (error) {
      console.error(`Napaka pri posodabljanju podjetja ID=${req.params.company_id}:`, error);
      res.status(500).json({ error: 'Napaka pri posodabljanju podjetja' });
  }
});

// **Pridobitev vseh pogodb**
app.get('/contract', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
    try {
        const contracts = await getAllContracts();
        res.status(200).json(contracts);
    } catch (error) {
        console.error('Napaka pri pridobivanju pogodb:', error);
        res.status(500).json({ error: 'Napaka pri dostopu do podatkov pogodb' });
    }
});

// **Pridobitev vseh osnovnih podatkov o pogodbah**
app.get('/contract/essential', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
    try {
        const contracts = await getAllContractsEssential();
        res.status(200).json(contracts);
    } catch (error) {
        console.error('Napaka pri pridobivanju pogodb:', error);
        res.status(500).json({ error: 'Napaka pri dostopu do podatkov pogodb' });
    }
});

// **Pridobitev ene datoteke pogodbe na podlagi contract_id**
// @ts-ignore
app.get('/contract/:id/file', authenticateJWT, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Poizvedba v bazo, da pridobiš binarne podatke pogodbe
        const contract = await getContractById(parseInt(id, 10));

        if (!contract || !contract.contract_file) {
            return res.status(404).json({ error: 'Pogodba ali datoteka ne obstaja' });
        }

        // Nastavi pravilne HTTP glave
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=contract-${id}.pdf`);
        
        // Pošlji binarne podatke
        res.send(contract.contract_file);
    } catch (error) {
        console.error('Napaka pri pridobivanju pogodbe:', error);
        res.status(500).json({ error: 'Napaka pri pridobivanju pogodbe' });
    }
});


// **Pridobitev ene pogodbe na podlagi contract_id**
// @ts-ignore
app.get('/contract/:contract_id', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
    try {
        const contract_id = parseInt(req.params.contract_id, 10);
        if (isNaN(contract_id)) {
            return res.status(400).json({ error: 'Neveljaven contract_id' });
        }

        const contract = await getContractById(contract_id);
        if (!contract) {
            return res.status(404).json({ error: 'Pogodba ni najdena' });
        }

        res.status(200).json(contract);
    } catch (error) {
        console.error(`Napaka pri pridobivanju pogodbe ID=${req.params.contract_id}:`, error);
        res.status(500).json({ error: 'Napaka pri dostopu do pogodbe' });
    }
});

// **Dodajanje nove pogodbe (sprejema PDF datoteko)**
// @ts-ignore
app.post('/contract', upload.single('contract_file'), authenticateJWT, authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
        const { company_id, short_description, description, start_date, end_date, state } = req.body;
        if (!company_id || !short_description || !description || !start_date || !end_date || !state || !req.file) {
            return res.status(400).json({ error: 'Manjkajoči podatki ali datoteka' });
        }

        const newContract = await createContract(
            parseInt(company_id, 10),
            short_description,
            description,
            start_date,
            end_date,
            state,
            req.file.buffer // Shrani datoteko kot binarni podatek
        );

        res.status(201).json(newContract);
    } catch (error) {
        console.error('Napaka pri dodajanju pogodbe:', error);
        res.status(500).json({ error: 'Napaka pri dodajanju pogodbe' });
    }
});

// **Posodobitev pogodbe na podlagi contract_id**
// @ts-ignore
app.put('/contract/:contract_id', authenticateJWT, authorizeRoles('admin'), upload.single('contract_file'), async (req: Request, res: Response) => {
    try {

        const contract_id = parseInt(req.params.contract_id, 10);
        if (isNaN(contract_id)) {
            return res.status(400).json({ error: 'Neveljaven contract_id' });
        }

        const { company_id, short_description, description, start_date, end_date, state } = req.body;

        if (!company_id || !short_description || !description || !start_date || !end_date || !state) {
            return res.status(400).json({ error: 'Manjkajoči podatki' });
        }

        let updatedContract;

        if (req.file) {
            updatedContract = await updateContract({
                contract_id,
                company_id: parseInt(company_id, 10),
                short_description,
                description,
                start_date,
                end_date,
                state,
                contract_file: req.file.buffer, // Shrani binarno datoteko
            });
        } else {
            updatedContract = await updateContract({
                contract_id,
                company_id: parseInt(company_id, 10),
                short_description,
                description,
                start_date,
                end_date,
                state,
            });
        }

        if (!updatedContract) {
            return res.status(404).json({ error: 'Pogodba ni najdena' });
        }

        res.status(200).json(updatedContract);
    } catch (error) {
        console.error(`Napaka pri posodabljanju pogodbe ID=${req.params.contract_id}:`, error);
        res.status(500).json({ error: 'Napaka pri posodabljanju pogodbe' });
    }
});

// **Pridobitev vseh uporabnikov (brez gesla)**
app.get('/users', authenticateJWT, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
      const users = await getAllUsers();
      res.status(200).json(users);
  } catch (error) {
      console.error('Napaka pri pridobivanju uporabnikov:', error);
      res.status(500).json({ error: 'Napaka pri dostopu do podatkov uporabnikov' });
  }
});

// **Pridobitev vseh osnovnih podatkov o uporabnikih (brez gesla)**
app.get('/users/essential', authenticateJWT, authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
        const users = await getAllUsersEssential();
        res.status(200).json(users);
    } catch (error) {
        console.error('Napaka pri pridobivanju uporabnikov:', error);
        res.status(500).json({ error: 'Napaka pri dostopu do podatkov uporabnikov' });
    }
  });

// **Pridobitev enega uporabnika na podlagi user_id (brez gesla)**
// @ts-ignore
app.get('/users/:user_id', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
  try {
      const user_id = parseInt(req.params.user_id, 10);
      if (isNaN(user_id)) {
          return res.status(400).json({ error: 'Neveljaven user_id' });
      }

      const user = await getUserById(user_id);
      if (!user) {
          return res.status(404).json({ error: 'Uporabnik ni najden' });
      }

      res.status(200).json(user);
  } catch (error) {
      console.error(`Napaka pri pridobivanju uporabnika ID=${req.params.user_id}:`, error);
      res.status(500).json({ error: 'Napaka pri dostopu do uporabnika' });
  }
});

/*// **Dodajanje novega uporabnika**
// @ts-ignore
app.post('/users', authenticateJWT, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
      const { first_name, last_name, email, phone_number, role, company_id, group_id, password } = req.body;

      if (!first_name || !last_name || !email || !phone_number || !role || !company_id || !group_id || !password) {
          return res.status(400).json({ error: 'Manjkajoči podatki' });
      }

      const user = await createUser(first_name, last_name, email, phone_number, role, company_id, group_id, password);

      res.status(201).json(user);
    } catch (error) {
        console.error('Napaka pri dodajanju uporabnika:', error);
        res.status(500).json({ error: 'Napaka pri dodajanju uporabnika' });
    }
});*/   

// **API endpoint za registracijo novega uporabnika**
// @ts-ignore
app.post('/users', authenticateJWT, authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
        const { username, password, first_name, last_name, email, phone_number, role, company_id, group_id } = req.body;
  
        if (!username || !password || !first_name || !last_name || !email || !phone_number || !role || !company_id || !group_id) {
            return res.status(400).json({ error: 'Manjkajoči podatki za registracijo.' });
        }
  
        const newUser = await registerUser(username, password, first_name, last_name, email, phone_number, role, company_id, group_id);
  
        res.status(201).json({ newUser });
    
    } catch (error) {
        console.error('Napaka pri registraciji:', error);
        res.status(500).json({ error: 'Napaka pri obdelavi registracije' });
    }
  });

// **Posodobitev uporabnika**
// @ts-ignore
app.put('/users/:user_id', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
  try {
      const user_id = parseInt(req.params.user_id, 10);
      if (isNaN(user_id)) {
          return res.status(400).json({ error: 'Neveljaven user_id' });
      }

      const { first_name, last_name, email, phone_number, role, company_id, group_id } = req.body;
      const updatedUser = await updateUser(user_id, first_name, last_name, email, phone_number, role, company_id, group_id);

      if (!updatedUser) {
          return res.status(404).json({ error: 'Uporabnik ni najden' });
      }

      res.status(200).json(updatedUser);
  } catch (error) {
      console.error(`Napaka pri posodabljanju uporabnika ID=${req.params.user_id}:`, error);
      res.status(500).json({ error: 'Napaka pri posodabljanju uporabnika' });
  }
});

// **Posodobitev gesla z zahtevanim starim geslom**
// @ts-ignore
app.put('/users/password/user/reset/:user_id', async (req, res) => {
    try {
      const { user_id } = req.params;
      const { old_password, new_password } = req.body;
  
      if (!old_password || !new_password) {
        return res.status(400).json({ message: 'Manjkajoči podatki!' });
      }
  
      const result = await updatePasswordWithoutOld(parseInt(user_id), new_password);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Geslo uspešno ponastavljeno' });
      }
  
      res.json({ message: 'Geslo uspešno posodobljeno!' });
    } catch (error) {
      console.error('Napaka pri posodabljanju gesla:', error);
      res.status(500).json({ message: 'Napaka na strežniku' });
    }
  });

// **Posodobitev gesla brez preverjanja starega gesla**
app.put('/users/password/admin/reset/:user_id', authenticateJWT, authorizeRoles('admin'), async (req: Request, res: Response): Promise<void> => {
    try {
        const user_id = parseInt(req.params.user_id, 10);
        if (isNaN(user_id)) {
            res.status(400).json({ error: 'Neveljaven user_id' });
            return;
        }
        const new_password = req.body.updatedData;

        if (!new_password) {
            res.status(400).json({ error: 'Manjkajoči podatki' });
            return;
        }

        await updatePasswordWithoutOld(user_id, new_password);
        res.status(200).json({ message: 'Geslo uspešno ponastavljeno' });
    } catch (error) {
        res.status(500).json({ error: 'Napaka pri posodabljanju gesla' });
    }
});

// **Pridobitev vseh skupin**
app.get('/groups', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
  try {
      const groups = await getAllGroups();
      res.status(200).json(groups);
  } catch (error) {
      console.error('Napaka pri pridobivanju skupin:', error);
      res.status(500).json({ error: 'Napaka pri dostopu do podatkov skupin' });
  }
});

// **Pridobitev osnovnih podatkov o skupinah**
app.get('/groups/essential', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
    try {
        const groups = await getAllGroupsEssential();
        res.status(200).json(groups);
    } catch (error) {
        console.error('Napaka pri pridobivanju skupin:', error);
        res.status(500).json({ error: 'Napaka pri dostopu do podatkov skupin' });
    }
  });

// **Pridobitev ene skupine na podlagi group_id**
// @ts-ignore
app.get('/groups/:group_id', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
  try {
      const group_id = parseInt(req.params.group_id, 10);
      if (isNaN(group_id)) {
          return res.status(400).json({ error: 'Neveljaven group_id' });
      }

      const group = await getGroupById(group_id);
      if (!group) {
          return res.status(404).json({ error: 'Skupina ni najdena' });
      }

      res.status(200).json(group);
  } catch (error) {
      console.error(`Napaka pri pridobivanju skupine ID=${req.params.group_id}:`, error);
      res.status(500).json({ error: 'Napaka pri dostopu do skupine' });
  }
});

// **Dodajanje nove skupine**
// @ts-ignore
app.post('/groups', authenticateJWT, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
      const { group_name, description, email } = req.body;

      if (!group_name || !email) {
          return res.status(400).json({ error: 'Manjkajoči podatki' });
      }

      const newGroup = await createGroup(group_name, description, email);
      res.status(201).json(newGroup);
  } catch (error) {
      console.error('Napaka pri dodajanju skupine:', error);
      res.status(500).json({ error: 'Napaka pri dodajanju skupine' });
  }
});

// **Posodobitev skupine na podlagi group_id**
// @ts-ignore
app.put('/groups/:group_id', authenticateJWT, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
      const group_id = parseInt(req.params.group_id, 10);
      if (isNaN(group_id)) {
          return res.status(400).json({ error: 'Neveljaven group_id' });
      }

      const { group_name, description, email } = req.body;

      if (!group_name || !email || !description) {
          return res.status(400).json({ error: 'Manjkajoči podatki' });
      }

      const updatedGroup = await updateGroup(group_id, group_name, description, email);
      if (!updatedGroup) {
          return res.status(404).json({ error: 'Skupina ni najdena' });
      }

      res.status(200).json(updatedGroup);
  } catch (error) {
      console.error(`Napaka pri posodabljanju skupine ID=${req.params.group_id}:`, error);
      res.status(500).json({ error: 'Napaka pri posodabljanju skupine' });
  }
});

// **Pridobitev vseh zahtevkov**
app.get('/tickets', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
  try {
      const tickets = await getAllTickets();
      res.status(200).json(tickets);
  } catch (error) {
      console.error('Napaka pri pridobivanju zahtevkov:', error);
      res.status(500).json({ error: 'Napaka pri dostopu do podatkov zahtevkov' });
  }
});

// **Pridobitev samo naslova in ticket id-ja vseh zahtevkov**
app.get('/tickets/essential', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
    try {
        const tickets = await getAllTicketsEssential();
        res.status(200).json(tickets);
    } catch (error) {
        console.error('Napaka pri pridobivanju zahtevkov:', error);
        res.status(500).json({ error: 'Napaka pri dostopu do podatkov zahtevkov' });
    }
});

// **Pridobitev enega zahtevka na podlagi ticket_id**
// @ts-ignore
app.get('/tickets/:ticket_id', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
  try {
      const ticket_id = parseInt(req.params.ticket_id, 10);
      if (isNaN(ticket_id)) {
          return res.status(400).json({ error: 'Neveljaven ticket_id' });
      }

      const ticket = await getTicketById(ticket_id);
      if (!ticket) {
          return res.status(404).json({ error: 'Zahtevek ni najden' });
      }

      const primary = await getTimeWorkedByTicket(ticket_id, true);
      if (!primary) {
          return res.status(404).json({ error: 'Reševalec ni najden' });
      }

      const other = await getTimeWorkedByTicket(ticket_id, false);

      res.status(200).json({ticket, primary, other});
  } catch (error) {
      console.error(`Napaka pri pridobivanju zahtevka ID=${req.params.ticket_id}:`, error);
      res.status(500).json({ error: 'Napaka pri dostopu do zahtevka' });
  }
});

// **Pridobitev vseh reševalcev (primarnih in sekundarnih) na podlagi ticket_id**
// @ts-ignore
app.get('/tickets-time-worked/:ticket_id', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
    try {
        const ticket_id = parseInt(req.params.ticket_id, 10);
        if (isNaN(ticket_id)) {
            return res.status(400).json({ error: 'Neveljaven ticket_id' });
        }
  
        const primary = await getTimeWorkedByTicket(ticket_id, true);
        if (!primary) {
            return res.status(404).json({ error: 'Reševalec ni najden' });
        }
  
        const other = await getTimeWorkedByTicket(ticket_id, false);
  
        res.status(200).json({ primary, other });
    } catch (error) {
        console.error(`Napaka pri pridobivanju zahtevka ID=${req.params.ticket_id}:`, error);
        res.status(500).json({ error: 'Napaka pri dostopu do zahtevka' });
    }
  });

// **Dodajanje novega zahtevka**
// @ts-ignore
app.post('/tickets', authenticateJWT, async (req: Request, res: Response) => {
  try {
      const { title, description, impact, urgency, state, type, caller_id, parent_ticket_id, group_id, contract_id } = req.body;

      if (!title || !description || !impact || !urgency || !state || !type || !caller_id || !group_id || !contract_id) {
          return res.status(400).json({ error: 'Manjkajoči podatki' });
      }

      const newTicket = await createTicket(title, description, impact, urgency, state, type, caller_id, parent_ticket_id, group_id, contract_id);
      createChat(newTicket.ticket_id, { type: "text", content: "Ticket z številko " + newTicket.ticket_id + " uspešno ustvarjen dne " + formatDate(new Date()), filename: ''}, false, "system");
      res.status(201).json(newTicket);
  } catch (error) {
      console.error('Napaka pri dodajanju zahtevka:', error);
      res.status(500).json({ error: 'Napaka pri dodajanju zahtevka' });
  }
});

// **Posodabljanje statusa ticketa**
// @ts-ignore
app.put('/tickets/close/:ticket_id', authenticateJWT, authorizeRoles('admin', 'operator'), async (req, res) => {
    const ticket_id = parseInt(req.params.ticket_id, 10);
    const { status, close_code, close_notes } = req.body;
  
    try {
      if (status === 'resolved') {
        await resolveTicket(ticket_id, close_code, close_notes);
      } else if (status === 'cancelled') {
        await cancelTicket(ticket_id);
      } else if (status === 'open') {
        await reOpenTicket(ticket_id);
      } else if (status === 'awaiting info') {
        await putOnHoldTicket(ticket_id);
      }
      res.status(200).json({ message: "Ticket status posodobljen." });
    } catch (error) {
      console.error("Napaka pri posodabljanju statusa zahtevka:", error);
      res.status(500).json({ error: "Napaka pri posodobitvi stanja zahtevka" });
    }
  });
  

// **Posodobitev zahtevka na podlagi ticket_id**
// @ts-ignore
app.put('/tickets/:ticket_id', authenticateJWT, async (req: Request, res: Response) => {
  try {
      const ticket_id = parseInt(req.params.ticket_id, 10);
      if (isNaN(ticket_id)) {
          return res.status(400).json({ error: 'Neveljaven ticket_id' });
      }

      const { title, description, impact, urgency, state, type, caller_id, parent_ticket_id, group_id, contract_id, accepted_at } = req.body;

      if (!title || !description || !impact || !urgency || !state || !type || !caller_id || !group_id || !contract_id) {
          return res.status(400).json({ error: 'Manjkajoči podatki' });
      }

      const updatedTicket = await updateTicket(ticket_id, title, description, impact, urgency, state, type, caller_id, parent_ticket_id, group_id, contract_id, accepted_at);
      if (!updatedTicket) {
          return res.status(404).json({ error: 'Zahtevek ni najden' });
      }

      res.status(200).json(updatedTicket);
  } catch (error) {
      console.error(`Napaka pri posodabljanju zahtevka ID=${req.params.ticket_id}:`, error);
      res.status(500).json({ error: 'Napaka pri posodabljanju zahtevka' });
  }
});

// **Pridobitev delovnega časa za določenega uporabnika in zahtevek**
// @ts-ignore
app.get('/time-worked/:user_id/:ticket_id', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
  try {
      const user_id = parseInt(req.params.user_id, 10);
      const ticket_id = parseInt(req.params.ticket_id, 10);
      if (isNaN(user_id) || isNaN(ticket_id)) {
          return res.status(400).json({ error: 'Neveljaven user_id ali ticket_id' });
      }

      const timeWorked = await getTimeWorkedByUserAndTicket(user_id, ticket_id);
      
      res.status(200).json(timeWorked);
  } catch (error) {
      console.error(`Napaka pri pridobivanju delovnega časa za user_id=${req.params.user_id} in ticket_id=${req.params.ticket_id}:`, error);
      res.status(500).json({ error: 'Napaka pri dostopu do podatkov delovnega časa' });
  }
});

// **Dodajanje novega vnosa delovnega časa**
// @ts-ignore
app.post('/time-worked', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
  try {
      const { user_id, ticket_id, primary } = req.body;

      if (!user_id || !ticket_id) {
          return res.status(400).json({ error: 'Manjkajoči podatki' });
      }

      const newTimeWorked = await createTimeWorked(user_id, ticket_id, 0, '', primary);
      res.status(201).json(newTimeWorked);
  } catch (error) {
      console.error('Napaka pri dodajanju vnosa delovnega časa:', error);
      res.status(500).json({ error: 'Napaka pri dodajanju vnosa delovnega časa' });
  }
});

// **Posodobitev delovnega časa na podlagi user_id in ticket_id**
// @ts-ignore
app.put('/time-worked/:user_id/:ticket_id', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
  try {
      const user_id = parseInt(req.params.user_id, 10);
      const ticket_id = parseInt(req.params.ticket_id, 10);
      if (isNaN(user_id) || isNaN(ticket_id)) {
          return res.status(400).json({ error: 'Neveljaven user_id ali ticket_id' });
      }

      const { time_worked, description } = req.body;

      if (!time_worked || !description) {
          return res.status(400).json({ error: 'Manjkajoči podatki' });
      }

      const updatedTimeWorked = await updateTimeWorked(user_id, ticket_id, time_worked, description);
      if (!updatedTimeWorked) {
          return res.status(404).json({ error: 'Vnos delovnega časa ni najden' });
      }

      res.status(200).json(updatedTimeWorked);
  } catch (error) {
      console.error(`Napaka pri posodabljanju delovnega časa za user_id=${req.params.user_id} in ticket_id=${req.params.ticket_id}:`, error);
      res.status(500).json({ error: 'Napaka pri posodabljanju delovnega časa' });
  }
});

// **Posodobitev primarnega reševalca**
// @ts-ignore
app.put('/time-worked/update', authenticateJWT, authorizeRoles('admin', 'operator'), async (req: Request, res: Response) => {
    try {
        const new_user_id = parseInt(req.body.new_user_id, 10);
        const old_user_id = parseInt(req.body.old_user_id, 10);
        const ticket_id = parseInt(req.body.ticket_id, 10);
        const primary = req.body.primary;

        if (isNaN(new_user_id) || isNaN(old_user_id) || isNaN(ticket_id)) {
            return res.status(400).json({ error: 'Neveljaven new_user_id, old_user_id ali ticket_id' });
        }
  
        const updatePrimaryResolver = await updatePrimary(old_user_id, new_user_id, ticket_id, primary);
        if (!updatePrimaryResolver) {
            return res.status(404).json({ error: 'Vnos delovnega časa ni najden' });
        }
  
        res.status(200).json(updatePrimaryResolver);
    } catch (error) {
        console.error(`Napaka pri posodabljanju delovnega časa za new_user_id=${req.params.new_user_id}, old_user_id=${req.params.old_user_id} in ticket_id=${req.params.ticket_id}:`, error);
        res.status(500).json({ error: 'Napaka pri posodabljanju primarnega dodeljenega' });
    }
  });

  // **Posodobitev dodatnih reševalcev**
  // @ts-ignore
  app.put('/time-worked-update/additional', authenticateJWT, async (req, res) => {
    try {
        const { ticket_id, toRemove, toAdd } = req.body;

        if (!ticket_id || (!toRemove.length && !toAdd.length)) {
            return res.status(400).json({ error: 'Neveljavni podatki za posodobitev reševalcev' });
        }

        const result = await syncAdditionalResolvers(ticket_id, toRemove, toAdd);
        res.status(200).json(result);
    } catch (error) {
        console.error(`Napaka pri posodabljanju pomožnih reševalcev za ticket_id=${req.body.ticket_id}:`, error);
        res.status(500).json({ error: 'Napaka pri posodobitvi pomožnih reševalcev' });
    }
});

// **API za nalaganje PDF datotek**
// @ts-ignore
app.post("/chat/upload", upload.single("file"), authenticateJWT, async (req: Request, res: Response) => {
    try {
      const { ticket_id, isPrivate, filename } = req.body;
      const file = req.file;
  
      if (!ticket_id || !file || !filename) {
        return res.status(400).json({ error: "Manjkajo podatki" });
      }
  
      const ticketId = parseInt(ticket_id, 10);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: "Neveljaven `ticket_id`" });
      }

      const userId = getUserIdFromJWT(req.headers.authorization?.split(' ')[1] ?? '');
      if (userId === null) {
          console.error('Napaka pri pridobivanju userId iz JWT');
          return;
      }
      const name = await getNameLastNamebyUserId(userId);
  
      // **Shrani PDF v MongoDB (ali v datotečni sistem)**
      const newChat = await createChat(ticketId, {
        type: "document",
        content: file.buffer.toString("base64"), // Pretvori v Base64
        filename: filename,
      }, isPrivate === "true", name[0].name);

      // ** Pošlji obvestilo uporabnikom prek WebSocket-a**
      io.to(`ticket_${ticketId}`).emit("newMessage", newChat);
  
      res.status(201).json(newChat);
    } catch (error) {
      console.error("Napaka pri nalaganju PDF-ja:", error);
      res.status(500).json({ error: "Napaka pri shranjevanju datoteke" });
    }
  });
  
const connectedUsers: { [key: string]: string[] } = {}; // { userId: [ticket_id1, ticket_id2] }

export const getUserIdFromJWT = (token: string): number | null => {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as unknown as { userId: number };
        return decoded.userId;
    } catch (error) {
        console.error("Napaka pri dekodiranju JWT:", error);
        return null;
    }
};

io.use((socket, next) => {
    try
    {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
  
        if (!token) {
            return next(new Error('Avtentikacija ni uspela: Manjkajoč JWT token'));
        }
    
        // Uporabi obstoječo funkcijo `authenticateJWT`
        const mockRequest = {
            headers: { authorization: `Bearer ${token}` },
            get: (header: string) => {
                return header === 'authorization' ? `Bearer ${token}` : undefined;
            }
        } as Request;

        authenticateJWT(mockRequest, {} as Response, (err) => {
        if (err) {
            return next(new Error('Neveljaven JWT token'));
        }
        next();
        });
    }
    catch (error) {}
  });

  const checkJWT = (socket: any) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
  
    if (!token) {
        console.log('Avtentikacija ni uspela: Manjkajoč JWT token');
        return false
    }
    
    // Uporabi obstoječo funkcijo `authenticateJWT`
    const mockRequest = {
        headers: { authorization: `Bearer ${token}` },
        get: (header: string) => {
            return header === 'authorization' ? `Bearer ${token}` : undefined;
        }
    } as Request;

    authenticateJWT(mockRequest, {} as Response, (err) => {
    if (err) {
        console.log('Neveljaven JWT token');
        return false
    }
    });
}
  
io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
    const userId = getUserIdFromJWT(token);

    if (userId === null) {
        console.error('Napaka pri pridobivanju userId iz JWT');
        return;
    }

    console.log('Uporabnik povezan: ' + userId);

    socket.on('joinTicket', async (ticketId: number) => {
        socket.join(`ticket_${ticketId}`);

        // Preveri, ali `connectedUsers[userId]` že obstaja, če ne, ga inicializiraj
        if (!connectedUsers[userId]) {
            connectedUsers[userId] = [];
        }

        if (!connectedUsers[userId].includes(`ticket_${ticketId}`)) {
            connectedUsers[userId].push(`ticket_${ticketId}`);
        }

        // Pošlji obstoječa sporočila iz baze
        const messages = await getChatsByTicketId(ticketId);
        socket.emit('chatHistory', messages);
    });

    socket.on('sendMessage', async ({ ticket_id, message, isPrivate }, callback) => {
        try {
          const name = await getNameLastNamebyUserId(userId);
          const savedMessage = await createChat(ticket_id, message, isPrivate, name[0].name);
      
          io.to(`ticket_${ticket_id}`).emit('newMessage', savedMessage); // Pošlje samo enkrat
      
          if (callback) {
            callback({ success: true });
          }
        } catch (err) {
          console.error('Napaka pri shranjevanju sporočila:', err);
          if (callback) {
            callback({ success: false });
          }
        }
    });      
            
    socket.on("disconnect", (reason) => {
        console.warn(`Uporabnik ${userId} se je odklopil: ${reason}`);
        if (connectedUsers[userId]) {
          connectedUsers[userId].forEach((room) => {
            socket.leave(room);
          });
          delete connectedUsers[userId];
        }
    }); 
});

  
// Inicializacija baz, zagon Express strežnika in zgon Socket.io strežnika
initializeDatabases().then(() => {
    server.listen(PORT, () => { 
      console.log(`Strežnik teče na http://localhost:${PORT}`);
    });
});
  
