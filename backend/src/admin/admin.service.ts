import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) throw new UnauthorizedException();
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) throw new UnauthorizedException();
    const accessToken = this.jwt.sign(
      {
        sub: admin.id,
        email: admin.email,
        typ: 'admin',
        role: admin.role,
      },
      { secret: this.config.getOrThrow<string>('JWT_SECRET'), expiresIn: '8h' },
    );
    return { accessToken, expiresIn: 28800 };
  }
}
