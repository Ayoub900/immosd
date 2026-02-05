'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';

interface Payment {
    id: string;
    purchaseId: string;
    amount: number;
    paymentDate: string;
    receiptNum: string;
    purchase: {
        client: {
            fullName: string;
        };
        flat: {
            referenceNum: string;
        };
    };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        fetchPayments();
    }, [pagination.page]);

    async function fetchPayments() {
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (searchTerm) params.set('search', searchTerm);
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);
            if (amountMin) params.set('amountMin', amountMin);
            if (amountMax) params.set('amountMax', amountMax);

            const res = await fetch(`/api/payments?${params.toString()}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setPayments(data.payments || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
            setSearching(false);
        }
    }

    async function handleSearch() {
        setSearching(true);
        setPagination(prev => ({ ...prev, page: 1 }));
        await fetchPayments();
    }

    async function clearFilters() {
        setSearchTerm('');
        setDateFrom('');
        setDateTo('');
        setAmountMin('');
        setAmountMax('');
        setSearching(true);
        setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
        await fetchPayments();
    }

    async function downloadReceipt(paymentId: string, receiptNum: string) {
        setDownloading(paymentId);
        try {
            const res = await fetch(`/api/payments/${paymentId}/receipt`);
            if (!res.ok) throw new Error();

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${receiptNum}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('فشل في تحميل الإيصال');
        } finally {
            setDownloading(null);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <DashboardNav currentPage="payments" />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav currentPage="payments" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">الدفعات</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                إجمالي الدفعات: {pagination.total}
                            </p>
                        </div>
                        <Link
                            href="/dashboard/payments/new"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                        >
                            <span className="text-xl">+</span>
                            إضافة دفعة
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="بحث برقم الإيصال، اسم العميل، أو رقم الشقة..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
                            </button>
                            <button
                                onClick={handleSearch}
                                disabled={searching}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
                            >
                                {searching ? '...' : 'بحث'}
                            </button>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ الأدنى</label>
                                    <input
                                        type="number"
                                        value={amountMin}
                                        onChange={(e) => setAmountMin(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ الأقصى</label>
                                    <input
                                        type="number"
                                        value={amountMax}
                                        onChange={(e) => setAmountMax(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        مسح جميع الفلاتر
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    رقم الإيصال
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    العميل
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الشقة
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    المبلغ
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    التاريخ
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    إجراءات
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm || dateFrom || dateTo || amountMin || amountMax ? 'لا توجد نتائج للبحث' : 'لا توجد دفعات بعد'}
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {payment.receiptNum}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {payment.purchase.client.fullName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {payment.purchase.flat.referenceNum}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-blue-600">
                                                {payment.amount.toLocaleString('ar-MA')} د.م
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {new Date(payment.paymentDate).toLocaleDateString('ar-MA')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => downloadReceipt(payment.id, payment.receiptNum)}
                                                disabled={downloading === payment.id}
                                                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                            >
                                                {downloading === payment.id ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                        جاري التحميل...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download size={14} />
                                                        تحميل الإيصال
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm px-6 py-4">
                        <div className="text-sm text-gray-700">
                            عرض <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> إلى{' '}
                            <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> من{' '}
                            <span className="font-medium">{pagination.total}</span> نتيجة
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <ChevronRight size={16} />
                                السابق
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                                    .map((p, idx, arr) => (
                                        <div key={p}>
                                            {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2">...</span>}
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                                                className={`px-4 py-2 rounded-lg ${p === pagination.page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                                            >
                                                {p}
                                            </button>
                                        </div>
                                    ))}
                            </div>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                التالي
                                <ChevronLeft size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
