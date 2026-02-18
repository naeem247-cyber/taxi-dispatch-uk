import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/auth/auth.service';
import { AccountsService } from '../src/accounts/accounts.service';
import { Role } from '../src/common/enums/role.enum';

describe('Auth integration', () => {
  let authService: AuthService;

  const passwordHashPromise = bcrypt.hash('password123', 10);

  const accountsServiceMock = {
    async findByEmail(email: string) {
      if (email !== 'operator@test.com') return null;
      return {
        id: 'acc-1',
        email: 'operator@test.com',
        passwordHash: await passwordHashPromise,
        role: Role.OPERATOR,
      };
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } })],
      providers: [
        AuthService,
        {
          provide: AccountsService,
          useValue: accountsServiceMock,
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('logs in with valid credentials', async () => {
    const result = await authService.login('operator@test.com', 'password123');
    expect(result.accessToken).toBeDefined();
    expect(result.account.role).toBe(Role.OPERATOR);
  });
});
