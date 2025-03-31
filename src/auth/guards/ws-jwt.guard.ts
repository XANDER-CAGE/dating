import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromHeader(client);

    if (!token) {
      throw new WsException('Unauthorized');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Сохраняем информацию о пользователе в объекте клиента
      client['user'] = {
        userId: payload.sub,
        email: payload.email,
      };

      return true;
    } catch (error) {
      throw new WsException('Unauthorized');
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const auth = client.handshake.auth.token || 
                 client.handshake.headers.authorization;
    
    if (!auth) {
      return undefined;
    }

    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}