import { NextResponse } from 'next/server';

// DEPRECATED: Split/merge functionality has been removed
// Use /api/flats/bulk-create to create 1-4 flats per floor instead
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    return NextResponse.json(
        { error: 'تم إلغاء وظيفة تقسيم الشقق. استخدم إنشاء الشقق الجديد (1-4 لكل طابق)' },
        { status: 410 } // 410 Gone
    );
}
