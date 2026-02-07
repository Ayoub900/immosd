/**
 * Arabic PDF Receipt Generator using React-PDF
 * Generates formal Arabic acknowledgment receipts for payments
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { renderToStream } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
// @ts-ignore - fontkit doesn't have types
import fontkit from '@react-pdf/fontkit';

// Register fontkit to enable custom font loading
Font.registerEmojiSource({ format: 'png', url: 'https://twemoji.maxcdn.com/2/72x72/' });

export interface ReceiptData {
    receiptNum: string;
    clientName: string;
    clientCin?: string;
    clientAddress?: string;
    flatReference: string;
    propertyType: 'APARTMENT' | 'COMMERCIAL_STORE'; // Property type
    buildingName?: string;
    buildingAddress?: string;
    buildingPlotNumber?: string;
    buildingArea?: number; // Building area in square meters
    projectLocation?: string; // Project location/name
    paymentAmount: number;
    paymentDate: Date;
    totalPaid: number;
    remaining: number;
    agreedPrice: number;
}

// Helper to parse flat reference (e.g., "B1-F3-2" => {building: 1, floor: 3, flat: 2})
function parseFlatReference(ref: string): { floor: string; flat: string } {
    const parts = ref.split('-');
    if (parts.length >= 3) {
        const floor = parts[1].replace('F', ''); // F3 => 3
        const flat = parts[2]; // 2
        return { floor, flat };
    }
    return { floor: '؟', flat: '؟' };
}

// Convert floor number to Arabic ordinal
// Floor 1 = Ground floor (الطابق الأرضي)
// Floor 2 = First floor (الطابق الأول), etc.
function floorToArabic(num: string): string {
    const floorNum = parseInt(num);

    // Floor 1 is ground floor
    if (floorNum === 1) {
        return 'الأرضي';
    }

    // All other floors are shifted down by 1
    const ordinals: { [key: string]: string } = {
        '1': 'الأول',
        '2': 'الثاني',
        '3': 'الثالث',
        '4': 'الرابع',
        '5': 'الخامس',
        '6': 'السادس',
        '7': 'السابع',
        '8': 'الثامن',
        '9': 'التاسع',
        '10': 'العاشر',
    };

    const adjustedFloor = (floorNum - 1).toString();
    return ordinals[adjustedFloor] || `الطابق ${adjustedFloor}`;
}

// Convert property type to Arabic
function propertyTypeToArabic(type: 'APARTMENT' | 'COMMERCIAL_STORE'): string {
    return type === 'APARTMENT' ? 'شقة' : 'محل تجاري';
}



// Register fontkit to enable custom font loading
Font.registerHyphenationCallback((word) => [word]);

// Register local Arabic font - Tajawal with absolute path
Font.register({
    family: 'Tajawal',
    src: path.resolve(process.cwd(), 'public/fonts/Tajawal-Regular.ttf'),
});

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: 'Tajawal',
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 20,
        paddingHorizontal: 35,
        borderBottom: '1px solid #e2e8f0',
    },
    logo: {
        height: 50,
        objectFit: 'contain',
    },
    content: {
        flex: 1,
        padding: 30,
        paddingTop: 20,
        fontWeight: 700,
    },
    title: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 18,
        fontWeight: 'ultrabold',
        color: '#1e40af',
        textDecoration: 'underline',
    },
    rtlText: {
        textAlign: 'right',
        direction: 'rtl',
        marginBottom: 5,
        lineHeight: 1.5,
        color: '#334155',
    },
    amount: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: 'bold',
        backgroundColor: '#dbeafe',
        padding: 10,
        borderRadius: 6,
        marginTop: 12,
        marginBottom: 15,
        direction: 'rtl',
        color: '#1e40af',
    },
    footer: {
        backgroundColor: '#1e40af',
        padding: 15,
        paddingHorizontal: 35,
    },
    footerText: {
        fontSize: 9,
        textAlign: 'center',
        color: '#dbeafe',
        marginBottom: 2,
    },
    signature: {
        textAlign: 'right',
        direction: 'rtl',
        marginTop: 30,
        fontSize: 11,
        color: '#475569',
    },
    receiptNumber: {
        fontSize: 10,
        textAlign: 'right',
        direction: 'rtl',
        color: '#64748b',
        marginBottom: 12,
    },
});

const ReceiptDocument: React.FC<{ data: ReceiptData }> = ({ data }) => {
    const SELLER = {
        name: 'السيد صلاح ادروش الحامل لبطاقة التعريف الوطنية',
        cin: 'QB35297',
        address: 'الساكن في شمس المدينة الرقم 1288 الطابق الأول ببنسليمان',
        company: 'السيد عبد الاله المقابل لبطاقة التعريف الوطنية',
        companyId: '1504005',
        companyAddress: 'الساكن بحي الهدى سوق السبت أولاد النمة'
    };

    const { floor, flat } = parseFlatReference(data.flatReference);
    const floorArabic = floorToArabic(floor);
    const currentDate = new Date().toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' });

    // Load logo as base64 data URI for better PDF compatibility
    const logoPath = path.resolve(process.cwd(), 'public/logo_wide.png');
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    const logoSrc = `data:image/png;base64,${logoBase64}`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Image src={logoSrc} style={styles.logo} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Receipt Number */}
                    <Text style={styles.receiptNumber}>رقم الإيصال: {data.receiptNum}</Text>

                    {/* Title */}
                    <Text style={styles.title}>اشهاد بتوصيل</Text>

                    {/* Introduction */}
                    <Text style={styles.rtlText}>انا الموقع ادناه</Text>

                    {/* Seller information */}
                    <Text style={styles.rtlText}>{SELLER.name} {SELLER.cin} و الساكن في شمس المدينة الرقم 1288 الطابق الأول ببنسليمان.</Text>

                    {/* Acknowledgment */}
                    <Text style={styles.rtlText}>اشهد و اصرح بكامل ادراكي و تمييزي و تحت جميع الضمانات القضائية و القانونية الجاري بها العمل أنني توصلت من</Text>

                    {/* Buyer information */}
                    <Text style={styles.rtlText}>
                        السيد {data.clientName} {data.clientCin ? `الحامل لبطاقة التعريف الوطنية رقم ${data.clientCin}` : ''}{data.clientAddress ? ` و الساكن في ${data.clientAddress}` : ''}.
                    </Text>

                    {/* Amount */}
                    <View style={styles.amount}>
                        <Text style={{ textAlign: 'center', direction: 'rtl' }}>بمبلغ قدره</Text>
                        <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'ultrabold', marginTop: 4, direction: 'ltr' }}>
                            درهم {data.paymentAmount.toLocaleString('ar-MA')}
                        </Text>
                    </View>

                    {/* Payment purpose */}
                    <Text style={styles.rtlText}>كدفعة من مجموع المبلغ المتفق عليه في الأرض و البناء</Text>

                    {/* Property details */}
                    <Text style={styles.rtlText}>
                        {data.agreedPrice.toLocaleString('ar-MA')} درهم من اجل بناء {propertyTypeToArabic(data.propertyType)} بالطابق {floorArabic} بالبقعة الأرضية الحاملة لرقم {data.buildingPlotNumber || '................'} دات المساحة {data.buildingArea || '.......................'} متر مربع و المتواجدة في {data.projectLocation || '......................................'}.
                    </Text>

                    {/* Shared fees clause */}
                    <Text style={styles.rtlText}>خارجة الأجزاء المشتركة وواجب الموثق والأوراق المتعلقة .......باستخلاص رخصة البناء</Text>

                    {/* Declaration */}
                    <Text style={styles.rtlText}>
                        .وبه احرر هذا الاشهاد وامضي عليه تحت كامل مسؤوليتي
                    </Text>

                    {/* Note */}
                    <View style={{ backgroundColor: '#dbeafe', padding: 10, borderRadius: 6, marginTop: 15, marginBottom: 15 }}>
                        <Text style={{ textAlign: 'right', direction: 'rtl', color: '#1e40af', fontSize: 12, fontWeight: 'bold' }}>
                            ملاحظة؛ واجب الموثق والأوراق والأجزاء المشتركة خارج الثمن المثفق عليه في الأرض و البناء.
                        </Text>
                    </View>

                    {/* Signature */}
                    <Text style={styles.signature}>وحرر بتاريخ: </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>تم إصدار هذا الإيصال تلقائياً من نظام إمو إسدي</Text>
                    <Text style={styles.footerText}>immobiliercharkaoui@gmai.com | +212 661-482166 :للاستفسارات</Text>
                    <Text style={styles.footerText}>immobiliercharkaoui.com</Text>
                </View>
            </Page>
        </Document>
    );
};

export async function generatePaymentReceipt(data: ReceiptData): Promise<NodeJS.ReadableStream> {
    const doc = <ReceiptDocument data={data} />;
    return await renderToStream(doc);
}

export async function generatePaymentReceiptBuffer(data: ReceiptData): Promise<Buffer> {
    const stream = await generatePaymentReceipt(data);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

export async function generatePaymentReceiptDataUrl(data: ReceiptData): Promise<string> {
    const buffer = await generatePaymentReceiptBuffer(data);
    return `data:application/pdf;base64,${buffer.toString('base64')}`;
}
