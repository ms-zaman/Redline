import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "redline_db",
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on("error", (err, client) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
});

// Test database connection
export async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT NOW()");
        client.release();
        console.log("✅ Database connected successfully");
        return true;
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        return false;
    }
}

// Query helper function
export async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        if (process.env.NODE_ENV === "development") {
            console.log("Executed query", {
                text,
                duration,
                rows: result.rowCount,
            });
        }

        return result;
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    }
}

// Transaction helper
export async function transaction(callback) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

// Get a client from the pool (for complex operations)
export async function getClient() {
    return await pool.connect();
}

// Close all connections (for graceful shutdown)
export async function closePool() {
    await pool.end();
    console.log("Database pool closed");
}

export default pool;
