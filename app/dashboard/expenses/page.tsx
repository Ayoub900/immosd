'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    expenseDate: string;
    notes?: string;
    building?: {
        id: string;
        name: string;
    };
    flat?: {
        id: string;
        referenceNum: string;
    };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const categoryLabels: Record<string, string> = {
    MAINTENANCE: 'صيانة',
    UTILITIES: 'مرافق',
    SALARIES: 'رواتب',
    MARKETING: 'تسويق',
    LEGAL: 'قانونية',
    OTHER: 'أخرى',
};

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, [pagination.page, searchTerm, category, dateFrom, dateTo, amountMin, amountMax]);

    async function fetchExpenses() {
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (searchTerm) params.set('search', searchTerm);
            if (category) params.set('category', category);
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);
            if (amountMin) params.set('amountMin', amountMin);
            if (amountMax) params.set('amountMax', amountMax);

            const res = await fetch(`/api/expenses?${params.toString()}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setExpenses(data.expenses || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
            setSearching(false);
        }
    }

    function handleSearch() {
        setSearching(true);
        setPagination(prev => ({ ...prev, page: 1 }));
    }

    function clearFilters() {
        setSearchTerm('');
        setCategory('');
        setDateFrom('');
        setDateTo('');
        setAmountMin('');
        setAmountMax('');
        setPagination(prev => ({ ...prev, page: 1 }));
    }

    async function handleDelete(id: string) {
        if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;

        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error();

            // Refresh the list
            await fetchExpenses();
        } catch (error) {
            alert('فشل في حذف المصروف');
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <DashboardNav currentPage="expenses" />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav currentPage="expenses" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">المصروفات</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                إجمالي المصروفات: {pagination.total}
                            </p>
                        </div>
                        <Link
                            href="/dashboard/expenses/new"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                        >
                            <span className="text-xl">+</span>
                            إضافة مصروف
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="بحث بالوصف أو المبنى"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
                                </button>
                                <button
                                    onClick={handleSearch}
                                    disabled={searching}
                                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
                                >
                                    {searching ? '...' : 'بحث'}
                                </button>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">الكل</option>
                                        {Object.entries(categoryLabels).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
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
                                <div className="flex items-end">
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

                {/* Expenses Table - Desktop */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    التاريخ
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الوصف
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الفئة
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    المبنى
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    المبلغ
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    إجراءات
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm || category || dateFrom || dateTo || amountMin || amountMax ? 'لا توجد نتائج للبحث' : 'لا توجد مصروفات بعد'}
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(expense.expenseDate).toLocaleDateString('ar-MA')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {expense.description}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                {categoryLabels[expense.category]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {expense.building?.name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-red-600">
                                                {expense.amount.toLocaleString('ar-MA')} د.م
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Expenses Cards - Mobile */}
                <div className="md:hidden space-y-4">
                    {expenses.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                            {searchTerm || category || dateFrom || dateTo || amountMin || amountMax ? 'لا توجد نتائج للبحث' : 'لا توجد مصروفات بعد'}
                        </div>
                    ) : (
                        expenses.map((expense) => (
                            <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="text-sm font-medium text-gray-500">التاريخ</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {new Date(expense.expenseDate).toLocaleDateString('ar-MA')}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">المبلغ</div>
                                        <div className="text-lg font-bold text-red-600">
                                            {expense.amount.toLocaleString('ar-MA')} د.م
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">الوصف:</span>
                                        <span className="font-medium text-gray-900">{expense.description}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">الفئة:</span>
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                            {categoryLabels[expense.category]}
                                        </span>
                                    </div>
                                    {expense.building && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">المبنى:</span>
                                            <span className="font-medium text-gray-900">{expense.building.name}</span>
                                        </div>
                                    )}
                                    {expense.flat && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">الشقة:</span>
                                            <span className="font-medium text-gray-900">{expense.flat.referenceNum}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleDelete(expense.id)}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <Trash2 size={18} />
                                    حذف المصروف
                                </button>
                            </div>
                        ))
                    )}
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
