import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 14;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, name },
    });
    return this.issueTokens(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; tid: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      }) as { sub: string; tid: string };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const row = await this.prisma.refreshToken.findUnique({
      where: { id: payload.tid },
    });
    if (!row || row.userId !== payload.sub || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({ where: { id: row.userId } });
    if (!user) throw new UnauthorizedException();
    await this.prisma.refreshToken.delete({ where: { id: row.id } });
    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      try {
        const p = this.jwt.verify(refreshToken, {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        }) as { tid: string };
        await this.prisma.refreshToken.deleteMany({ where: { id: p.tid, userId } });
      } catch {
        await this.prisma.refreshToken.deleteMany({ where: { userId } });
      }
    } else {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
  }

  private async issueTokens(userId: string, email: string) {
    const refreshRaw = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(refreshRaw, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);
    const row = await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    const refreshToken = this.jwt.sign(
      { sub: userId, tid: row.id },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: `${REFRESH_TTL_DAYS}d`,
      },
    );
    const accessToken = this.jwt.sign(
      { sub: userId, email, typ: 'user' },
      { secret: this.config.getOrThrow<string>('JWT_SECRET'), expiresIn: ACCESS_TTL },
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }
}
