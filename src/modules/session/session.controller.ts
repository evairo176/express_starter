import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';
import { SessionService } from './session.service';
import { HTTPSTATUS } from '../../config/http.config';
import { NotFoundException } from '../../cummon/utils/catch-errors';
import { z } from 'zod';
import response from '../../cummon/utils/response';

export class SessionController {
  private sessionService: SessionService;

  constructor(sessionService: SessionService) {
    this.sessionService = sessionService;
  }

  public getSessionByUser = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const userId = req?.user?.id;
      const sessionId = req.sessionId;

      const { data, metadata } = await this.sessionService.getSessionByUser({
        ...req?.query,
        userId,
      });

      const modifySession = data?.map((session) => {
        return {
          ...session,
          isCurrent: session.id === sessionId ? true : false,
        };
      });

      return response.success(
        res,
        modifySession,
        `Retrieved all portfolio successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );

  public getSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const sessionId = req.sessionId;

      if (!sessionId) {
        throw new NotFoundException('Session ID not found. please login again');
      }
      const { user } = await this.sessionService.getSessionById(sessionId);

      return response.success(
        res,
        user,
        'Retrieved session successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  public revokeSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const sessionId = z.string().parse(req?.params?.id);

      const userId = req?.user?.id as string;

      const session = await this.sessionService.revokeSession(
        sessionId,
        userId,
      );

      return response.success(
        res,
        null,
        `Session ${session?.id} revoke successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
}
