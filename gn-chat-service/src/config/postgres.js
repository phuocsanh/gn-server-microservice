const { Pool } = require('pg');

let pool;

const connectPostgres = async () => {
  try {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'postgres_gn_farm',
      port: process.env.POSTGRES_PORT || 5432,
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '123456',
      database: process.env.POSTGRES_DB || 'GO_GN_FARM',
    });

    // Test the connection
    const client = await pool.connect();
    client.release();
    
    console.log('PostgreSQL connected');
    return pool;
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('PostgreSQL has not been initialized. Call connectPostgres first.');
  }
  return pool;
};

module.exports = { connectPostgres, getPool };
