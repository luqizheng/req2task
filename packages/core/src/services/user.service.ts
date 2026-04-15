import { User } from '../entities/user.entity';
import { UserBo } from '../bo/user.bo';

export class UserService {
  async findById(id: string): Promise<User | null> {
    return null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return null;
  }

  async create(data: UserBo): Promise<User> {
    return {} as User;
  }

  async update(id: string, data: Partial<UserBo>): Promise<User> {
    return {} as User;
  }

  async delete(id: string): Promise<void> {
    return;
  }
}
