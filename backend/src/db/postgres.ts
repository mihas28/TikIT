import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import fs from 'fs';

dotenv.config();

// Ustvarimo pool povezavo s PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

// **Funkcija za pridobitev podatkov iz tabele "ticket" in vračanje JSON podatkov**
export const getPostgresData = async (): Promise<any[]> => {
  try {
    const res = await pool.query('SELECT * FROM ticket;');
    return res.rows;
  } catch (error) {
    console.error('Napaka pri dostopu do PostgreSQL:', error);
    throw error; // Posredujemo napako do `index.ts`
  }
};

export const getCompany = async (): Promise<any[]> => {
    try {
      const res = await pool.query('SELECT * FROM company;');
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

      return { id: result.rows[0].user_id, role: result.rows[0].role };
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
        const result = await pool.query('SELECT * FROM contract');
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
export const updateContract = async (
    contract_id: number,
    short_description: string,
    description: string,
    start_date: string,
    end_date: string,
    state: string,
    contract_file?: Buffer // Datoteka je opcijska pri posodobitvi
) => {
    try {
        const query = contract_file
            ? `UPDATE contract SET 
                short_description = $1, 
                description = $2, 
                start_date = $3, 
                end_date = $4, 
                state = $5, 
                contract_file = $6, 
                updated_at = NOW()
                WHERE contract_id = $7 RETURNING *`
            : `UPDATE contract SET 
                short_description = $1, 
                description = $2, 
                start_date = $3, 
                end_date = $4, 
                state = $5, 
                updated_at = NOW()
                WHERE contract_id = $6 RETURNING *`;

        const params = contract_file
            ? [short_description, description, start_date, end_date, state, contract_file, contract_id]
            : [short_description, description, start_date, end_date, state, contract_id];

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
            SELECT user_id, username, first_name, last_name, email, phone_number, role, created_at, updated_at, company_id, group_id 
            FROM users
        `);
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju uporabnikov:', error);
        throw error;
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
        const result = await pool.query('SELECT * FROM assignment_group');
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju skupin:', error);
        throw error;
    }
};

// **Funkcija za pridobitev skupine na podlagi group_id**
export const getGroupById = async (group_id: number) => {
    try {
        const result = await pool.query('SELECT * FROM assignment_group WHERE group_id = $1', [group_id]);
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
            `INSERT INTO assignment_group 
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
            `UPDATE assignment_group SET 
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
        const result = await pool.query('SELECT * FROM ticket');
        return result.rows;
    } catch (error) {
        console.error('Napaka pri pridobivanju zahtevkov:', error);
        throw error;
    }
};

// **Funkcija za pridobitev zahtevka na podlagi ticket_id**
export const getTicketById = async (ticket_id: number) => {
    try {
        const result = await pool.query('SELECT * FROM ticket WHERE ticket_id = $1', [ticket_id]);
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
    accepted_at: string | null,
    closed_at: string | null,
    close_notes: string | null,
    close_code: string | null,
    caller_id: number,
    parent_ticket_id: number | null,
    group_id: number
) => {
    try {
        const result = await pool.query(
            `INSERT INTO ticket 
            (title, description, impact, urgency, state, type, created_at, updated_at, accepted_at, closed_at, close_notes, close_code, caller_id, parent_ticket_id, group_id) 
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8, $9, $10, $11, $12, $13) 
            RETURNING ticket_id`,
            [title, description, impact, urgency, state, type, accepted_at, closed_at, close_notes, close_code, caller_id, parent_ticket_id, group_id]
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
    accepted_at: string | null,
    closed_at: string | null,
    close_notes: string | null,
    close_code: string | null,
    caller_id: number,
    parent_ticket_id: number | null,
    group_id: number
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
            accepted_at = $7, 
            closed_at = $8, 
            close_notes = $9, 
            close_code = $10, 
            caller_id = $11, 
            parent_ticket_id = $12, 
            group_id = $13,
            updated_at = NOW()
            WHERE ticket_id = $14 
            RETURNING *`,
            [title, description, impact, urgency, state, type, accepted_at, closed_at, close_notes, close_code, caller_id, parent_ticket_id, group_id, ticket_id]
        );

        return result.rows[0] || null;
    } catch (error) {
        console.error(`Napaka pri posodabljanju zahtevka z ID=${ticket_id}:`, error);
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
    time_worked: number,
    description: string
) => {
    try {
        const result = await pool.query(
            `INSERT INTO time_worked 
            (user_id, ticket_id, time_worked, description, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, NOW(), NOW()) 
            RETURNING *`,
            [user_id, ticket_id, time_worked, description]
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


export default pool;
