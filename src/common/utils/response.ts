import { Response } from 'express';

export default {
  success(
    res: Response,
    data: any,
    message: string = 'Success',
    status: number = 200,
    metadata: any = {},
  ) {
    return res.status(status).json({
      status: 'success',
      message,
      data,
      metadata,
    });
  },

  error(
    res: Response,
    message: string = 'Error',
    status: number = 500,
    data: any = null,
  ) {
    return res.status(status).json({
      status: 'error',
      message,
      code: status,
      ...(data ? { data } : {}),
    });
  },
};
