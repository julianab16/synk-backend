import GlobalController from './GlobalController';
import UserDAO from '../dao/UserDAO';
import { User } from '../models/User';


class UserController extends GlobalController<User> {
    /**
     * Create a new UserController instance.
     * 
     * The constructor passes the UserDAO to the parent class so that
     * all inherited methods (create, read, update, delete, getAll)
     * operate on the User model.
     */
    constructor() {
        super(UserDAO);
    }
    

    // Add reset password, register, login normal and login w apps

}

/**
 * Export a singleton instance of UserController.
 * 
 * This allows the same controller to be reused across routes
 * without creating multiple instances.
 */
export default new UserController();