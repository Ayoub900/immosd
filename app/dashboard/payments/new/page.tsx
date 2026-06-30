'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav';
import Link from 'next/link';
import { ArrowLeft, Search, Check } from 'lucide-react';

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
        floorNum: number;
        propertyType: 'APARTMENT' | 'COMMERCIAL_STORE';
    };
    paymentSummary?: {
        totalPaid: number;
        remaining: number;
    };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function NewPaymentPage() {
    const router = useRouter();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedPurchaseId, setSelectedPurchaseId] = useState('');
    const [formData, setFormData] = useState({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
    });

    const observerTarget = useRef<HTMLDivElement>(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset purchases and reload whenever the (debounced) search changes. This also
    // covers the initial load, since debouncedSearch starts as '' and runs on mount.
    useEffect(() => {
        setPurchases([]);
        setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
        fetchPurchases(1, true);
    }, [debouncedSearch]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingMore && pagination.page < pagination.totalPages) {
                    loadMorePurchases();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [loadingMore, pagination]);

    async function fetchPurchases(page: number, reset: boolean = false) {
        try {
            if (reset) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                status: 'IN_PROGRESS',
            });

            if (debouncedSearch) {
                params.set('search', debouncedSearch);
            }

            const res = await fetch(`/api/purchases?${params.toString()}`);
            if (!res.ok) throw new Error();
            const data = await res.json();

            setPurchases(prev => reset ? data.purchases : [...prev, ...data.purchases]);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setInitialLoading(false);
        }
    }

    async function loadMorePurchases() {
        const nextPage = pagination.page + 1;
        await fetchPurchases(nextPage, false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedPurchaseId || !formData.amount) {
            alert('يرجى اختيار عملية الشراء وإدخال المبلغ');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    purchaseId: selectedPurchaseId,
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

    const selectedPurchase = purchases.find(p => p.id === selectedPurchaseId);

    if (initialLoading) {
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Purchase Selection */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">اختيار عملية الشراء</h2>

                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="البحث باسم العميل..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {searchQuery && (
                            <p className="text-sm text-gray-600 mb-3">
                                عدد النتائج: {pagination.total}
                            </p>
                        )}

                        {/* Purchase List with Infinite Scroll */}
                        <div className="border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto">
                            {loading && purchases.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                                    <p className="text-sm text-gray-500 mt-2">جاري البحث...</p>
                                </div>
                            ) : purchases.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد عمليات شراء قيد التنفيذ'}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {purchases.map((purchase) => (
                                        <button
                                            key={purchase.id}
                                            type="button"
                                            onClick={() => setSelectedPurchaseId(purchase.id)}
                                            className={`w-full p-4 text-right hover:bg-blue-50 transition-colors ${selectedPurchaseId === purchase.id ? 'bg-blue-100 border-r-4 border-blue-600' : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-gray-900 truncate">
                                                            {purchase.client.fullName}
                                                        </h3>
                                                        {selectedPurchaseId === purchase.id && (
                                                            <Check size={18} className="text-blue-600 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    {purchase.client.cin && (
                                                        <p className="text-sm text-gray-600">
                                                            رقم البطاقة: {purchase.client.cin}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-gray-600">
                                                        الشقة: {purchase.flat.referenceNum}
                                                    </p>
                                                    <p className="text-sm font-semibold text-blue-600 mt-1">
                                                        السعر: {purchase.agreedPrice.toLocaleString('ar-MA')} د.م
                                                    </p>
                                                    {purchase.paymentSummary && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            مدفوع: {purchase.paymentSummary.totalPaid.toLocaleString('ar-MA')} د.م
                                                            {' • '}
                                                            متبقي: {purchase.paymentSummary.remaining.toLocaleString('ar-MA')} د.م
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}

                                    {/* Loading indicator */}
                                    {loadingMore && (
                                        <div className="p-4 text-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                                            <p className="text-sm text-gray-500 mt-2">جاري تحميل المزيد...</p>
                                        </div>
                                    )}

                                    {/* Intersection observer target */}
                                    <div ref={observerTarget} className="h-2"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Form */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">تفاصيل الدفعة</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Selected Purchase Info */}
                            {selectedPurchase ? (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h3 className="font-bold text-blue-900 mb-2">عملية الشراء المحددة</h3>
                                    <div className="text-sm text-blue-800 space-y-1">
                                        <p><strong>العميل:</strong> {selectedPurchase.client.fullName}</p>
                                        <p><strong>رقم المرجع:</strong> {selectedPurchase.flat.referenceNum}</p>
                                        <p><strong>الطابق:</strong> {selectedPurchase.flat.floorNum === 1 ? 'الطابق الأرضي' : `الطابق ${selectedPurchase.flat.floorNum - 1}`}</p>
                                        <p><strong>النوع:</strong> {selectedPurchase.flat.propertyType === 'COMMERCIAL_STORE' ? 'محل تجاري' : 'شقة'}</p>
                                        <p><strong>السعر المتفق عليه:</strong> {selectedPurchase.agreedPrice.toLocaleString('ar-MA')} د.م</p>
                                        {selectedPurchase.paymentSummary && (
                                            <>
                                                <p><strong>المبلغ المدفوع:</strong> <span className="text-green-700">{selectedPurchase.paymentSummary.totalPaid.toLocaleString('ar-MA')} د.م</span></p>
                                                <p><strong>المتبقي:</strong> <span className="text-orange-700 font-bold">{selectedPurchase.paymentSummary.remaining.toLocaleString('ar-MA')} د.م</span></p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center text-gray-500">
                                    يرجى اختيار عملية شراء من القائمة
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
                                    disabled={submitting || !selectedPurchaseId}
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
                </div>
            </main>
        </div>
    );
}
