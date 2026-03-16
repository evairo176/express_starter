import { StatusClaim } from '@prisma/client';
import { db as prisma } from '../../database/database';
import { ErrorCode } from '../../cummon/enums/error-code.enum';
import { BadRequestException } from '../../cummon/utils/catch-errors';

export class ClaimService {
  public async createClaim(payload: {
    name: string;
    desc?: string;
    userId: string;
  }) {
    const { name, desc, userId } = payload;

    return prisma.$transaction(async (tx) => {
      const claim = await tx.claim.create({
        data: {
          name,
          desc,
          createdById: userId,
          status: 'DRAFT',
        },
      });

      await tx.claimApprovalLog.create({
        data: {
          claimId: claim.id,
          actorId: userId,
          fromStatus: 'DRAFT',
          toStatus: 'DRAFT',
        },
      });

      return claim;
    });
  }
  public async submitClaim(claimId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const claim = await tx.claim.findUniqueOrThrow({
        where: { id: claimId },
      });

      if (claim.status !== 'DRAFT') {
        throw new BadRequestException(
          'Status not in DRAFT',
          ErrorCode.VALIDATION_ERROR,
        );
      }

      await tx.claim.update({
        where: { id: claimId },
        data: {
          status: 'SUBMITTED',
        },
      });

      await tx.claimApprovalLog.create({
        data: {
          claimId,
          actorId: userId,
          fromStatus: claim.status,
          toStatus: 'SUBMITTED',
        },
      });

      return { message: 'Claim submitted' };
    });
  }
  public async findAll({
    page = 1,
    limit = 10,
    sortBy = 'updatedAt',
    sortDir = 'desc',
    search,
  }: {
    userId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'updatedAt'; // sesuaikan field
    sortDir?: 'asc' | 'desc';
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    // Filter dasar
    const where: any = {
      // userId,
      // expiredAt: {
      //   gt: new Date(),
      // },
    };

    // Opsional: search pada userAgent
    if (search && search.trim() !== '') {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Hitung total (without pagination)
    const total = await prisma.claim.count({
      where,
    });

    // Query data
    const claims = await prisma.claim.findMany({
      where,
      orderBy: {
        [sortBy]: sortDir,
      },
      skip: Number(skip),
      take: Number(limit),
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },

        logs: {
          include: {
            actor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: claims,
      metadata: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        sortBy,
        sortDir,
        search: search ?? null,
      },
    };
  }
  public async reviewClaim(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const claim = await tx.claim.findUnique({
        where: { id },
      });

      if (!claim) {
        throw new BadRequestException(
          'Claim not found',
          ErrorCode.VALIDATION_ERROR,
        );
      }

      if (claim.status !== 'SUBMITTED') {
        throw new BadRequestException(
          'Claim is not in SUBMITTED status',
          ErrorCode.VALIDATION_ERROR,
        );
      }

      await tx.claim.update({
        where: { id },
        data: {
          status: 'REVIEWED',
        },
      });

      await tx.claimApprovalLog.create({
        data: {
          claimId: id,
          actorId: userId,
          fromStatus: claim?.status as StatusClaim,
          toStatus: 'REVIEWED',
        },
      });

      return { message: 'Claim reviewed' };
    });
  }
  public async approveClaim(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const claim = await tx.claim.findUnique({
        where: { id },
      });

      if (!claim) {
        throw new BadRequestException(
          'Claim not found',
          ErrorCode.VALIDATION_ERROR,
        );
      }

      if (claim.status !== 'REVIEWED') {
        throw new BadRequestException(
          'Claim is not in REVIEWED status',
          ErrorCode.VALIDATION_ERROR,
        );
      }

      await tx.claim.update({
        where: { id },
        data: {
          status: 'APPROVED',
        },
      });

      await tx.claimApprovalLog.create({
        data: {
          claimId: id,
          actorId: userId,
          fromStatus: claim?.status as StatusClaim,
          toStatus: 'APPROVED',
        },
      });

      return { message: 'Claim approved' };
    });
  }
  public async rejectClaim(id: string, userId: string, note?: string) {
    return prisma.$transaction(async (tx) => {
      const claim = await tx.claim.findUnique({
        where: { id },
      });

      if (!claim) {
        throw new BadRequestException(
          'Claim not found',
          ErrorCode.VALIDATION_ERROR,
        );
      }

      if (claim.status !== 'REVIEWED') {
        throw new BadRequestException(
          'Claim is not in REVIEWED status',
          ErrorCode.VALIDATION_ERROR,
        );
      }

      await tx.claim.update({
        where: { id },
        data: {
          status: 'REJECTED',
        },
      });

      await tx.claimApprovalLog.create({
        data: {
          claimId: id,
          actorId: userId,
          fromStatus: claim?.status as StatusClaim,
          toStatus: 'REJECTED',
          note,
        },
      });

      return { message: 'Claim rejected' };
    });
  }

  public async getClaimDetail(id: string) {
    const claim = await prisma.claim.findUnique({
      where: { id },

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },

        logs: {
          include: {
            actor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return claim;
  }
}
