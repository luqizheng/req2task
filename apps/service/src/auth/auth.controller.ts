import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestDto, LoginResponseDto, RegisterRequestDto } from '@req2task/dto';

interface JwtPayload {
  userId: string;
  username: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterRequestDto,
  ): Promise<{ message: string; user: { userId: string; username: string; email: string; displayName: string } }> {
    const user = await this.authService.register(registerDto);
    return {
      message: 'User registered successfully',
      user: { userId: user.id, username: user.username, email: user.email, displayName: user.displayName },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }
}
