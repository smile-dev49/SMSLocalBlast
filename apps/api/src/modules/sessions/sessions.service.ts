import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

export interface SafeSession {
  readonly id: string;
  readonly userId: string;
  readonly organizationId: string | null;
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
  readonly deviceFingerprint: string | null;
  readonly isRevoked: boolean;
  readonly revokedAt: Date | null;
  readonly expiresAt: Date;
  readonly lastUsedAt: Date | null;
  readonly createdAt: Date;
}

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    input: {
      readonly id: string;
      userId: string;
      organizationId: string | null;
      refreshTokenHash: string;
      userAgent: string | null;
      ipAddress: string | null;
      deviceFingerprint: string | null;
      expiresAt: Date;
    },
    tx?: PrismaClientLike,
  ): Promise<SafeSession> {
    const client: PrismaClientLike = tx ?? this.prisma;

    const created = await client.session.create({
      data: {
        id: input.id,
        userId: input.userId,
        organizationId: input.organizationId,
        refreshTokenHash: input.refreshTokenHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        deviceFingerprint: input.deviceFingerprint,
        expiresAt: input.expiresAt,
      },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        userAgent: true,
        ipAddress: true,
        deviceFingerprint: true,
        isRevoked: true,
        revokedAt: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return created;
  }

  async getSessionForAccess(sessionId: string, tx?: PrismaClientLike) {
    const client: PrismaClientLike = tx ?? this.prisma;
    const session = await client.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        isRevoked: true,
        revokedAt: true,
        expiresAt: true,
      },
    });
    return session;
  }

  async getSessionForRefresh(
    sessionId: string,
    tx?: PrismaClientLike,
  ): Promise<{
    readonly id: string;
    readonly userId: string;
    readonly organizationId: string | null;
    readonly refreshTokenHash: string;
    readonly isRevoked: boolean;
    readonly revokedAt: Date | null;
    readonly expiresAt: Date;
  } | null> {
    const client: PrismaClientLike = tx ?? this.prisma;
    const session = await client.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        refreshTokenHash: true,
        isRevoked: true,
        revokedAt: true,
        expiresAt: true,
      },
    });
    return session;
  }

  async rotateRefreshToken(
    input: {
      sessionId: string;
      userId: string;
      newRefreshTokenHash: string;
      newExpiresAt: Date;
      lastUsedAt: Date;
    },
    tx?: PrismaClientLike,
  ): Promise<SafeSession> {
    const client: PrismaClientLike = tx ?? this.prisma;

    const updated = await client.session.update({
      where: { id: input.sessionId },
      data: {
        refreshTokenHash: input.newRefreshTokenHash,
        expiresAt: input.newExpiresAt,
        lastUsedAt: input.lastUsedAt,
      },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        userAgent: true,
        ipAddress: true,
        deviceFingerprint: true,
        isRevoked: true,
        revokedAt: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    // Ownership check happens at the caller (or pre-query) because prisma update won't let us join userId easily.
    // We still return the session safely without refresh hashes.
    return updated;
  }

  async revokeSession(
    input: {
      sessionId: string;
      userId: string;
    },
    tx?: PrismaClientLike,
  ): Promise<SafeSession | null> {
    const client: PrismaClientLike = tx ?? this.prisma;
    const existing = await client.session.findUnique({
      where: { id: input.sessionId },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        userAgent: true,
        ipAddress: true,
        deviceFingerprint: true,
        isRevoked: true,
        revokedAt: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    if (!existing) return null;
    if (existing.userId !== input.userId) return null;
    if (existing.isRevoked) return existing;

    const updated = await client.session.update({
      where: { id: input.sessionId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        userAgent: true,
        ipAddress: true,
        deviceFingerprint: true,
        isRevoked: true,
        revokedAt: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return updated;
  }

  async revokeAllOtherSessions(
    userId: string,
    keepSessionId: string,
    tx?: PrismaClientLike,
  ): Promise<SafeSession[]> {
    const client: PrismaClientLike = tx ?? this.prisma;

    const activeOthers = await client.session.findMany({
      where: {
        userId,
        id: { not: keepSessionId },
        isRevoked: false,
      },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        userAgent: true,
        ipAddress: true,
        deviceFingerprint: true,
        isRevoked: true,
        revokedAt: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    if (activeOthers.length === 0) return [];

    await client.session.updateMany({
      where: {
        userId,
        id: { in: activeOthers.map((s) => s.id) },
        isRevoked: false,
      },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    return activeOthers.map((s) => ({
      ...s,
      isRevoked: true,
      revokedAt: new Date(),
    }));
  }

  async listSessionsByUser(
    userId: string,
    opts?: { limit?: number },
    tx?: PrismaClientLike,
  ): Promise<SafeSession[]> {
    const client: PrismaClientLike = tx ?? this.prisma;
    const limit = opts?.limit ?? 20;
    const sessions = await client.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        userId: true,
        organizationId: true,
        userAgent: true,
        ipAddress: true,
        deviceFingerprint: true,
        isRevoked: true,
        revokedAt: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
    return sessions;
  }
}
