import express, { Router, Request, Response } from 'express';
import UserController from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';

/**
 * Express router for user-related routes
 */
const router: Router = express.Router();

// return the authenticated user's profile
// NOTE: this must be before "/:id" so the literal path /me doesn't match the id param
router.get('/me', authMiddleware, (req: Request, res: Response) => UserController.me(req, res));

// Public list and create
router.get('/', (req: Request, res: Response) => UserController.getAll(req, res));
router.post('/', (req: Request, res: Response) => UserController.create(req, res));

// Authentication endpoints
router.post('/login', (req: Request, res: Response) => UserController.login(req, res));
router.post('/social', (req: Request, res: Response) => UserController.socialLogin(req, res));
router.post('/register', (req: Request, res: Response) => UserController.register(req, res));

// Item-specific routes (id param)
router.get('/:id', (req: Request, res: Response) => UserController.read(req, res));
router.put('/:id', authMiddleware, (req: Request, res: Response) => UserController.update(req, res));
router.delete('/:id', authMiddleware, (req: Request, res: Response) => UserController.delete(req, res));

export default router;