import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Role } from '@prisma/client';

export class MatchCodeService {
  async generateCodeForMatch(matchId: string, assignedUmpireId: string): Promise<string> {
    const umpire = await prisma.user.findUnique({
      where: { id: assignedUmpireId },
      select: { id: true, role: true, name: true, email: true },
    });

    if (!umpire) {
      throw new Error('Assigned umpire not found');
    }

    if (umpire.role !== Role.UMPIRE && umpire.role !== Role.ADMIN) {
      throw new Error(`User ${umpire.email} does not have UMPIRE or ADMIN role`);
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, status: true },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    const rawCode = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(rawCode, salt);

    await prisma.matchCode.upsert({
      where: { matchId },
      update: {
        codeHash: hashedCode,
        assignedUmpireId,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      create: {
        matchId,
        assignedUmpireId,
        codeHash: hashedCode,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return rawCode;
  }

  async verifyCode(matchId: string, inputCode: string, userId: string, ip?: string): Promise<boolean> {
    const record = await prisma.matchCode.findUnique({
      where: { matchId },
      include: {
        match: {
          select: { status: true },
        },
        assignedUmpire: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (!record) {
      await this.logCodeUsage(matchId, userId, ip, false);
      return false;
    }

    if (record.match.status !== 'PENDING' && record.match.status !== 'SCHEDULED') {
      await this.logCodeUsage(matchId, userId, ip, false);
      throw new Error('Cannot validate code for completed or inactive match');
    }

    if (!record.isActive) {
      await this.logCodeUsage(matchId, userId, ip, false);
      return false;
    }

    if (new Date() > record.expiresAt) {
      await this.logCodeUsage(matchId, userId, ip, false);
      return false;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      await this.logCodeUsage(matchId, userId, ip, false);
      return false;
    }

    if (user.role !== Role.ADMIN && record.assignedUmpireId !== userId) {
      await this.logCodeUsage(matchId, userId, ip, false);
      return false;
    }

    const isValid = await bcrypt.compare(inputCode, record.codeHash);

    await this.logCodeUsage(matchId, userId, ip, isValid);

    return isValid;
  }

  async invalidateCode(matchId: string): Promise<void> {
    await prisma.matchCode.update({
      where: { matchId },
      data: {
        isActive: false,
        expiresAt: new Date(),
      },
    });
  }

  async validateUmpireAccess(userId: string, matchId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    if (user.role === Role.ADMIN) {
      return true;
    }

    if (user.role === Role.UMPIRE) {
      const matchCode = await prisma.matchCode.findUnique({
        where: { matchId },
        select: { assignedUmpireId: true },
      });

      return matchCode?.assignedUmpireId === userId;
    }

    return false;
  }

  private async logCodeUsage(matchId: string, umpireId: string | undefined, ip: string | undefined, success: boolean): Promise<void> {
    await prisma.matchCodeUsage.create({
      data: {
        matchId,
        umpireId: umpireId || null,
        ip: ip || null,
        success,
      },
    });
  }
}
