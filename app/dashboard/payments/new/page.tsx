'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

interface Purchase {
    id: string;
    agreedPrice: number;
    client: {
        id: string;
        fullName: string;
        cin?: string;
    };
    flat: {
        id: string;
        referenceNum: string;
    };
}

export default function NewPaymentPage() {
    const router = useRouter();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        purchaseId: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchPurchases();
    }, []);

    async function fetchPurchases() {
        try {
            const res = await fetch('/api/purchases');
            if (!res.ok) throw new Error();
            const data = await res.json();
            // Only show in-progress purchases
            const inProgress = data.purchases?.filter((p: any) => p.status === 'IN_PROGRESS') || [];
            setPurchases(inProgress);
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.purchaseId || !formData.amount) {
            alert('يرجى ملء جميع الحقول');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    purchaseId: formData.purchaseId,
                    amount: parseFloat(formData.amount),
                    paymentDate: formData.paymentDate,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'فشل في إضافة الدفعة');
            }

            alert('تمت إضافة الدفعة بنجاح');
            router.push('/dashboard/payments');
        } catch (error: any) {
            alert(error.message || 'فشل في إضافة الدفعة');
        } finally {
            setSubmitting(false);
        }
    }

    // Filter purchases based on search query
    const filteredPurchases = purchases.filter(purchase => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            purchase.client.fullName?.toLowerCase().includes(query) ||
            purchase.client.cin?.toLowerCase().includes(query) ||
            purchase.flat.referenceNum?.toLowerCase().includes(query)
        );
    });

    const selectedPurchase = filteredPurchases.find(p => p.id === formData.purchaseId);

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
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/payments"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">إضافة دفعة جديدة</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="البحث باسم العميل، رقم البطاقة، أو رقم الشقة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute left-3 top-2.5 text-sm text-blue-600 hover:text-blue-700"
                            >
                                مسح
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="mt-2 text-sm text-gray-600">
                            عدد النتائج: {filteredPurchases.length}
                        </p>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Purchase Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                عملية الشراء *
                            </label>
                            <select
                                value={formData.purchaseId}
                                onChange={(e) => setFormData({ ...formData, purchaseId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">اختر عملية الشراء</option>
                                {filteredPurchases.map((purchase) => (
                                    <option key={purchase.id} value={purchase.id}>
                                        {purchase.client.fullName} {purchase.client.cin ? `(${purchase.client.cin})` : ''} - {purchase.flat.referenceNum} - {purchase.agreedPrice.toLocaleString('ar-MA')} د.م
                                    </option>
                                ))}
                            </select>
                            {filteredPurchases.length === 0 && (
                                <p className="mt-2 text-sm text-red-600">
                                    {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد عمليات شراء قيد التنفيذ'}
                                </p>
                            )}
                        </div>

                        {/* Purchase Info */}
                        {selectedPurchase && (
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h3 className="font-bold text-blue-900 mb-2">تفاصيل الشراء</h3>
                                <div className="text-sm text-blue-800 space-y-1">
                                    <p><strong>العميل:</strong> {selectedPurchase.client.fullName}</p>
                                    <p><strong>الشقة:</strong> {selectedPurchase.flat.referenceNum}</p>
                                    <p><strong>السعر المتفق عليه:</strong> {selectedPurchase.agreedPrice.toLocaleString('ar-MA')} د.م</p>
                                </div>
                            </div>
                        )}

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                المبلغ (د.م) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {/* Payment Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                تاريخ الدفع *
                            </label>
                            <input
                                type="date"
                                value={formData.paymentDate}
                                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={submitting || purchases.length === 0}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                {submitting ? 'جاري الإضافة...' : 'إضافة الدفعة'}
                            </button>
                            <Link
                                href="/dashboard/payments"
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition-colors text-center"
                            >
                                إلغاء
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
