import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import fs from 'fs';
import e from 'cors';

dotenv.config();

// Ustvarimo pool povezavo s PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

/*// **Funkcija za pridobitev podatkov iz tabele "ticket" in vračanje JSON podatkov**
export const getPostgresData = async (): Promise<any[]> => {
  try {
    const res = await pool.query('SELECT * FROM ticket;');
    return res.rows;
  } catch (error) {
    console.error('Napaka pri dostopu do PostgreSQL:', error);
    throw error; // Posredujemo napako do `index.ts`
  }
};*/

export const getCompany = async (): Promise<any[]> => {
    try {
      const res = await pool.query('SELECT * FROM company;');
      return res.rows;
    } catch (error) {
      console.error('Napaka pri dostopu do PostgreSQL:', error);
      throw error; // Posredujemo napako do `index.ts`
    }
  };

  export const getAllCompaniesEssential = async (): Promise<any[]> => {
    try {
      const res = await pool.query('select company_id AS id, company_name AS name from company');
      return res.rows;
    } catch (error) {
      console.error('Napaka pri dostopu do PostgreSQL:', error);
      throw error; // Posredujemo napako do `index.ts`
    }
  };

  // **Funkcija za pridobitev podatkov iz tabele "ticket"**
export const getTicketData = async (): Promise<any[]> => {
    try {
        const res = await pool.query('SELECT * FROM ticket WHERE id = $1', [1]); // Preprečevanje SQL Injection
        return res.rows;
    } catch (error) {
        console.error('Napaka pri dostopu do PostgreSQL:', error);
        throw error;
    }
};

// **Funkcija za preverjanje uporabnika in pridobitev njegove vloge**
export const verifyUser = async (username: string, password: string) => {
    try {
        const result = await pool.query(
            'SELECT user_id, password, role FROM users WHERE username = $1', 
            [username]
        );

        if (result.rows.length === 0) {
            return null; // Uporabnik ne obstaja
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return null; // Napačno geslo
        }

        return { id: user.user_id, role: user.role }; // Vrni ID in vlogo
    } catch (error) {
        console.error('Napaka pri preverjanju uporabnika:', error);
        throw error;
    }
};


// **Funkcija za registracijo novega uporabnika z dodatnimi podatki**
export const registerUser = async (
  username: string, 
  password: string, 
  first_name: string, 
  last_name: string, 
  email: string, 
  phone_number: string, 
  role: string = 'user', // Privzeta vloga je 'user'
  company_id: number = 1, // Privzeta vrednost
  group_id: number = 1 // Privzeta vrednost
) => {
  try {
      // Preveri, ali uporabniško ime že obstaja
      const userCheck = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);
      if (userCheck.rows.length > 0) {
          throw new Error('Uporabniško ime že obstaja');
      }

      // Hash gesla
      const hashedPassword = await bcrypt.hash(password, 10);

      // Ustvari novega uporabnika
      const result = await pool.query(
          `INSERT INTO users 
          (username, password, first_name, last_name, email, phone_number, role, company_id, group_id, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
          RETURNING user_id, role`,
          [username, hashedPassword, first_name, last_name, email, phone_number, role, company_id, group_id]
      );

      return { user_id: result.rows[0].user_id, role: result.rows[0].role };
  } catch (error) {
      console.error('Napaka pri registraciji uporabnika:', error);
      throw error;
  }
};

// **Funkcija za pridobitev vseh podjetij**
export const getAllCompanies = async () => {
    try {
        const result = await pool.query('SELECT * FROM company');
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju podjetij:', error);
        throw error;
    }
};

// **Funkcija za pridobitev podjetja na podlagi company_id**
export const getCompanyById = async (company_id: number) => {
    try {
        const result = await pool.query('SELECT * FROM company WHERE company_id = $1', [company_id]);
        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri pridobivanju podjetja z ID=${company_id}:`, error);
        throw error;
    }
};

// **Funkcija za dodajanje novega podjetja**
export const createCompany = async (
    company_name: string,
    email: string,
    phone: string,
    street: string,
    city: string,
    post_code: string,
    country: string,
    notes: string
) => {
    try {
        const result = await pool.query(
            `INSERT INTO company 
            (company_name, email, phone, street, city, post_code, country, notes, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
            RETURNING company_id`,
            [company_name, email, phone, street, city, post_code, country, notes]
        );

        return { company_id: result.rows[0].company_id };
    } catch (error) {
        console.error('Napaka pri dodajanju podjetja:', error);
        throw error;
    }
};

// **Funkcija za posodobitev podjetja na podlagi company_id**
export const updateCompany = async (
    company_id: number,
    company_name: string,
    email: string,
    phone: string,
    street: string,
    city: string,
    post_code: string,
    country: string,
    notes: string
) => {
    try {
        const result = await pool.query(
            `UPDATE company SET 
            company_name = $1, 
            email = $2, 
            phone = $3, 
            street = $4, 
            city = $5, 
            post_code = $6, 
            country = $7, 
            notes = $8,
            updated_at = NOW()
            WHERE company_id = $9 
            RETURNING *`,
            [company_name, email, phone, street, city, post_code, country, notes, company_id]
        );

        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri posodabljanju podjetja z ID=${company_id}:`, error);
        throw error;
    }
};

