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