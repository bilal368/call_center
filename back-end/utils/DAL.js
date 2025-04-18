const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 200,
    queueLimit: 200,
    connectTimeout: 10000, // Increased timeout (10 seconds)
});

let isConnected = false;

// Function to test and retry connection attempts
const connectToDatabase = async (retryInterval = 5000) => {
    while (!isConnected) {
        try {
            const connection = await pool.promise().getConnection();
            console.info("✅Database connected successfully.");
            isConnected = true; // Set flag to true upon success
            connection.release(); // Release the connection
        } catch (err) {
            console.error(`❌ Database connection failed: ${err.message}`);
            console.error(`⚠️ Retrying connection in ${retryInterval / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryInterval)); // Wait before retrying
        }
    }
};

// Attempt to connect initially
connectToDatabase();

pool.on('connection', (connection) => {
    // console.info('New connection established with ID:', connection.threadId);
});

pool.on('release', (connection) => {
    // console.info('Connection released with ID:', connection.threadId);
});

// Graceful Shutdown
const shutdownPool = async () => {
    console.info("Shutting down connection pool...");
    try {
        await pool.end(); // End all active connections
        console.info("Connection pool closed successfully.");
    } catch (err) {
        console.error("Error shutting down connection pool:", err.message);
    }
};

// Listen for termination signals
process.on('SIGINT', async () => {
    console.info("SIGINT received. Cleaning up resources...");
    await shutdownPool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.info("SIGTERM received. Cleaning up resources...");
    await shutdownPool();
    process.exit(0);
});

process.on('uncaughtException', async (err) => {
    console.error("Uncaught Exception:", err.message);
    console.error(err.stack);
    await shutdownPool();
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    await shutdownPool();
    process.exit(1);
});

module.exports = pool.promise();