// **Funkcija za pridobitev vseh pogodb**
export const getAllContracts = async () => {
    try {
        const result = await pool.query('SELECT c.contract_id, c.short_description, c.description, c.start_date, c.end_date, c.state, c.contract_file, co.company_id, co.company_name FROM contract c, company co WHERE c.company_id = co.company_id');
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju pogodb:', error);
        throw error;
    }
};

// **Funkcija za pridobitev vseh pogodb**
export const getAllContractsEssential = async () => {
    try {
        const result = await pool.query('select contract_id AS id, short_description AS name, state AS status, description, company_id AS companyId from contract;');
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju pogodb:', error);
        throw error;
    }
};

// **Funkcija za pridobitev pogodbe na podlagi contract_id**
export const getContractById = async (contract_id: number) => {
    try {
        const result = await pool.query('SELECT * FROM contract WHERE contract_id = $1', [contract_id]);
        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri pridobivanju pogodbe z ID=${contract_id}:`, error);
        throw error;
    }
};

// **Funkcija za dodajanje nove pogodbe**
export const createContract = async (
    company_id: number,
    short_description: string,
    description: string,
    start_date: string,
    end_date: string,
    state: string,
    contract_file: Buffer // Datoteka kot binarni podatek
) => {
    try {
        const result = await pool.query(
            `INSERT INTO contract 
            (company_id, short_description, description, start_date, end_date, state, contract_file, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
            RETURNING contract_id`,
            [company_id, short_description, description, start_date, end_date, state, contract_file]
        );

        return { contract_id: result.rows[0].contract_id };
    } catch (error) {
        console.error('Napaka pri dodajanju pogodbe:', error);
        throw error;
    }
};

// **Funkcija za posodobitev pogodbe**
export const updateContract = async ({
    contract_id,
    company_id,
    short_description,
    description,
    start_date,
    end_date,
    state,
    contract_file,
}: {
    contract_id: number;
    company_id: number;
    short_description: string;
    description: string;
    start_date: string;
    end_date: string;
    state: string;
    contract_file?: Buffer; // Datoteka je opcijska
}) => {
    try {
        const query = contract_file
            ? `UPDATE contract 
               SET short_description = $1, description = $2, start_date = $3, end_date = $4, state = $5, contract_file = $6, company_id = $7, updated_at = NOW() 
               WHERE contract_id = $8 RETURNING *`
            : `UPDATE contract 
               SET short_description = $1, description = $2, start_date = $3, end_date = $4, state = $5, company_id = $6, updated_at = NOW() 
               WHERE contract_id = $7 RETURNING *`;

        const params = contract_file
            ? [short_description, description, start_date, end_date, state, contract_file, company_id, contract_id]
            : [short_description, description, start_date, end_date, state, company_id, contract_id];

        const result = await pool.query(query, params);

        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri posodabljanju pogodbe z ID=${contract_id}:`, error);
        throw error;
    }
};


// **Funkcija za pridobitev vseh uporabnikov (brez gesla)**
export const getAllUsers = async () => {
    try {
        const result = await pool.query(`
            SELECT u.user_id, u.username, u.first_name, u.last_name, u.email, u.phone_number, u.role, u.created_at, u.updated_at, c.company_id, c.company_name, g.group_id, g.group_name 
            FROM users u, company c, assigment_group g WHERE u.company_id = c.company_id AND u.group_id = g.group_id
        `);
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju uporabnikov:', error);
        throw error;
    }
};

export const getAllUsersEssential = async (): Promise<any[]> => {
    try {
      const res = await pool.query('SELECT user_id AS id, first_name || \' \' || last_name AS name, email, company_id AS companyId, group_id AS groupId FROM USERS;');
      return res.rows;
    } catch (error) {
      console.error('Napaka pri dostopu do PostgreSQL:', error);
      throw error; // Posredujemo napako do `index.ts`
    }
  };

