import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  if (err.name === 'Error' && 'code' in err) {
    const mysqlError = err as any;
    if (mysqlError.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Dữ liệu đã tồn tại trong hệ thống',
      });
    }
    if (mysqlError.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'Tham chiếu không hợp lệ',
      });
    }
  }

  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    ...(err as any).code && { code: (err as any).code },
    ...(err as any).sqlMessage && { sqlMessage: (err as any).sqlMessage },
  });
  
  // Return more detailed error in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    success: false,
    message: isDevelopment 
      ? `Lỗi server: ${err.message || 'Lỗi không xác định'}` 
      : 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
    ...(isDevelopment && { 
      error: err.message, 
      stack: err.stack,
      ...(err as any).code && { code: (err as any).code },
      ...(err as any).sqlMessage && { sqlMessage: (err as any).sqlMessage },
    }),
  });
};

