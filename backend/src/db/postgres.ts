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
        const result = await pool.query('SELECT ticket_id AS id, title AS name FROM ticket');
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
            'SELECT t.*, CONCAT(u.first_name, \' \', u.last_name) AS resolver FROM time_worked t, users u WHERE ticket_id = $1 AND primary_resolver = $2 AND t.user_id = u.user_id', 
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
    const query = `
      UPDATE ticket 
      SET state = 'resolved', resolved_at = NOW(), close_code = $1, close_notes = $2 
      WHERE ticket_id = $3;
    `;
    await pool.query(query, [close_code, close_notes, ticketId]);
  };
  
// **Funkcija za posodobitev ticketa v stanje canceled**
export const cancelTicket = async (ticketId: number) => {
    const query = `
      UPDATE ticket 
      SET state = 'cancelled', resolved_at = NOW()
      WHERE ticket_id = $1;
    `;
    await pool.query(query, [ticketId]);
  };
  
// **Funkcija za ponovno odpriranje ticketa**
export const reOpenTicket = async (ticketId: number) => {
    const query = `
      UPDATE ticket 
      SET state = 'open', resolved_at = NULL
      WHERE ticket_id = $1;
    `;
    await pool.query(query, [ticketId]);
  };

  // **Funkcija za nastavljanje ticketa na on hold**
export const putOnHoldTicket = async (ticketId: number) => {
    const query = `
      UPDATE ticket 
      SET state = 'awaiting info', resolved_at = NOW()
      WHERE ticket_id = $1;
    `;
    await pool.query(query, [ticketId]);
  };

    // **Funkcija za za posodabljanje sla reasona**
export const updateSlaReason = async (ticketId: string, reason: string, accept_sla: boolean) => {
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
  };

export default pool;