// **Funkcija za pridobitev enega uporabnika na podlagi user_id (brez gesla)**
export const getUserById = async (user_id: number) => {
    try {
        const result = await pool.query(`
            SELECT user_id, username, first_name, last_name, email, phone_number, role, created_at, updated_at, company_id, group_id 
            FROM users WHERE user_id = $1
        `, [user_id]);
        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri pridobivanju uporabnika z ID=${user_id}:`, error);
        throw error;
    }
};

/*// **Funkcija za dodajanje nove pogodbe**
export const createUser = async (
    company_id: number,
    group_id: number,
    first_name: string,
    last_name: string,
    email: string,
    phone_number: string,
    role: string,
    password: string
) => {
    try {
        const result = await pool.query(
            `INSERT INTO contract 
            (company_id, group_id, first_name, last_name, email, phone_number, role, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
            RETURNING contract_id`,
            [company_id, group_id, first_name, last_name, email, phone_number, role, password]
        );

        return { contract_id: result.rows[0].contract_id };
    } catch (error) {
        console.error('Napaka pri dodajanju pogodbe:', error);
        throw error;
    }
};**/

// **Funkcija za posodobitev uporabnika (brez gesla, upoštevano updated_at)**
export const updateUser = async (
    user_id: number,
    first_name: string,
    last_name: string,
    email: string,
    phone_number: string,
    role: string,
    company_id: number,
    group_id: number
) => {
    try {
        const result = await pool.query(
            `UPDATE users SET 
            first_name = $1, 
            last_name = $2, 
            email = $3, 
            phone_number = $4, 
            role = $5, 
            company_id = $6, 
            group_id = $7, 
            updated_at = NOW()
            WHERE user_id = $8 
            RETURNING *`,
            [first_name, last_name, email, phone_number, role, company_id, group_id, user_id]
        );

        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri posodabljanju uporabnika z ID=${user_id}:`, error);
        throw error;
    }
};

// **Funkcija za posodobitev gesla uporabnika s preverjanjem starega gesla (updated_at = NOW())**
export const updatePasswordWithOld = async (user_id: number, old_password: string, new_password: string) => {
    try {
        const user = await pool.query('SELECT password FROM users WHERE user_id = $1', [user_id]);
        if (user.rows.length === 0) {
            return { success: false, message: 'Uporabnik ni najden' };
        }

        const passwordMatch = await bcrypt.compare(old_password, user.rows[0].password);
        if (!passwordMatch) {
            return { success: false, message: 'Staro geslo ni pravilno' };
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE user_id = $2', [hashedPassword, user_id]);

        return { success: true };
    } catch (error) {
        console.error(`Napaka pri posodabljanju gesla za user_id=${user_id}:`, error);
        throw error;
    }
};

// **Funkcija za neposredno posodobitev gesla brez preverjanja starega gesla (updated_at = NOW())**
export const updatePasswordWithoutOld = async (user_id: number, new_password: string) => {
    try {
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE user_id = $2', [hashedPassword, user_id]);

        return { success: true };
    } catch (error) {
        console.error(`Napaka pri neposredni posodobitvi gesla za user_id=${user_id}:`, error);
        throw error;
    }
};

// **Funkcija za pridobitev vseh skupin**
export const getAllGroups = async () => {
    try {
        const result = await pool.query('SELECT * FROM assigment_group');
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju skupin:', error);
        throw error;
    }
};

// **Funkcija za pridobitev vseh skupin**
export const getAllGroupsEssential = async () => {
    try {
        const result = await pool.query('select group_id AS id, group_name AS name from assigment_group;');
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju skupin:', error);
        throw error;
    }
};

// **Funkcija za pridobitev skupine na podlagi group_id**
export const getGroupById = async (group_id: number) => {
    try {
        const result = await pool.query('SELECT * FROM assigment_group WHERE group_id = $1', [group_id]);
        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri pridobivanju skupine z ID=${group_id}:`, error);
        throw error;
    }
};

// **Funkcija za dodajanje nove skupine**
export const createGroup = async (group_name: string, description: string, email: string) => {
    try {
        const result = await pool.query(
            `INSERT INTO assigment_group 
            (group_name, description, email, created_at, updated_at) 
            VALUES ($1, $2, $3, NOW(), NOW()) 
            RETURNING group_id`,
            [group_name, description, email]
        );

        return { group_id: result.rows[0].group_id };
    } catch (error) {
        console.error('Napaka pri dodajanju skupine:', error);
        throw error;
    }
};

// **Funkcija za posodobitev skupine na podlagi group_id**
export const updateGroup = async (group_id: number, group_name: string, description: string, email: string) => {
    try {
        const result = await pool.query(
            `UPDATE assigment_group SET 
            group_name = $1, 
            description = $2, 
            email = $3,
            updated_at = NOW()
            WHERE group_id = $4 
            RETURNING *`,
            [group_name, description, email, group_id]
        );

        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri posodabljanju skupine z ID=${group_id}:`, error);
        throw error;
    }
};

