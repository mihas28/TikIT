import { Pool } from 'pg';
import dotenv from 'dotenv';

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


export default pool;
