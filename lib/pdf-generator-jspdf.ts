/**
 * Arabic PDF Receipt Generator using jsPDF
 * Alternative implementation with better Arabic text support
 */

import jsPDF from 'jspdf';
import { ReceiptData } from './pdf-generator';

// Helper to parse flat reference
function parseFlatReference(ref: string): { floor: string; flat: string } {
    const parts = ref.split('-');
    if (parts.length >= 3) {
        const floor = parts[1].replace('F', '');
        const flat = parts[2];
        return { floor, flat };
    }
    return { floor: '؟', flat: '؟' };
}

// Convert floor number to Arabic ordinal
function floorToArabic(num: string): string {
    const floorNum = parseInt(num);
    if (floorNum === 1) {
        return 'الأرضي';
    }
    const ordinals: { [key: string]: string } = {
        '1': 'الأول', '2': 'الثاني', '3': 'الثالث', '4': 'الرابع',
        '5': 'الخامس', '6': 'السادس', '7': 'السابع', '8': 'الثامن',
        '9': 'التاسع', '10': 'العاشر',
    };
    const adjustedFloor = (floorNum - 1).toString();
    return ordinals[adjustedFloor] || `الطابق ${adjustedFloor}`;
}

// Convert property type to Arabic
function propertyTypeToArabic(type: 'APARTMENT' | 'COMMERCIAL_STORE'): string {
    return type === 'APARTMENT' ? 'شقة' : 'محل تجاري';
}

export async function generatePaymentReceiptJsPDF(data: ReceiptData): Promise<Buffer> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const SELLER = {
        name: 'السيد صلاح ادروش الحامل لبطاقة التعريف الوطنية',
        cin: 'QB35297',
        address: 'الساكن في شمس المدينة الرقم 1288 الطابق الأول ببنسليمان',
    };

    const { floor } = parseFlatReference(data.flatReference);
    const floorArabic = floorToArabic(floor);

    // Set RTL for Arabic
    doc.setR2L(true);
    doc.setLanguage('ar');

    // Title
    doc.setFontSize(20);
    doc.text('اشهاد بتوصيل', 105, 30, { align: 'center' });

    // Receipt number
    doc.setFontSize(10);
    doc.text(`رقم الإيصال: ${data.receiptNum}`, 190, 50, { align: 'right' });

    let y = 60;
    doc.setFontSize(11);

    // Content
    doc.text('انا الموقع ادناه', 190, y, { align: 'right' });
    y += 7;

    doc.text(`${SELLER.name} ${SELLER.cin} و الساكن في شمس المدينة الرقم 1288 الطابق الأول ببنسليمان.`, 190, y, { align: 'right', maxWidth: 170 });
    y += 10;

    doc.text('اشهد و اصرح بكامل ادراكي و تمييزي و تحت جميع الضمانات القضائية', 190, y, { align: 'right', maxWidth: 170 });
    y += 7;
    doc.text('و القانونية الجاري بها العمل أنني توصلت من', 190, y, { align: 'right' });
    y += 10;

    // Buyer info
    const buyerText = `السيد ${data.clientName}${data.clientCin ? ` الحامل لبطاقة التعريف الوطنية رقم ${data.clientCin}` : ''}${data.clientAddress ? ` و الساكن في ${data.clientAddress}` : ''}.`;
    doc.text(buyerText, 190, y, { align: 'right', maxWidth: 170 });
    y += 15;

    // Amount box
    doc.setFillColor(219, 234, 254);
    doc.rect(30, y - 5, 150, 20, 'F');
    doc.setFontSize(16);
    doc.text('بمبلغ قدره', 105, y + 3, { align: 'center' });
    doc.setFontSize(20);
    doc.text(`${data.paymentAmount.toLocaleString('ar-MA')} درهم`, 105, y + 11, { align: 'center' });
    y += 25;

    // Payment purpose
    doc.setFontSize(11);
    doc.text('كدفعة من مجموع المبلغ المتفق عليه في الأرض و البناء', 190, y, { align: 'right' });
    y += 10;

    // Property details
    const propertyText = `${data.agreedPrice.toLocaleString('ar-MA')} درهم من اجل بناء ${propertyTypeToArabic(data.propertyType)} بالطابق ${floorArabic} بالبقعة الأرضية الحاملة لرقم ${data.buildingPlotNumber || '................'} دات المساحة ${data.buildingArea || '.......................'} متر مربع و المتواجدة في ${data.projectLocation || '......................................'}.`;
    doc.text(propertyText, 190, y, { align: 'right', maxWidth: 170 });
    y += 20;

    // Shared fees clause
    doc.text('خارجة الأجزاء المشتركة وواجب الموثق والأوراق المتعلقة .......باستخلاص رخصة البناء', 190, y, { align: 'right', maxWidth: 170 });
    y += 10;

    // Declaration
    doc.text('.وبه احرر هذا الاشهاد وامضي عليه تحت كامل مسؤوليتي', 190, y, { align: 'right' });
    y += 15;

    // Note box
    doc.setFillColor(219, 234, 254);
    doc.rect(30, y - 5, 150, 15, 'F');
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(12);
    doc.text('ملاحظة: واجب الموثق والأوراق والأجزاء المشتركة خارج الثمن المتفق عليه في الأرض و البناء.', 190, y + 3, { align: 'right', maxWidth: 140 });
    y += 20;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text('وحرر بتاريخ:', 190, y, { align: 'right' });

    // Footer
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 270, 210, 27, 'F');
    doc.setTextColor(219, 234, 254);
    doc.setFontSize(9);
    doc.text('تم إصدار هذا الإيصال تلقائياً من نظام إمو إسدي', 105, 278, { align: 'center' });
    doc.text('للاستفسارات: +212 661-482166 | immobiliercharkaoui@gmail.com', 105, 284, { align: 'center' });
    doc.text('immobiliercharkaoui.com', 105, 290, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
}