// **Funkcija za pridobitev vseh zahtevkov**
export const getAllTickets = async () => {
    try {
        const result = await pool.query('SELECT t.ticket_id, t.title, CASE WHEN t.impact = 1 AND t.urgency = 1 THEN 1 WHEN t.impact = 2 AND t.urgency = 1 THEN 2 WHEN t.impact = 3 AND t.urgency = 1 THEN 3 WHEN t.impact = 1 AND t.urgency = 2 THEN 2 WHEN t.impact = 1 AND t.urgency = 3 THEN 3 WHEN t.impact = 2 AND t.urgency = 2 THEN 3 WHEN t.impact = 3 AND t.urgency = 2 THEN 4 WHEN t.impact = 2 AND t.urgency = 3 THEN 4 WHEN t.impact = 3 AND t.urgency = 3 THEN 4 END AS priority, t.state, t.type, t.created_at, CONCAT(caller.first_name, \' \', caller.last_name) AS caller, COALESCE(assigned.first_name || \' \' || assigned.last_name, \'(prazno)\') AS assigned_to, COALESCE(g.group_name, \'(prazno)\') AS assignment_group, comp.company_name FROM ticket t LEFT JOIN time_worked time ON time.ticket_id = t.ticket_id AND time.primary_resolver = true LEFT JOIN users assigned ON time.user_id = assigned.user_id LEFT JOIN assigment_group g ON assigned.group_id = g.group_id JOIN users caller ON t.caller_id = caller.user_id JOIN company comp ON caller.company_id = comp.company_id;');
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju zahtevkov:', error);
        throw error;
    }
};

// **Funkcija za pridobitev vseh zahtevkov**
export const getAllTicketsEssential = async () => {
    try {
        const result = await pool.query('SELECT ticket_id AS id, title AS name FROM ticket ORDER BY ticket_id');
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju zahtevkov:', error);
        throw error;
    }
};

// **Funkcija za pridobitev vseh zahtevkov, katerih je klicatelj user_id**
export const getTicketEssential = async (user_id: number) => {
    try {
        const result = await pool.query(
            'SELECT t.ticket_id, t.title, CASE WHEN t.impact = 1 AND t.urgency = 1 THEN 1 WHEN t.impact = 2 AND t.urgency = 1 THEN 2 WHEN t.impact = 3 AND t.urgency = 1 THEN 3 WHEN t.impact = 1 AND t.urgency = 2 THEN 2 WHEN t.impact = 1 AND t.urgency = 3 THEN 3 WHEN t.impact = 2 AND t.urgency = 2 THEN 3 WHEN t.impact = 3 AND t.urgency = 2 THEN 4 WHEN t.impact = 2 AND t.urgency = 3 THEN 4 WHEN t.impact = 3 AND t.urgency = 3 THEN 4 END AS priority, t.created_at, t.type, t.state FROM ticket t WHERE t.caller_id = $1',
            [user_id]
        );
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju zahtevkov:', error);
        throw error;
    }
};

// **Funkcija za pridobitev vseh zahtevkov, ki so dodeljeni name**
export const getMyTickets = async (user_id: number) => {
    try {
        const result = await pool.query(
            'SELECT t.ticket_id, t.title, t.created_at, CONCAT(caller.first_name, \' \', caller.last_name) AS caller, comp.company_name, CASE WHEN t.impact = 1 AND t.urgency = 1 THEN 1 WHEN t.impact = 2 AND t.urgency = 1 THEN 2 WHEN t.impact = 3 AND t.urgency = 1 THEN 3 WHEN t.impact = 1 AND t.urgency = 2 THEN 2 WHEN t.impact = 1 AND t.urgency = 3 THEN 3 WHEN t.impact = 2 AND t.urgency = 2 THEN 3 WHEN t.impact = 3 AND t.urgency = 2 THEN 4 WHEN t.impact = 2 AND t.urgency = 3 THEN 4 WHEN t.impact = 3 AND t.urgency = 3 THEN 4 END AS priority, t.state, t.type, g.group_name AS assignment_group, CASE WHEN tw.primary_resolver IS TRUE THEN \'Primarni\' WHEN tw.primary_resolver IS FALSE THEN \'Sekundarni\' END AS role FROM ticket t JOIN users caller ON t.caller_id = caller.user_id JOIN company comp ON caller.company_id = comp.company_id JOIN time_worked tw ON tw.ticket_id = t.ticket_id JOIN users assigned ON tw.user_id = assigned.user_id LEFT JOIN assigment_group g ON assigned.group_id = g.group_id WHERE tw.user_id = $1 AND tw.primary_resolver IS NOT NULL',
            [user_id]
        );
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju zahtevkov:', error);
        throw error;
    }
};

