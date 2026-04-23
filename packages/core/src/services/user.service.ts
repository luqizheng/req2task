import { User } from '../entities/user.entity';
import { UserBo } from '../bo/user.bo';

export class UserService {
  async findById(_id: string): Promise<User | null> {
    return null;
  }

  async findByUsername(_username: string): Promise<User | null> {
    return null;
  }

  async create(_data: UserBo): Promise<User> {
    return {} as User;
  }

  async update(_id: string, _data: Partial<UserBo>): Promise<User> {
    return {} as User;
  }

  async delete(_id: string): Promise<void> {
    return;
  }
}
