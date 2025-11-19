import { Request, Response } from 'express';

/**
 * Generic global controller class providing common CRUD operations.
 * It delegates the actual database logic to a corresponding DAO (Data Access Object).
 */
export default class GlobalController<T = any> {
    /**
     * The DAO instance used to interact with the database.
     */
    protected dao: any;
    
    /**
     * Create a new GlobalController.
     * @param dao - The DAO instance used to interact with the database.
     */
    constructor(dao: any) {
        this.dao = dao;
    }
    
    /**
     * Create a new document in the database.
     * @param req - Express request object containing the data in `req.body`.
     * @param res - Express response object.
     * @returns Sends status 201 with the created document, or 400 on error.
     */
    async create(req: Request, res: Response): Promise<any> {
        try {
            const item = await this.dao.create(req.body);
            res.status(201).json(item);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
    
    /**
     * Retrieve a document by ID.
     * @param req - Express request object with `req.params.id`.
     * @param res - Express response object.
     * @returns Sends status 200 with the document, or 404 if not found.
     */
    async read(req: Request, res: Response): Promise<any> {
        try {
            const item = await this.dao.getById(req.params.id);
            if (!item) {
                return res.status(404).json({ message: 'Not found' });
            }
            return res.status(200).json(item);
        } catch (error: any) {
            return res.status(404).json({ message: error.message });
        }
    }
    
    /**
     * Update an existing document by ID.
     * @param req - Express request object with `req.params.id` and update data in `req.body`.
     * @param res - Express response object.
     * @returns Sends status 200 with the updated document, or 400 on validation error.
     */
    async update(req: Request, res: Response): Promise<any> {
        try {
            const item = await this.dao.update(req.params.id, req.body);
            return res.status(200).json(item);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }
    
    /**
     * Delete a document by ID.
     * @param req - Express request object with `req.params.id`.
     * @param res - Express response object.
     * @returns Sends status 200 with the deleted document, or 404 if not found.
     */
    async delete(req: Request, res: Response): Promise<any> {
        try {
            console.log('[GlobalController.delete] id to delete=', req.params.id);
            const deleted = await this.dao.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: 'Not found' });
            }
            // No content on successful delete
            return res.sendStatus(204);
        } catch (error: any) {
            console.error('[GlobalController.delete] error', error);
            return res.status(500).json({ message: error.message });
        }
    }
    
    /**
     * Retrieve all documents, optionally filtered by query parameters.
     * @param req - Express request object (filters in `req.query`).
     * @param res - Express response object.
     * @returns Sends status 200 with the array of documents, or 400 on error.
     */
    async getAll(req: Request, res: Response): Promise<any> {
        try {
            // GlobalDAO.getAll does not accept args; pass filters through DAO if implemented
            const items = await this.dao.getAll();
            return res.status(200).json(items);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }
}