/**
 * Main application entry point for the Lumiere Movie API
 * 
 * Sets up an Express server with MongoDB connection, middleware configuration,
 * and API routes for the movie streaming platform.
 * 
 * @fileoverview Entry point for the Lumiere Movie API backend server
 * @version 1.0.0
 */

import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
// use require() to avoid missing @types/cors in dev dependencies
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors');
import routes from './routes/routes';

// Load environment variables from .env file
dotenv.config();

/**
 * Express application instance
 * @type {Express}
 */
const app: Express = express();

/**
 * Middleware configuration
 * - Parse JSON request bodies
 * - Parse URL-encoded request bodies
 * - Enable Cross-Origin Resource Sharing (CORS)
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
// Allow origins from CORS_ORIGINS env var (comma-separated), falling back to localhost and deployed URL
const defaultOrigins = ['http://localhost:3000', 'http://localhost:8080', 'https://synk-backend-bia5.onrender.com','https://synk-client.vercel.app'];
const raw = (process.env.CORS_ORIGINS || defaultOrigins.join(','));
const allowedOrigins = raw.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
    origin: (origin: any, callback: (err: Error | null, allow?: boolean) => void) => {
        // allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        return callback(new Error('CORS policy: origin not allowed'));
    },
    credentials: true,
}));

// Note: explicit wildcard path caused path-to-regexp errors in some envs.
// `app.use(cors(...))` above already enables CORS and handles preflight.
// If explicit preflight handling is required, use a middleware that checks
// req.method === 'OPTIONS' and delegates to cors().

/**
 * Mount the API routes.
 * All feature routes are grouped under `/api`.
 */
app.use("/api", routes);

/**
 * Health check endpoint
 * 
 * Provides a simple endpoint to verify that the server is up and running.
 * Useful for monitoring, load balancers, and deployment verification.
 * 
 * @route GET /
 * @returns {string} Simple confirmation message
 */
app.get("/", (_req: Request, res: Response) => res.send("Server is running"));

/**
 * Start the server only if this file is run directly
 * 
 * This prevents multiple server instances when the file is imported
 * for testing purposes. The server will only start when running
 * this file directly with `node index.js` or `npm start`.
 */
if (require.main === module) {
    /** Server port from environment variable or default to 3000 */
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

/**
 * Export the Express app instance
 * 
 * Allows the app to be imported for testing or integration
 * with other modules without starting the server.
 * 
 * @exports {Express} The configured Express application
 */
export default app;
