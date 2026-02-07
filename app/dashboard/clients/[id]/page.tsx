'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { ArrowRight, Edit, Phone, MapPin, CreditCard, Plus, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import DashboardNav from '@/components/DashboardNav';

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClient();
    }, [id]);

    async function fetchClient() {
        try {
            const res = await fetch(`/api/clients/${id}`);
            const data = await res.json();
            setClient(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600">العميل غير موجود</p>
                    <Link href="/dashboard/clients" className="text-blue-600 hover:underline mt-4 inline-block">
                        العودة للعملاء
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav currentPage="clients" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/clients" className="text-gray-600 hover:text-gray-900">
                                <ArrowRight size={24} />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{client.fullName}</h1>
                                <p className="mt-1 text-sm text-gray-600">تفاصيل العميل</p>
                            </div>
                        </div>
                        <Link
                            href={`/dashboard/clients/${id}/edit`}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            <Edit size={18} />
                            تعديل
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Client Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold mb-6">معلومات العميل</h2>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-gray-700">
                                    <Phone size={20} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">رقم الهاتف</p>
                                        <p className="font-medium" dir="ltr">{client.phone}</p>
                                    </div>
                                </div>

                                {client.cin && (
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <CreditCard size={20} className="text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">رقم البطاقة الوطنية</p>
                                            <p className="font-medium">{client.cin}</p>
                                        </div>
                                    </div>
                                )}

                                {client.address && (
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <MapPin size={20} className="text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">العنوان</p>
                                            <p className="font-medium">{client.address}</p>
                                        </div>
                                    </div>
                                )}

                                {client.fullNameFr && (
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-5 h-5 flex items-center justify-center text-gray-400 font-bold text-xs">FR</div>
                                        <div>
                                            <p className="text-xs text-gray-500">Nom complet (FR)</p>
                                            <p className="font-medium" dir="ltr">{client.fullNameFr}</p>
                                        </div>
                                    </div>
                                )}

                                {client.addressFr && (
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <MapPin size={20} className="text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Adresse (FR)</p>
                                            <p className="font-medium" dir="ltr">{client.addressFr}</p>
                                        </div>
                                    </div>
                                )}

                                {client.notes && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 mb-2">ملاحظات</p>
                                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{client.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Purchases */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">المشتريات ({client.purchases?.length || 0})</h2>
                                <Link
                                    href={`/dashboard/purchases/new?clientId=${id}`}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm"
                                >
                                    <Plus size={16} />
                                    بيع شقة جديدة
                                </Link>
                            </div>

                            {!client.purchases || client.purchases.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                    <p className="text-gray-600 mb-4">لا توجد مشتريات بعد</p>
                                    <Link
                                        href={`/dashboard/purchases/new?clientId=${id}`}
                                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                                    >
                                        بيع شقة لهذا العميل
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {client.purchases.map((purchase: any) => (
                                        <div key={purchase.id} className="border border-gray-200 rounded-lg p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        الشقة {purchase.flat.referenceNum}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        الطابق {purchase.flat.floorNum} - {purchase.flat.flatType === 'FULL' ? 'كاملة' : purchase.flat.flatType === 'HALF_RIGHT' ? 'نصف يمين' : 'نصف يسار'}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${purchase.status === 'COMPLETED'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {purchase.status === 'COMPLETED' ? 'مكتملة' : 'قيد الدفع'}
                                                </span>
                                            </div>

                                            {/* Payment Summary */}
                                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">السعر المتفق عليه</p>
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {purchase.agreedPrice.toLocaleString('ar-MA')} درهم
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">المبلغ المدفوع</p>
                                                        <p className="text-lg font-bold text-green-600">
                                                            {purchase.paymentSummary?.totalPaid.toLocaleString('ar-MA') || 0} درهم
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">المتبقي</p>
                                                        <p className="text-lg font-bold text-orange-600">
                                                            {purchase.paymentSummary?.remaining.toLocaleString('ar-MA') || purchase.agreedPrice.toLocaleString('ar-MA')} درهم
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payments List */}
                                            {purchase.payments && purchase.payments.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-gray-700 mb-3">سجل الدفعات:</p>
                                                    {purchase.payments.map((payment: any) => (
                                                        <div key={payment.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900">
                                                                    {payment.amount.toLocaleString('ar-MA')} درهم
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {format(new Date(payment.paymentDate), 'dd/MM/yyyy')} - {payment.receiptNum}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {/* {payment.receiptUrl && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const link = document.createElement('a');
                                                                            link.href = payment.receiptUrl;
                                                                            link.download = `${payment.receiptNum}.pdf`;
                                                                            link.click();
                                                                        }}
                                                                        className="text-blue-600 hover:text-blue-700"
                                                                        title="تحميل التوصيل"
                                                                    >
                                                                        <Download size={18} />
                                                                    </button>
                                                                )} */}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
