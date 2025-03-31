import { 
    Controller, 
    Post, 
    Body, 
    UseGuards, 
    Req, 
    Get, 
    HttpCode, 
    HttpStatus 
  } from '@nestjs/common';
  import { AuthService } from './auth.service';
  import { RegisterDto } from './dto/register.dto';
  import { LoginDto } from './dto/login.dto';
  import { RefreshTokenDto } from './dto/refresh-token.dto';
  import { JwtAuthGuard } from './guards/jwt-auth.guard';
  import { GoogleAuthGuard } from './guards/google-auth.guard';
  import { FacebookAuthGuard } from './guards/facebook-auth.guard';
  import { GetUser } from '../common/decorators/user.decorator';
  
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
    @Post('register')
    register(@Body() registerDto: RegisterDto) {
      return this.authService.register(registerDto);
    }
  
    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() loginDto: LoginDto) {
      return this.authService.login(loginDto);
    }
  
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    logout(@GetUser('userId') userId: string) {
      return this.authService.logout(userId);
    }
  
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
      return this.authService.refreshTokens(
        refreshTokenDto.userId,
        refreshTokenDto.refreshToken,
      );
    }
  
    // OAuth2 авторизация через Google
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    googleAuth() {
      // Инициирует процесс авторизации Google
    }
  
    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    googleAuthCallback(@Req() req) {
      // Обработка ответа от Google
      return this.authService.validateOAuthUser(
        req.user.email,
        req.user.name,
        'google',
      );
    }
  
    // OAuth2 авторизация через Facebook
    @Get('facebook')
    @UseGuards(FacebookAuthGuard)
    facebookAuth() {
      // Инициирует процесс авторизации Facebook
    }
  
    @Get('facebook/callback')
    @UseGuards(FacebookAuthGuard)
    facebookAuthCallback(@Req() req) {
      // Обработка ответа от Facebook
      return this.authService.validateOAuthUser(
        req.user.email,
        req.user.name,
        'facebook',
      );
    }
  }