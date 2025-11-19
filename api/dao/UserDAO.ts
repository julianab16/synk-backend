import { User } from '../models/User';
import { GlobalDAO } from './GlobalDAO';

class UserDAO extends GlobalDAO<User> {
  constructor() {
    super('users');
  }

  /** Find a user by email. Returns null when none found. */
  async findByEmail(email: string): Promise<User | null> {
    const results = await this.findBy('email', '==', email);
    return results.length ? results[0] : null;
  }

  /** Create or replace a user document using a specific id (e.g. auth uid). */
  async createWithId(id: string, user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    await super.createWithId(id, user as any);
  }
}

export default new UserDAO();