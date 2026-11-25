// import {
//   ArgumentsHost,
//   Catch,
//   ExceptionFilter,
//   HttpException,
//   HttpStatus,
//   Logger,
//   UnauthorizedException,
// } from '@nestjs/common';

// import { Request, Response } from 'express';
// import { randomUUID } from 'node:crypto';
// import { Prisma } from '@prisma/client';

// // تعريف الهيكل الصارم والصحيح للرد الموحد (Type Safety)
// type ErrorResponse = {
//   success: false;
//   statusCode: number;
//   error: {
//     type: string;
//     message: string | string[];
//     traceId: string;
//   };
//   meta: {
//     path: string;
//     method: string;
//     timestamp: string;
//   };
// };

// @Catch()
// export class GlobalExceptionFilter implements ExceptionFilter {
//   // استخدام الـ Logger المدمج لطباعة احترافية ملونة مع تاريخ وثواني الحدوث
//   private readonly logger = new Logger(GlobalExceptionFilter.name);

//   catch(exception: unknown, host: ArgumentsHost): void {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const request = ctx.getRequest<Request>();

//     // جلب الـ Request ID لو قادم من سيرفر خارجي أو توليد بصمة فريدة (Trace ID) للخطأ
//     const traceId = this.getRequestId(request) ?? randomUUID();

//     let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
//     let message: string | string[] = 'Internal server error occurred.';
//     let errorType = 'InternalServerError';

//     // 1. معالجة أخطاء NestJS HTTP المعروفة والمقصودة في الكود
//     if (exception instanceof HttpException) {
//       statusCode = exception.getStatus();
//       const exceptionResponse = exception.getResponse();

//       const result = this.extractHttpExceptionData(
//         exception,
//         exceptionResponse,
//       );
//       message = result.message;
//       errorType = result.errorType;
//     }
//     // 2. معالجة أخطاء Prisma القياسية المعروفة (مثل القيود المكررة أو السجلات المفقودة)
//     else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
//       const result = this.handlePrismaKnownError(exception);
//       statusCode = result.statusCode;
//       message = result.message;
//       errorType = result.errorType;
//     }
//     // 3. معالجة أخطاء التحقق من صحة البيانات المرسلة لقاعدة البيانات بـ Prisma
//     else if (exception instanceof Prisma.PrismaClientValidationError) {
//       statusCode = HttpStatus.BAD_REQUEST;
//       message = 'Invalid database data operation pattern.';
//       errorType = 'DatabaseValidationError';
//     }
//     // 4. معالجة أخطاء اتصال وتصفير قاعدة البيانات الكارثية (Prisma Engine Failure)
//     else if (
//       exception instanceof Prisma.PrismaClientInitializationError ||
//       exception instanceof Prisma.PrismaClientRustPanicError
//     ) {
//       statusCode = HttpStatus.SERVICE_UNAVAILABLE;
//       message = 'Database service is temporarily unavailable.';
//       errorType = 'DatabaseConnectionError';
//     }
//     // 5. أخطاء لغة جافا سكريبت المجهولة (مثل التعامل مع حقول undefined) - حماية أمنية صارمة
//     else {
//       statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
//       message = 'A critical internal error occurred on our servers.';
//       errorType = 'CriticalInternalError';
//     }

//     // 🔥 هندسة الـ Logs: تلوين وتقسيم الأخطاء في الـ Terminal للمطورين
//     const logMessage = `[TraceID: ${traceId}] | Method: ${request.method} | Path: ${request.originalUrl ?? request.url} | Status: ${statusCode} | Type: ${errorType}`;

//     if (statusCode >= 500) {
//       // أخطاء السيرفر (500) تطبع باللون الأحمر الحاد مع الـ Stack Trace الكامل لمعرفة السطر المتسبب في الأزمة
//       this.logger.error(
//         logMessage,
//         exception instanceof Error ? exception.stack : String(exception),
//       );
//     } else {
//       // غلطات المستخدم (400 أو 404) تطبع كـ Warn أصفر خفيف لمنع زحمة وتضخم ملفات الـ Logs
//       this.logger.warn(logMessage);
//     }

//     // صياغة كائن الرد النهائي الموحد والثابت دائماً للـ Front-End
//     const errorResponse: ErrorResponse = {
//       success: false,
//       statusCode,
//       error: {
//         type: errorType,
//         message,
//         traceId,
//       },
//       meta: {
//         path: request.originalUrl ?? request.url,
//         method: request.method,
//         timestamp: new Date().toISOString(),
//       },
//     };

//     response.status(statusCode).json(errorResponse);
//   }

//   /**
//    * دالة مساعدة لتفتيش واستخراج رسائل الأخطاء القادمة من الـ Validation Pipes
//    */
//   private extractHttpExceptionData(
//     exception: HttpException,
//     response: string | object,
//   ): {
//     message: string | string[];
//     errorType: string;
//   } {
//     if (typeof response === 'string') {
//       return {
//         message: response,
//         errorType: exception.name,
//       };
//     }

//     if (response !== null && typeof response === 'object') {
//       const data = response as {
//         message?: string | string[];
//         error?: string;
//       };

//       return {
//         message: data.message ?? exception.message,
//         errorType: data.error ?? exception.name,
//       };
//     }

//     return {
//       message: exception.message,
//       errorType: exception.name,
//     };
//   }

//   /**
//    * دالة مساعدة لترجمة الأكواد السرية لـ Prisma وتحويلها لأخطاء مفهومة ومحمية أمنياً
//    */
//   private handlePrismaKnownError(
//     exception: Prisma.PrismaClientKnownRequestError,
//   ): {
//     statusCode: number;
//     message: string;
//     errorType: string;
//   } {
//     switch (exception.code) {
//       // قيد فريد مكرر (مثل تسجيل إيميل موجود مسبقاً)
//       case 'P2002':
//         return {
//           statusCode: HttpStatus.CONFLICT,
//           message: 'A record with this value already exists.',
//           errorType: 'DatabaseConflict',
//         };

//       // السجل المطلوب غير موجود في الجداول
//       case 'P2025':
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'The requested record was not found.',
//           errorType: 'DatabaseNotFound',
//         };

//       // انتهاك قيود الربط والعلاقات بين الجداول (Foreign Key Constraint)
//       case 'P2003':
//         return {
//           statusCode: HttpStatus.BAD_REQUEST,
//           message: 'The operation violates a related record constraint.',
//           errorType: 'DatabaseConstraintError',
//         };

//       default:
//         return {
//           statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//           message: 'A database error occurred.',
//           errorType: 'DatabaseError',
//         };
//     }
//   }

//   /**
//    * دالة استخراج الـ Request ID من الـ Headers لو كان متوفراً في البنية التحتية للمشروع
//    */
//   private getRequestId(request: Request): string | undefined {
//     const requestId = request.headers['x-request-id'];

//     if (Array.isArray(requestId)) {
//       return requestId[0];
//     }

//     return requestId;
//   }
// }
