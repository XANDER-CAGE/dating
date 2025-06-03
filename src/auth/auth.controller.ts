import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { AuthService } from './auth.service';
  import { RegisterDto } from './dto/register.dto';
  import { LoginDto } from './dto/login.dto';
  import { AuthResponseDto } from './dto/auth-response.dto';
  import { LocalAuthGuard } from './guards/local-auth.guard';
  import { JwtAuthGuard } from './guards/jwt-auth.guard';
  import { Public } from '../common/decorators/public.decorator';
  
  @ApiTags('Authentication')
  @Controller('auth')
  export class AuthController {
    constructor(private authService: AuthService) {}
  
    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
      return this.authService.register(registerDto);
    }
  
    @Public()
    @Post('login')
    @UseGuards(LocalAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Request() req, @Body() loginDto: LoginDto): Promise<AuthResponseDto> {
      return this.authService.login(req.user);
    }
  
    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refresh(@Body('refreshToken') refreshToken: string) {
      return this.authService.refreshTokens(refreshToken);
    }
  
    @Post('verify-email')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify user email' })
    @ApiResponse({ status: 200, description: 'Email verified successfully' })
    async verifyEmail(@Request() req) {
      const result = await this.authService.verifyEmail(req.user.id);
      return { verified: result };
    }
  
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    async logout(@Request() req) {
      // В реальном приложении здесь можно добавить токен в blacklist
      return { message: 'Logout successful' };
    }
  }