// **Funkcija za pridobitev določenega zahtevka, katerih je klicatelj user_id**
export const getIdTicketEssential = async (user_id: number, ticket_id: number) => {
    try {
        const result = await pool.query(
            'SELECT t.ticket_id, t.title, t.description, CASE WHEN t.impact = 1 AND t.urgency = 1 THEN 1 WHEN t.impact = 2 AND t.urgency = 1 THEN 2 WHEN t.impact = 3 AND t.urgency = 1 THEN 3 WHEN t.impact = 1 AND t.urgency = 2 THEN 2 WHEN t.impact = 1 AND t.urgency = 3 THEN 3 WHEN t.impact = 2 AND t.urgency = 2 THEN 3 WHEN t.impact = 3 AND t.urgency = 2 THEN 4 WHEN t.impact = 2 AND t.urgency = 3 THEN 4 WHEN t.impact = 3 AND t.urgency = 3 THEN 4 END AS priority, t.created_at, t.updated_at, t.resolved_at, t.type, t.state, c.company_name, CONCAT(u.first_name, \' \', u.last_name) AS caller, COALESCE(ur.first_name || \' \' || ur.last_name, \'(prazno)\') AS primary_resolver FROM ticket t LEFT JOIN users u ON t.caller_id = u.user_id LEFT JOIN company c ON u.company_id = c.company_id LEFT JOIN time_worked tw ON tw.ticket_id = t.ticket_id AND tw.primary_resolver = true LEFT JOIN users ur ON tw.user_id = ur.user_id WHERE t.caller_id = $1 AND t.ticket_id = $2',
            [user_id, ticket_id]
        );
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju zahtevkov:', error);
        throw error;
    }
};

// **Funkcija za pridobitev zahtevka na podlagi ticket_id**
export const getTicketById = async (ticket_id: number) => {
    try {
        const result = await pool.query('SELECT t.*, CONCAT(u.first_name, \' \', u.last_name) AS caller, CONCAT(c.short_description, \' | \', c.state) AS contract_name, g.group_name AS assignment_group, comp.company_id, comp.company_name, pt.title AS parent_ticket_title FROM ticket t LEFT JOIN ticket pt ON t.parent_ticket_id = pt.ticket_id JOIN assigment_group g ON t.group_id = g.group_id JOIN contract c ON t.contract_id = c.contract_id JOIN users u ON t.caller_id = u.user_id JOIN company comp ON u.company_id = comp.company_id WHERE t.ticket_id = $1;', [ticket_id]);
        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri pridobivanju zahtevka z ID=${ticket_id}:`, error);
        throw error;
    }
};

// **Funkcija za dodajanje novega zahtevka**
export const createTicket = async (
    title: string,
    description: string,
    impact: string,
    urgency: string,
    state: string,
    type: string,
    caller_id: number,
    parent_ticket_id: number | null,
    group_id: number,
    contract_id: number
) => {
    try {
        const result = await pool.query(
            `INSERT INTO ticket 
            (title, description, impact, urgency, state, type, created_at, updated_at, caller_id, parent_ticket_id, group_id, contract_id) 
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8, $9, $10) 
            RETURNING ticket_id`,
            [title, description, impact, urgency, state, type, caller_id, parent_ticket_id, group_id, contract_id]
        );

        return { ticket_id: result.rows[0].ticket_id };
    } catch (error) {
        console.error('Napaka pri dodajanju zahtevka:', error);
        throw error;
    }
};

// **Funkcija za posodobitev zahtevka na podlagi ticket_id**
export const updateTicket = async (
    ticket_id: number,
    title: string,
    description: string,
    impact: string,
    urgency: string,
    state: string,
    type: string,
    caller_id: number,
    parent_ticket_id: number | null,
    group_id: number,
    contract_id: number,
    accepted_at: string | null
) => {
    try {
        const result = await pool.query(
            `UPDATE ticket SET 
            title = $1, 
            description = $2, 
            impact = $3, 
            urgency = $4, 
            state = $5, 
            type = $6, 
            caller_id = $7, 
            parent_ticket_id = $8, 
            group_id = $9,
            contract_id = $10,
            accepted_at = $11,
            updated_at = NOW()
            WHERE ticket_id = $12 
            RETURNING *`,
            [title, description, impact, urgency, state, type, caller_id, parent_ticket_id, group_id, contract_id, accepted_at, ticket_id]
        );

        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri posodabljanju zahtevka z ID=${ticket_id}:`, error);
        throw error;
    }
};

