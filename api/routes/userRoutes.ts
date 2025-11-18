import express, { Router, Request, Response } from 'express';
import UserController from '../controllers/UserController';

/**
 * Express router for user-related routes
 * 
 * Handles all HTTP operations for users including authentication,
 * CRUD operations, favorites management, and user comments.
 * 
 * @type {Router}
 */
const router: Router = express.Router();


/**
 * @route GET /users
 * @description Retrieve all users in the database
 * @access Public
 * @returns {Array<User>} Array of all user objects
 */
router.get("/", (req: Request, res: Response) => UserController.getAll(req, res));

/**
 * @route GET /users/:id
 * @description Retrieve a specific user by their ID
 * @access Public
 * @param {string} id - The unique identifier of the user
 * @returns {User} The user object with the specified ID
 */
router.get("/:id", (req: Request, res: Response) => UserController.read(req, res));

/**
 * @route POST /users
 * @description Create a new user.
 * @body {string} username - The username of the user.
 * @body {string} password - The password of the user.
 * @access Public
 */
router.post("/", (req: Request, res: Response) => UserController.create(req, res));

/**
 * @route PUT /users/:id
 * @description Update an existing user by ID.
 * @param {string} id - The unique identifier of the user.
 * @body {string} [username] - Updated username (optional).
 * @body {string} [password] - Updated password (optional).
 * @access Private - Requires authentication and user can only modify their own account
 */
router.put("/:id", (req: Request, res: Response) => UserController.update(req, res));

/**
 * @route DELETE /users/:id
 * @description Delete a user by ID.
 * @param {string} id - The unique identifier of the user.
 * @access Private - Requires authentication and user can only delete their own account
 */
router.delete("/:id", (req: Request, res: Response) => UserController.delete(req, res));

/**
 * @route POST /users/login
 * @description Authenticate a user and provide a JWT token.
 * @body {string} email - User's email.
 * @body {string} password - User's password.
 * @access Public
 */
// router.post("/login", (req: Request, res: Response) => 
//   UserController.login(req, res)
// );

// router.post("/register", (req: Request, res: Response) => UserController.register(req, res))

export default router;