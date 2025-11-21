import prisma from '../lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class MatchCodeService {
  
  // Generate a 6-digit code, hash it, store it
  async generateCodeForMatch(matchId: string) {
    const rawCode = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(rawCode, salt);

    // Store in DB (Upsert to handle regeneration)
    await prisma.matchCode.upsert({
      where: { matchId },
      update: {
        codeHash: hashedCode,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours validity
      },
      create: {
        matchId,
        codeHash: hashedCode,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    return rawCode; // Return raw code to Admin/Umpire ONLY ONCE
  }

  // Verify code for scoring access
  async verifyCode(matchId: string, inputCode: string) {
    const record = await prisma.matchCode.findUnique({
      where: { matchId }
    });

    if (!record || !record.isActive) return false;
    if (new Date() > record.expiresAt) return false;

    const isValid = await bcrypt.compare(inputCode, record.codeHash);
    return isValid;
  }

  // Invalidate code after match completion
  async invalidateCode(matchId: string) {
    await prisma.matchCode.update({
      where: { matchId },
      data: { isActive: false }
    });
  }
}
