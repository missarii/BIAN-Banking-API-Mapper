import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './dto';

const check = (input: object) => validate(plainToInstance(LoginDto, input));

describe('LoginDto', () => {
  it('accepts the seeded architect credentials', async () => {
    expect(
      await check({ email: 'architect@bank.example', password: 'architect123' }),
    ).toHaveLength(0);
  });

  it('rejects a malformed email', async () => {
    const errors = await check({ email: 'not-an-email', password: 'architect123' });
    expect(errors.map((e) => e.property)).toContain('email');
  });

  it('rejects a password shorter than 8 characters', async () => {
    const errors = await check({ email: 'a@bank.example', password: 'short' });
    expect(errors.map((e) => e.property)).toContain('password');
  });

  it('rejects a missing password', async () => {
    const errors = await check({ email: 'a@bank.example' });
    expect(errors.map((e) => e.property)).toContain('password');
  });

  it('rejects a missing email', async () => {
    const errors = await check({ password: 'architect123' });
    expect(errors.map((e) => e.property)).toContain('email');
  });
});