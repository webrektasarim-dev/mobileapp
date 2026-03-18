import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) return true;
    try {
      const payload = this.jwt.verify(h.slice(7), {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      }) as { sub: string; typ: string };
      if (payload.typ === 'user') {
        (req as unknown as { user?: { userId: string } }).user = {
          userId: payload.sub,
        };
      }
    } catch {
      /* misafir */
    }
    return true;
  }
}
