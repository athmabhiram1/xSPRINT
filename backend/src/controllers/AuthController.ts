import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { authConfig } from '../config/auth';
import { asyncHandler } from '../middlewares/asyncHandler';
import { ok, fail } from '../utils/responseFormatter';
import { Role } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const signToken = (user: { id: string; role: Role; email: string; name: string }) =>
  jwt.sign(
    { userId: user.id, role: user.role, email: user.email, name: user.name },
    authConfig.jwtSecret,
    { expiresIn: authConfig.jwtExpiresIn } as any
  );

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json(fail('Missing required fields: name, email, password'));
  }

  if (password.length < 6) {
    return res.status(400).json(fail('Password must be at least 6 characters'));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json(fail('Email already in use'));
  }

  const passwordHash = await bcrypt.hash(password, authConfig.bcryptSaltRounds);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: Role.VIEWER },
    select: { id: true, name: true, email: true, role: true }
  });

  const token = signToken(user);
  res.cookie(authConfig.cookieName, token, authConfig.cookieOptions);

  return res.status(201).json(ok(user));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json(fail('Missing required fields: email, password'));
  }

  const userRecord = await prisma.user.findUnique({ where: { email } });
  if (!userRecord) {
    return res.status(401).json(fail('Invalid credentials'));
  }

  const valid = await bcrypt.compare(password, userRecord.passwordHash);
  if (!valid) {
    return res.status(401).json(fail('Invalid credentials'));
  }

  const user = {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    role: userRecord.role
  };

  const token = signToken(user);
  res.cookie(authConfig.cookieName, token, authConfig.cookieOptions);

  return res.json(ok(user));
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json(fail('Authentication required'));
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true }
  });

  if (!user) {
    return res.status(404).json(fail('User not found'));
  }

  return res.json(ok(user));
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(authConfig.cookieName, {
    httpOnly: true,
    secure: authConfig.cookieOptions.secure,
    sameSite: authConfig.cookieOptions.sameSite,
  });
  return res.json(ok(true));
});
