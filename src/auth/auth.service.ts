import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { classifyAudienceSource } from 'src/user/audience-source';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { name, surname, email, password, userType } = registerDto;

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedEmail = email.trim().toLowerCase();
    const source = classifyAudienceSource(normalizedEmail);

    const user =
      userType === 'admin' ? await this.prisma.admin.create({
        data: {
          name,
          surname,
          email: normalizedEmail,
          password: hashedPassword,
          userType
        },
      })
        : userType === 'psychologist' ? await this.prisma.psychologist.create({
          data: {
            name,
            surname,
          email: normalizedEmail,
            password: hashedPassword,
            userType
          },
        }) :
          await this.prisma.user.create({
            data: {
              name,
              surname,
              email: normalizedEmail,
              password: hashedPassword,
              verify: true,
              source,
            },
          });

    return {
      id: user.id,
      email: user.email,
      source: 'source' in user ? user.source : undefined,
    };
  }

  async createUserNoAuth(id: string) {
    return this.prisma.userNoAuth.upsert({
      where: { id },
      create: { id },
      update: {},
    });
  }



  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const { password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.verify) {
      throw new UnauthorizedException('User is not verified');
    }

    const source = classifyAudienceSource(user.email);
    const normalizedUser =
      user.source === source
        ? user
        : await this.prisma.user.update({
            where: { id: user.id },
            data: { source },
          });
    const payload = {
      userId: normalizedUser.id,
      email: normalizedUser.email,
      name: normalizedUser.name,
      surname: normalizedUser.surname,
      source: normalizedUser.source,
    };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, source: normalizedUser.source };
  }

  async loginAdmin(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const { password } = loginDto;

    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userId: admin.id, email: admin.email, name: admin.name, surname: admin.surname, userType: 'admin' };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async loginPsychologist(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const { password } = loginDto;

    const psychologist = await this.prisma.psychologist.findUnique({ where: { email } });
    if (!psychologist || !(await bcrypt.compare(password, psychologist.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userId: psychologist.id, email: psychologist.email, name: psychologist.name, surname: psychologist.surname, userType: 'psychologist' };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

}
