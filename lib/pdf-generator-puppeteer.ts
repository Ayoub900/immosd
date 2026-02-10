/**
 * HTML-to-PDF Receipt Generator using Puppeteer
 * Uses browser rendering for perfect Arabic text support
 */

import puppeteer from 'puppeteer';
import { ReceiptData } from './pdf-generator';
import path from 'path';
import fs from 'fs';

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
    if (floorNum === 1) return 'الأرضي';
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

export async function generatePaymentReceiptPuppeteer(data: ReceiptData): Promise<Buffer> {
    const SELLER = {
        name: 'السيد صلاح ادروش الحامل لبطاقة التعريف الوطنية',
        cin: 'QB35297',
        address: 'الساكن في شمس المدينة الرقم 1288 الطابق الأول ببنسليمان',
    };

    const { floor } = parseFlatReference(data.flatReference);
    const floorArabic = floorToArabic(floor);

    // Load logo and convert to base64
    const logoPath = path.resolve(process.cwd(), 'public/logo_wide.png');
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    const logoSrc = `data:image/png;base64,${logoBase64}`;

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
    <style>
        @page { margin: 0; size: A4; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Tajawal', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            direction: rtl;
            background: white;
        }
        .page {
            width: 210mm;
            height: 297mm;
            padding: 0;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: white;
            padding: 20px 35px;
            border-bottom: 1px solid #e2e8f0;
            text-align: center;
        }
        .logo {
            height: 50px;
        }
        .content {
            flex: 1;
            padding: 20px 35px 30px;
        }
        .receipt-number {
            font-size: 10pt;
            color: #64748b;
            margin-bottom: 12px;
            text-align: right;
        }
        .title {
            font-size: 20pt;
            font-weight: bold;
            text-align: center;
            color: #1e40af;
            text-decoration: underline;
            margin-bottom: 18px;
        }
        .rtl-text {
            text-align: right;
            margin-bottom: 5px;
            color: #334155;
        }
        .amount-box {
            background: #dbeafe;
            padding: 10px;
            border-radius: 6px;
            text-align: center;
            margin: 12px 0 15px;
            color: #1e40af;
        }
        .amount-label {
            font-size: 16pt;
        }
        .amount-value {
            font-size: 20pt;
            font-weight: bold;
            margin-top: 4px;
        }
        .note-box {
            background: #dbeafe;
            padding: 10px;
            border-radius: 6px;
            margin: 15px 0;
        }
        .note-text {
            color: #1e40af;
            font-size: 12pt;
            font-weight: bold;
            text-align: right;
        }
        .signature {
            text-align: right;
            margin-top: 30px;
            font-size: 11pt;
            color: #475569;
        }
        .footer {
            background: #1e40af;
            padding: 15px 35px;
            color: #dbeafe;
            text-align: center;
        }
        .footer-text {
            font-size: 9pt;
            margin-bottom: 2px;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <img src="${logoSrc}" alt="Logo" class="logo">
        </div>
        
        <div class="content">
            <div class="receipt-number">رقم الإيصال: ${data.receiptNum}</div>
            
            <div class="title">اشهاد بتوصيل</div>
            
            <div class="rtl-text">انا الموقع ادناه</div>
            <div class="rtl-text">${SELLER.name} ${SELLER.cin} و الساكن في شمس المدينة الرقم 1288 الطابق الأول ببنسليمان.</div>
            
            <div class="rtl-text">اشهد و اصرح بكامل ادراكي و تمييزي و تحت جميع الضمانات القضائية و القانونية الجاري بها العمل أنني توصلت من</div>
            
            <div class="rtl-text">السيد ${data.clientName}${data.clientCin ? ` الحامل لبطاقة التعريف الوطنية رقم ${data.clientCin}` : ''}${data.clientAddress ? ` و الساكن في ${data.clientAddress}` : ''}.</div>
            
            <div class="amount-box">
                <div class="amount-label">بمبلغ قدره</div>
                <div class="amount-value">${data.paymentAmount.toLocaleString('ar-MA')} درهم</div>
            </div>
            
            <div class="rtl-text">كدفعة من مجموع المبلغ المتفق عليه في الأرض و البناء</div>
            
            <div class="rtl-text">${data.agreedPrice.toLocaleString('ar-MA')} درهم من اجل بناء ${propertyTypeToArabic(data.propertyType)} بالطابق ${floorArabic} بالبقعة الأرضية الحاملة لرقم ${data.buildingPlotNumber || '................'} دات المساحة ${data.buildingArea || '.......................'} متر مربع و المتواجدة في ${data.projectLocation || '......................................'}.</div>
            
            <div class="rtl-text">خارجة الأجزاء المشتركة وواجب الموثق والأوراق المتعلقة .......باستخلاص رخصة البناء</div>
            
            <div class="rtl-text">.وبه احرر هذا الاشهاد وامضي عليه تحت كامل مسؤوليتي</div>
            
            <div class="note-box">
                <div class="note-text">ملاحظة: واجب الموثق والأوراق والأجزاء المشتركة خارج الثمن المتفق عليه في الأرض و البناء.</div>
            </div>
            
            <div class="signature">وحرر بتاريخ:</div>
        </div>
        
        <div class="footer">
            <div class="footer-text">تم إصدار هذا الإيصال تلقائياً من نظام إمو إسدي</div>
            <div class="footer-text">immobiliercharkaoui@gmail.com | +212 661-482166 :للاستفسارات</div>
            <div class="footer-text">immobiliercharkaoui.com</div>
        </div>
    </div>
</body>
</html>
    `;

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
    });

    await browser.close();

    return Buffer.from(pdf);
}