// **Funkcija za pridobitev delovnega časa na podlagi ticket_id**
export const getTimeWorkedByTicket = async (ticket_id: number, primary_resolver: boolean) => {
    try {
        const result = await pool.query(
            'SELECT t.*, CONCAT(u.first_name, \' \', u.last_name) AS resolver, u.email AS email FROM time_worked t, users u WHERE ticket_id = $1 AND primary_resolver = $2 AND t.user_id = u.user_id', 
            [ticket_id, primary_resolver]
        );
        return result.rows || [];
    } catch (error) {
        console.error(`Napaka pri pridobivanju delovnega časa za ticket_id=${ticket_id}:`, error);
        throw error;
    }
};

// **Funkcija za pridobitev delovnega časa na podlagi user_id in ticket_id**
export const getTimeWorkedByUserAndTicket = async (user_id: number, ticket_id: number) => {
    try {
        const result = await pool.query(
            'SELECT * FROM time_worked WHERE user_id = $1 AND ticket_id = $2', 
            [user_id, ticket_id]
        );
        return result.rows || [];
    } catch (error) {
        console.error(`Napaka pri pridobivanju delovnega časa za user_id=${user_id} in ticket_id=${ticket_id}:`, error);
        throw error;
    }
};

// **Funkcija za dodajanje novega vnosa delovnega časa**
export const createTimeWorked = async (
    user_id: number,
    ticket_id: number,
    time_worked: number | null,
    description: string | null,
    primary: boolean
) => {
    try {
        const result = await pool.query(
            `INSERT INTO time_worked 
            (user_id, ticket_id, time_worked, description, primary_resolver, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
            RETURNING *`,
            [user_id, ticket_id, time_worked, description, primary]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Napaka pri dodajanju vnosa delovnega časa:', error);
        throw error;
    }
};

// **Funkcija za posodobitev delovnega časa na podlagi user_id in ticket_id**
export const updateTimeWorked = async (
    user_id: number,
    ticket_id: number,
    time_worked: number,
    description: string
) => {
    try {
        const result = await pool.query(
            `UPDATE time_worked SET 
            time_worked = $1, 
            description = $2, 
            updated_at = NOW()
            WHERE user_id = $3 AND ticket_id = $4 
            RETURNING *`,
            [time_worked, description, user_id, ticket_id]
        );

        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri posodabljanju delovnega časa za user_id=${user_id} in ticket_id=${ticket_id}:`, error);
        throw error;
    }
};

// **Funkcija za posodobitev primarnega reševalca**
export const updatePrimary = async (
    old_user_id: number,
    new_user_id: number,
    ticket_id: number,
    primary: boolean
) => {
    try {
        const result = await pool.query(
            `WITH update_old AS (UPDATE time_worked SET primary_resolver = NULL WHERE ticket_id = $1 AND user_id = $2 RETURNING *), insert_new AS (INSERT INTO time_worked (user_id, ticket_id, time_worked, description, created_at, updated_at, primary_resolver) VALUES ($3, $1, 0, '', NOW(), NOW(), $4) ON CONFLICT (user_id, ticket_id) DO UPDATE SET primary_resolver = $4, updated_at = NOW() RETURNING *) SELECT * FROM update_old UNION ALL SELECT * FROM insert_new;`,
            [ticket_id, old_user_id, new_user_id, primary]
        );

        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri posodabljanju delovnega časa za old_user_id=${old_user_id}, new_user_id=${new_user_id} in ticket_id=${ticket_id}:`, error);
        throw error;
    }
};

// **Funkcija za sinhronizacijo pomožnih reševalcev**
export const syncAdditionalResolvers = async (ticket_id: number, oldResolvers: number[], newResolvers: number[]) => {
    try {
        const oldSet = new Set(oldResolvers); // Stari reševalci
        const newSet = new Set(newResolvers); // Novi reševalci

        // Ugotovimo odstranjene in dodane reševalce
        const toRemove = oldResolvers.filter(user_id => !newSet.has(user_id));
        const toAdd = newResolvers.filter(user_id => !oldSet.has(user_id));

        // Izbrišemo odstranjene reševalce
        if (toRemove.length > 0) {
            await pool.query(
                `UPDATE time_worked SET primary_resolver = NULL WHERE ticket_id = $1 AND user_id = ANY($2);`,
                [ticket_id, toRemove]
            );
        }

        // Dodamo nove reševalce
        if (toAdd.length > 0) {
            const values = toAdd.map(user_id => `(${user_id}, ${ticket_id}, 0, '', NOW(), NOW(), false)`).join(", ");
            await pool.query(
                `INSERT INTO time_worked (user_id, ticket_id, time_worked, description, created_at, updated_at, primary_resolver) VALUES ${values} ON CONFLICT (user_id, ticket_id) DO UPDATE SET primary_resolver = FALSE, updated_at = NOW();`
            );
        }

        return { removed: toRemove, added: toAdd };
    } catch (error) {
        console.error(`Napaka pri sinhronizaciji pomožnih reševalcev za ticket_id=${ticket_id}:`, error);
        throw error;
    }
};

