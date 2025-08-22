import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("createUserNoAuth")
  async createUserNoAuth(@Body("id") id: string) {
    return this.authService.createUserNoAuth(id);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('loginAdmin')
  async loginAdmin(@Body() loginDto: LoginDto) {
    return this.authService.loginAdmin(loginDto);
  }

  @Post('loginPsychologist')
  async loginPsychologist(@Body() loginDto: LoginDto) {
    return this.authService.loginPsychologist(loginDto);
  }
}
