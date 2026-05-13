const { Pool } = require('pg');

const useReplica = process.env.USE_REPLICA !== 'false';
const pool = new Pool({
  connectionString: useReplica ? process.env.REPLICA_URL : process.env.PRIMARY_URL,
});

module.exports = { pool, useReplica };
