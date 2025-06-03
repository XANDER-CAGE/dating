import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['profile'],
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { phone },
      relations: ['profile'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async markAsVerified(id: string): Promise<boolean> {
    const result = await this.usersRepository.update(id, { isVerified: true });
    return result.affected > 0;
  }

  async deactivate(id: string): Promise<boolean> {
    const result = await this.usersRepository.update(id, { isActive: false });
    return result.affected > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.usersRepository.delete(id);
    return result.affected > 0;
  }
}