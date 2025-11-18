import { User } from '../models/User';
import { GlobalDAO } from './GlobalDAO';

class UserDAO extends GlobalDAO<User> {

  constructor() {
    super('users');
  }
}

export default new UserDAO();