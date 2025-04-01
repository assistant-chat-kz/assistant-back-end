import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { name, surname, email, password, userType } = registerDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(userType, 'userType')

    const user =
      userType === 'admin' ? await this.prisma.admin.create({
        data: {
          name,
          surname,
          email,
          password: hashedPassword,
          userType
        },
      })
        : userType === 'psychologist' ? await this.prisma.psychologist.create({
          data: {
            name,
            surname,
            email,
            password: hashedPassword,
            userType
          },
        }) :
          await this.prisma.user.create({
            data: {
              name,
              surname,
              email,
              password: hashedPassword,
            },
          });

    return { id: user.id, email: user.email };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userId: user.id, email: user.email, name: user.name, surname: user.surname };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async loginAdmin(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userId: admin.id, email: admin.email, name: admin.name, surname: admin.surname, userType: 'admin' };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async loginPsychologist(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const psychologist = await this.prisma.psychologist.findUnique({ where: { email } });
    if (!psychologist || !(await bcrypt.compare(password, psychologist.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userId: psychologist.id, email: psychologist.email, name: psychologist.name, surname: psychologist.surname, userType: 'psychologist' };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

}
