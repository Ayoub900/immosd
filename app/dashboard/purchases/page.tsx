'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Home, User, DollarSign, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import PaginationComponent from '@/components/PaginationComponent';

interface PaymentSummary {
    totalPaid: number;
    remaining: number;
    agreedPrice: number;
    isFullyPaid: boolean;
}

interface Purchase {
    id: string;
    clientId: string;
    flatId: string;
    agreedPrice: number;
    status: 'IN_PROGRESS' | 'COMPLETED';
    purchaseDate: string;
    client: {
        id: string;
        fullName: string;
    };
    flat: {
        id: string;
        referenceNum: string;
    };
    paymentSummary: PaymentSummary | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function PurchasesPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchPurchases();
    }, [pagination.page, statusFilter]);

    async function fetchPurchases() {
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (searchQuery) {
                params.set('search', searchQuery);
            }

            if (statusFilter) {
                params.set('status', statusFilter);
            }

            const res = await fetch(`/api/purchases?${params.toString()}`);
            const data = await res.json();
            setPurchases(data.purchases || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
            setSearching(false);
        }
    }

    function handleSearch() {
        setSearching(true);
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchPurchases();
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav currentPage="purchases" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">عمليات الشراء</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                عرض وإدارة جميع عمليات الشراء - إجمالي: {pagination.total}
                            </p>
                        </div>
                        <Link
                            href="/dashboard/purchases/new"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                        >
                            <Plus size={20} />
                            إضافة عملية شراء
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-[300px] relative">
                            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="البحث باسم العميل أو رقم الشقة..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">جميع الحالات</option>
                            <option value="IN_PROGRESS">قيد التنفيذ</option>
                            <option value="COMPLETED">مكتمل</option>
                        </select>
                        <button
                            onClick={handleSearch}
                            disabled={searching}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
                        >
                            {searching ? '...' : 'بحث'}
                        </button>
                        {(searchQuery || statusFilter) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('');
                                    setSearching(true);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                    fetchPurchases();
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 px-4"
                            >
                                مسح الفلاتر
                            </button>
                        )}
                    </div>
                </div>

                {purchases.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                        <p className="text-gray-600 mb-4">
                            {searchQuery || statusFilter ? 'لا توجد نتائج للبحث' : 'لا توجد عمليات شراء بعد'}
                        </p>
                        {!searchQuery && !statusFilter && (
                            <Link
                                href="/dashboard/purchases/new"
                                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                            >
                                إضافة أول عملية شراء
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {purchases.map((purchase) => {
                                const summary = purchase.paymentSummary;
                                const percentage = summary ? (summary.totalPaid / summary.agreedPrice) * 100 : 0;

                                return (
                                    <Link
                                        key={purchase.id}
                                        href={`/dashboard/purchases/${purchase.id}`}
                                        className="block bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="bg-blue-100 p-3 rounded-lg">
                                                    <FileText className="text-blue-600" size={24} />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-xl font-bold text-gray-900">
                                                            {purchase.client.fullName}
                                                        </h3>
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-medium ${purchase.status === 'COMPLETED'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                                }`}
                                                        >
                                                            {purchase.status === 'COMPLETED' ? 'مكتمل' : 'قيد التنفيذ'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                                        <div className="flex items-center gap-1">
                                                            <Home size={16} />
                                                            <span>شقة {purchase.flat.referenceNum}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <DollarSign size={16} />
                                                            <span>{purchase.agreedPrice.toLocaleString()} د.م.</span>
                                                        </div>
                                                    </div>

                                                    {summary && (
                                                        <div>
                                                            <div className="flex justify-between text-sm mb-2">
                                                                <span className="text-gray-600">المدفوع: {summary.totalPaid.toLocaleString()} د.م.</span>
                                                                <span className="text-gray-600">المتبقي: {summary.remaining.toLocaleString()} د.م.</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                                <div
                                                                    className={`h-2.5 rounded-full ${summary.isFullyPaid ? 'bg-green-500' : 'bg-blue-600'
                                                                        }`}
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                {summary?.isFullyPaid ? (
                                                    <CheckCircle className="text-green-500" size={24} />
                                                ) : (
                                                    <Clock className="text-yellow-500" size={24} />
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        <PaginationComponent
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            totalItems={pagination.total}
                            itemsPerPage={pagination.limit}
                            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                            className="mt-6"
                        />
                    </>
                )}
            </div>
        </div>
    );
}
