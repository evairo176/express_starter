import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../middlewares';
import { ClaimService } from './claim.service';
import response from '../../cummon/utils/response';
import { HTTPSTATUS } from '../../config/http.config';
import {
  createClaimSchema,
  rejectClaimSchema,
} from '../../cummon/zod/claim.schema';

export class ClaimController {
  private claimService: ClaimService;

  constructor(claimService: ClaimService) {
    this.claimService = claimService;
  }

  public createClaim = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const userId = req?.user?.id;
      const body = createClaimSchema.parse({
        ...req?.body,
      });

      const { name, desc } = body;

      const result = await this.claimService.createClaim({
        name,
        desc,
        userId: userId as string,
      });

      return response.success(
        res,
        result,
        `Claim created successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public submitClaim = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { id } = req.params;
      const userId = req?.user?.id;
      const result = await this.claimService.submitClaim(id, userId as string);
      return response.success(
        res,
        result,
        `Claim submitted successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public findAll = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { data, metadata } = await this.claimService.findAll({
        ...req?.query,
      });

      return response.success(
        res,
        data,
        `Find all claims successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );

  public findOne = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { id } = req.params;
      const result = await this.claimService.getClaimDetail(id);
      return response.success(
        res,
        result,
        `Find one successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
  public reviewClaim = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { id } = req.params;
      const userId = req?.user?.id;
      await this.claimService.reviewClaim(id, userId as string);

      return response.success(
        res,
        null,
        `Claim reviewed successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
  public approveClaim = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { id } = req.params;
      const userId = req?.user?.id;
      await this.claimService.approveClaim(id, userId as string);

      return response.success(
        res,
        null,
        `Claim approved successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
  public rejectClaim = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { id } = req.params;
      const userId = req?.user?.id;
      const body = rejectClaimSchema.parse({
        ...req?.body,
      });

      await this.claimService.rejectClaim(id, userId as string, body?.note);

      return response.success(
        res,
        null,
        `Claim rejected successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
}
