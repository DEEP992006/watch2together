import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function migrate() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS moods (
        id serial PRIMARY KEY NOT NULL,
        username varchar(50) NOT NULL,
        mood varchar(50) NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS memories (
        id serial PRIMARY KEY NOT NULL,
        username varchar(50) NOT NULL,
        image_url text NOT NULL,
        caption text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    
    console.log('✅ Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await sql.end();
  }
}

migrate();
