import prisma from '@/lib/prisma';

interface BaseLogParams {
    userId: string;
    userName: string;
    entityType: string;
    entityId: string;
    entityName?: string;
    ipAddress?: string;
    userAgent?: string;
}

interface CreateUpdateDeleteLogParams extends BaseLogParams {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
    changes?: {
        before?: any;
        after?: any;
    };
}

interface ErrorLogParams extends BaseLogParams {
    action: 'ERROR';
    errorMessage: string;
    errorStack?: string;
}

interface PdfLogParams extends BaseLogParams {
    action: 'PDF_DOWNLOAD' | 'PDF_ERROR';
    pdfMetadata?: {
        receiptNum: string;
        fileSize?: number;
        generationTime?: number;
        error?: string;
    };
}

type LogParams = CreateUpdateDeleteLogParams | ErrorLogParams | PdfLogParams;

/**
 * Create an audit log entry
 * Silently fails if logging encounters an error to prevent breaking the application
 */
export async function createAuditLog(params: LogParams) {
    try {
        await prisma.auditLog.create({
            data: params as any,
        });
    } catch (error) {
        // Silent fail - don't break application if logging fails
        console.error('Audit log error:', error);
    }
}

/**
 * Log an error with stack trace
 */
export async function logError(params: {
    userId?: string;
    userName?: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    errorMessage: string;
    errorStack?: string;
    ipAddress?: string;
    userAgent?: string;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId || 'system',
                userName: params.userName || 'System',
                action: 'ERROR',
                entityType: params.entityType,
                entityId: params.entityId || 'N/A',
                entityName: params.entityName,
                errorMessage: params.errorMessage,
                errorStack: params.errorStack,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });
    } catch (error) {
        console.error('Error logging failed:', error);
    }
}

/**
 * Log PDF download or generation
 */
export async function logPdfDownload(params: {
    userId: string;
    userName: string;
    receiptNum: string;
    success: boolean;
    fileSize?: number;
    generationTime?: number;
    error?: string;
    ipAddress?: string;
    userAgent?: string;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId,
                userName: params.userName,
                action: params.success ? 'PDF_DOWNLOAD' : 'PDF_ERROR',
                entityType: 'payment',
                entityId: params.receiptNum,
                entityName: `Receipt ${params.receiptNum}`,
                pdfMetadata: {
                    receiptNum: params.receiptNum,
                    fileSize: params.fileSize,
                    generationTime: params.generationTime,
                    error: params.error,
                },
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });
    } catch (error) {
        console.error('PDF logging failed:', error);
    }
}

/**
 * Extract IP address and user agent from request headers
 */
export function getRequestMetadata(request: Request) {
    const ipAddress = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return { ipAddress, userAgent };
}