// **Funkcija za pridobitev imena in priimka na podlagi user_id**
export const getNameLastNamebyUserId = async (user_id: number) => {
    try {
        const result = await pool.query(
            'SELECT CONCAT(first_name, \' \', last_name) AS name FROM users WHERE user_id = $1', 
            [user_id]
        );
        return result.rows || [];
    } catch (error) {
        console.error(`Napaka pri pridobivanju delovnega časa za user_id=${user_id}:`, error);
        throw error;
    }
};

// **Funkcija za posodobitev ticketa v stanje resolved**
export const resolveTicket = async (ticketId: number, close_code: string, close_notes: string) => {
    try {
        const query = `
        UPDATE ticket 
        SET state = 'resolved', resolved_at = NOW(), close_code = $1, close_notes = $2 
        WHERE ticket_id = $3;
        `;
        await pool.query(query, [close_code, close_notes, ticketId]);
    } catch (error) {
        console.error(`Napaka pri posodabljanju ticketa`, error);
        throw error;
    } 
  };
  
// **Funkcija za posodobitev ticketa v stanje canceled**
export const cancelTicket = async (ticketId: number) => {
    try {
        const query = `
        UPDATE ticket 
        SET state = 'cancelled', resolved_at = NOW()
        WHERE ticket_id = $1;
        `;
        await pool.query(query, [ticketId]);
    } catch (error) {
        console.error(`Napaka pri preklicu ticketa`, error);
        throw error;
    }
  };
  
// **Funkcija za ponovno odpriranje ticketa**
export const reOpenTicket = async (ticketId: number) => {
    try {
        const query = `
            UPDATE ticket 
            SET state = 'open', resolved_at = NULL
            WHERE ticket_id = $1;
        `;
        await pool.query(query, [ticketId]);
    } catch (error) {
        console.error(`Napaka pri ponovnem odpiranju ticketa`, error);
        throw error;
    }
  };

  // **Funkcija za nastavljanje ticketa na on hold**
export const putOnHoldTicket = async (ticketId: number) => {
    try {
        const query = `
        UPDATE ticket 
        SET state = 'awaiting info', resolved_at = NOW()
        WHERE ticket_id = $1;
        `;
        await pool.query(query, [ticketId]);
    } catch (error) {
        console.error(`Napaka pri dajanju ticketa na on-hold`, error);
        throw error;
    } 
  };

    // **Funkcija za za posodabljanje sla reasona**
export const updateSlaReason = async (ticketId: string, reason: string, accept_sla: boolean) => {
    try {
        if (accept_sla)
            {
                const query = `
                    UPDATE ticket SET accept_sla_breach = $1, updated_at = NOW()
                    WHERE ticket_id = $2
                `;
                await pool.query(query, [reason, ticketId]);
            }
        else
            {
                const query = `
                    UPDATE ticket SET sla_breach = $1, updated_at = NOW()
                    WHERE ticket_id = $2
                `;
                await pool.query(query, [reason, ticketId]);
            }
    } catch (error) {
        console.error(`Napaka pri posodabljanju sla`, error);
        throw error;
    }
  };

