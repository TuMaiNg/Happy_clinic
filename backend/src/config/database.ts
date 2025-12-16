import mysql from 'mysql2/promise';
import { config } from './env';

const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  waitForConnections: true,
  connectionLimit: 20, // Increased for better performance
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  timezone: '+07:00',
  // Performance optimizations
  multipleStatements: false, // Security: prevent SQL injection via multiple statements
  dateStrings: false, // Return dates as Date objects
  supportBigNumbers: true,
  bigNumberStrings: false,
});

pool
  .getConnection()
  .then((connection) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Database connected successfully');
    }
    connection.release();
  })
  .catch((error) => {
    // Database connection errors should be logged in production
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ Database connection failed:', error.message);
    }
  });

export default pool;

