import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const account = await this.accountsService.findByEmail(email);
    if (!account) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, account.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: account.id, role: account.role, email: account.email };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      account: {
        id: account.id,
        email: account.email,
        role: account.role,
      },
    };
  }
}
