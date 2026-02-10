'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardNav from '@/components/DashboardNav';

interface Building {
    id: string;
    name: string;
}

interface Flat {
    id: string;
    referenceNum: string;
    buildingId: string;
}

const categoryOptions = [
    { value: 'MAINTENANCE', label: 'صيانة' },
    { value: 'UTILITIES', label: 'مرافق' },
    { value: 'SALARIES', label: 'رواتب' },
    { value: 'MARKETING', label: 'تسويق' },
    { value: 'LEGAL', label: 'قانونية' },
    { value: 'OTHER', label: 'أخرى' },
];

export default function NewExpensePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [buildings, setBuildings] = useState<Building[]>([])

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: '',
        expenseDate: new Date().toISOString().split('T')[0],
        notes: '',
        buildingId: '',
        flatId: '',
    });

    useEffect(() => {
        fetchBuildings();
    }, []);

    async function fetchBuildings() {
        try {
            const res = await fetch('/api/buildings');
            if (res.ok) {
                const data = await res.json();
                setBuildings(data.buildings || []);
            }
        } catch (error) {
            console.error('Error fetching buildings:', error);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                description: formData.description,
                amount: parseFloat(formData.amount),
                category: formData.category,
                expenseDate: formData.expenseDate,
                notes: formData.notes || undefined,
                buildingId: formData.buildingId || undefined,
                flatId: formData.flatId || undefined,
            };

            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'فشل في إنشاء المصروف');
            }

            router.push('/dashboard/expenses');
        } catch (error: any) {
            alert(error.message || 'فشل في إنشاء المصروف');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav currentPage="expenses" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/expenses"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            ← رجوع
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">إضافة مصروف جديد</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            الوصف <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="أدخل وصف المصروف..."
                        />
                    </div>

                    {/* Amount and Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                المبلغ (د.م) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                الفئة <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">اختر الفئة</option>
                                {categoryOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Expense Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            تاريخ المصروف <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.expenseDate}
                            onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Building and Flat (Optional) */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">ربط بعقار (اختياري)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    المبنى
                                </label>
                                <select
                                    value={formData.buildingId}
                                    onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">بدون مبنى</option>
                                    {buildings.map(building => (
                                        <option key={building.id} value={building.id}>
                                            {building.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ملاحظات
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="ملاحظات إضافية..."
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            {loading ? 'جاري الحفظ...' : 'حفظ المصروف'}
                        </button>
                        <Link
                            href="/dashboard/expenses"
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors text-center"
                        >
                            إلغاء
                        </Link>
                    </div>
                </form>
            </main>
        </div>
    );
}
