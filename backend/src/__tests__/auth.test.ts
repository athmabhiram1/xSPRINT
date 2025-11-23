import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { nanoid } from 'nanoid';

describe('Auth System', () => {
  beforeEach(async () => {
    await prisma.matchCodeUsage.deleteMany({});
    await prisma.matchCode.deleteMany({});
    await prisma.scheduleBlock.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.court.deleteMany({});
    await prisma.tournament.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should register a new user', async () => {
    const testId = nanoid(8);
    const userData = {
      name: `Test User ${testId}`,
      email: `test-${testId}@example.com`,
      password: 'password123',
    };

    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        passwordHash: await bcrypt.hash(userData.password, 10),
        role: Role.VIEWER,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.role).toBe(Role.VIEWER);
  });

  it('should hash passwords correctly', async () => {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);

    expect(hash).not.toBe(password);
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare('wrongpassword', hash)).toBe(false);
  });

  it('should prevent duplicate email registration', async () => {
    const testId = nanoid(8);
    const email = `duplicate-${testId}@example.com`;

    await prisma.user.create({
      data: {
        name: `User 1 ${testId}`,
        email,
        passwordHash: await bcrypt.hash('password', 10),
        role: Role.VIEWER,
      },
    });

    await expect(
      prisma.user.create({
        data: {
          name: `User 2 ${testId}`,
          email,
          passwordHash: await bcrypt.hash('password', 10),
          role: Role.VIEWER,
        },
      })
    ).rejects.toThrow();
  });
});