// **Funkcija za pridobitev uporabnikovega imena in podjetja na podlagi user_id**
export const getUserData = async (user_id: number) => {
    try {
        const result = await pool.query(
            `SELECT CONCAT(u.first_name, ' ', u.last_name) AS full_name, c.company_name, u.group_id, (SELECT contract_id FROM contract WHERE company_id = u.company_id ORDER BY RANDOM() LIMIT 1) AS contract_id FROM users u JOIN company c ON u.company_id = c.company_id WHERE u.user_id = $1`,
            [user_id]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri pridobivanju podatkov za user_id=${user_id}:`, error);
        throw error;
    }
};

// **Funkcija vrne user_id na podlagi e-maila, ali null če uporabnik ne obstaja**
export const getUserIdByEmail = async (email: string): Promise<number | null> => {
    try {
        const result = await pool.query(
            'SELECT user_id FROM users WHERE email = $1 LIMIT 1',
            [email]
        );

        return result.rows.length > 0 ? result.rows[0].user_id : null;
    } catch (error) {
        console.error(`Napaka pri iskanju user_id za e-mail ${email}:`, error);
        throw error;
    }
};

// **Funkcija vrne email na podlagi user_id, ali null če uporabnik ne obstaja**
export const getEmailByUserId = async (user_id: string): Promise<string | null> => {
    try {
        const result = await pool.query(
            'SELECT email FROM users WHERE user_id = $1 LIMIT 1',
            [user_id]
        );

        return result.rows.length > 0 ? result.rows[0].email : null;
    } catch (error) {
        console.error(`Napaka pri iskanju user_id za e-mail ${user_id}:`, error);
        throw error;
    }
};

// **Funkcija vrne e-mail klicatelja na podlagi ticket_id, ali null če ticket ne obstaja**
export const getEmailByTicketId = async (ticket_id: number): Promise<string | null> => {
    try {
        const result = await pool.query(
            'SELECT u.email AS email FROM ticket t, users u WHERE t.caller_id = u.user_id AND t.ticket_id = $1 LIMIT 1;',
            [ticket_id]
        );

        return result.rows.length > 0 ? result.rows[0].email : null;
    } catch (error) {
        console.error(`Napaka pri iskanju e-maila za ticket_id ${ticket_id}:`, error);
        throw error;
    }
};

// **Funkcija vrne e-mail skupine na podlagi group_id**
export const getGroupEmailById = async (group_id: number): Promise<string | null> => {
    try {
        const result = await pool.query(
            'SELECT email FROM assigment_group WHERE group_id = $1',
            [group_id]
        );
        return result.rows.length > 0 ? result.rows[0].email : null;
    } catch (error) {
        console.error(`Napaka pri pridobivanju e-maila za group_id=${group_id}:`, error);
        throw error;
    }
};

// **Funkcija posodobi polje `updated_at` na trenutno vrednost (NOW()) za določen ticket**
export const updateTicketTimestamp = async (ticket_id: number): Promise<void> => {
    try {
        await pool.query(
            'UPDATE ticket SET updated_at = NOW() WHERE ticket_id = $1',
            [ticket_id]
        );
    } catch (error) {
        console.error(`Napaka pri posodabljanju časa za ticket_id=${ticket_id}:`, error);
        throw error;
    }
};

// **Funkcija zapre vse tickete, ki so več kot 14 dni v stanju 'resolved'**
export const autoCloseResolvedTickets = async (): Promise<void> => {
    try {
        await pool.query(`
            UPDATE ticket
            SET state = 'closed', updated_at = NOW()
            WHERE state = 'resolved'
              AND resolved_at IS NOT NULL
              AND resolved_at < NOW() - INTERVAL '14 days'
        `);
    } catch (error) {
        console.error('Napaka pri samodejnem zapiranju resolved ticketov:', error);
        throw error;
    }
};

// **Funkcija vrne title in description na podlagi ticket_id**
export const getTitleAndDescriptionFromTicket = async (ticket_id: number): Promise<any | null> => {
    try {
        const result = await pool.query(
            'SELECT title, description FROM ticket WHERE ticket_id = $1',
            [ticket_id]
        );
        return result.rows.length > 0 ? {title: result.rows[0].title, description: result.rows[0].title} : null;
    } catch (error) {
        console.error(`Napaka pri pridobivanju naslova in opisa za ticket_id=${ticket_id}:`, error);
        throw error;
    }
};

// **Pridobi vzdrževalne dogodke znotraj določenega tedna**
export const getMaintenancesForWeek = async (start: string, end: string) => {
    try {
      const result = await pool.query(
        `SELECT * FROM maintenance
         WHERE (from_date BETWEEN $1 AND $2)
            OR (to_date BETWEEN $1 AND $2)
            OR (from_date <= $1 AND to_date >= $2)`, // za dogodke, ki trajajo čez cel teden
        [start, end]
      )
      return result.rows
    } catch (err) {
      console.error('Napaka pri pridobivanju vzdrževalnih dogodkov:', err)
      throw err
    }
  }
  
  // **Vstavi nov vzdrževalni dogodek**
export const insertMaintenance = async (data: {
    title: string
    description: string
    from_date: string
    to_date: string
    note: string
    ticket_id?: number | null
  }) => {
    const { title, description, from_date, to_date, note, ticket_id } = data
  
    try {
      const result = await pool.query(
        `INSERT INTO maintenance (title, description, from_date, to_date, note, ticket_id, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [title, description, from_date, to_date, note, ticket_id || null]
      )
      return result.rows[0]
    } catch (err) {
      console.error('Napaka pri vstavljanju vzdrževalnega dogodka:', err)
      throw err
    }
  }
  
// **Funkcija posodobi tabelo maintenance za poamezen maintenance_id**
export const updateMaintenance = async (maintenance_id: number, title: string, description: string, from_date: string, to_date: string, note: string, ticket_id: number): Promise<void> => {
    try {
        await pool.query(
            'UPDATE maintenance SET title = $1, description = $2, from_date = $3, to_date = $4, note = $5, ticket_id = $6, updated_at = NOW() WHERE maintenance_id = $7',
            [title, description, from_date, to_date, note, ticket_id, maintenance_id]
        );
    } catch (error) {
        console.error(`Napaka pri posodabljanju časa za ticket_id=${ticket_id}:`, error);
        throw error;
    }
};

export default pool;
