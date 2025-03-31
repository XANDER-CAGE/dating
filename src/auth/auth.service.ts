import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Проверяем, не зарегистрирован ли уже email
    const userExists = await this.usersService.findByEmail(registerDto.email);
    if (userExists) {
      throw new BadRequestException('Пользователь с таким email уже существует');
    }

    // Хешируем пароль
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Создаем пользователя
    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Генерируем токены
    const tokens = await this.getTokens(newUser.id, newUser.email);
    
    // Сохраняем refresh token в базе
    await this.updateRefreshToken(newUser.id, tokens.refreshToken);

    return {
      user: this.usersService.sanitizeUser(newUser),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    // Находим пользователя по email
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Проверяем пароль
    const isPasswordValid = await this.comparePasswords(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Обновляем статус активности
    await this.usersService.updateLastActive(user.id);

    // Генерируем токены
    const tokens = await this.getTokens(user.id, user.email);
    
    // Сохраняем refresh token в базе
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.usersService.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    // Находим пользователя по ID
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Доступ запрещен');
    }

    // Проверяем refreshToken
    const isRefreshTokenValid = await this.comparePasswords(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Доступ запрещен');
    }

    // Генерируем новые токены
    const tokens = await this.getTokens(user.id, user.email);
    
    // Сохраняем новый refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    // Удаляем refreshToken из базы
    await this.usersService.update(userId, { refreshToken: null });
    return { success: true };
  }

  async validateOAuthUser(email: string, name: string, provider: string) {
    // Проверяем, есть ли пользователь с таким email
    let user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Если пользователя нет, создаем нового
      const password = await this.hashPassword(
        Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
      );
      
      user = await this.usersService.create({
        email,
        password,
        profile: {
          name,
        },
        emailVerified: true,
      });
    }
    
    // Генерируем токены
    const tokens = await this.getTokens(user.id, user.email);
    
    // Сохраняем refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    
    return {
      user: this.usersService.sanitizeUser(user),
      ...tokens,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePasswords(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  private async getTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRATION', '1h'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    // Хешируем refresh token перед сохранением
    const hashedRefreshToken = await this.hashPassword(refreshToken);
    await this.usersService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }
}