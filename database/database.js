import pg from 'pg';

const { Pool } = pg;

const databaseConfig = {
    user: 'postgres',
    password: '123456',
    database: 'mywallet',
    host: 'localhost',
    port: 5432
};

const connection = new Pool(databaseConfig);

export default connection;