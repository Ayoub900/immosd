'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save, Building2 } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';

export default function NewBuildingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        plotNumber: '',
        area: '',
        projectLocation: '',
        totalFloors: 1,
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/buildings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    area: formData.area ? parseFloat(formData.area) : undefined,
                }),
            });

            if (!res.ok) throw new Error();

            const building = await res.json();
            router.push(`/dashboard/buildings/${building.id}`);
        } catch (error) {
            alert('فشل في إنشاء المبنى');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav currentPage="buildings" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/buildings"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowRight size={24} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">إضافة مبنى جديد</h1>
                            <p className="mt-1 text-sm text-gray-600">أدخل تفاصيل المبنى</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                اسم المبنى <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="مثال: المبنى الأول"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label htmlFor="address" className="block  text-sm font-medium text-gray-700 mb-2">
                                العنوان
                            </label>
                            <input
                                type="text"
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="مثال: شارع المحمدية، الدار البيضاء"
                            />
                        </div>

                        {/* Plot Number */}
                        <div>
                            <label htmlFor="plotNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                رقم القطعة
                            </label>
                            <input
                                type="text"
                                id="plotNumber"
                                value={formData.plotNumber}
                                onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="مثال: 123"
                            />
                        </div>

                        {/* Area */}
                        <div>
                            <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                                مساحة البناء (متر مربع)
                            </label>
                            <input
                                type="number"
                                id="area"
                                step="0.01"
                                min="0"
                                value={formData.area}
                                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="مثال: 120"
                            />
                        </div>

                        {/* Project Location */}
                        <div>
                            <label htmlFor="projectLocation" className="block text-sm font-medium text-gray-700 mb-2">
                                موقع المشروع
                            </label>
                            <input
                                type="text"
                                id="projectLocation"
                                value={formData.projectLocation}
                                onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="مثال: مشروع البركة ببنسليمان"
                            />
                        </div>

                        {/* Total Floors */}
                        <div>
                            <label htmlFor="totalFloors" className="block text-sm font-medium text-gray-700 mb-2">
                                عدد الطوابق <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="totalFloors"
                                required
                                min="1"
                                max="50"
                                value={formData.totalFloors}
                                onChange={(e) =>
                                    setFormData({ ...formData, totalFloors: parseInt(e.target.value) || 1 })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                يمكنك إضافة الطوابق والشقق لاحقاً من صفحة تفاصيل المبنى
                            </p>
                        </div>

                        {/* Note */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>ملاحظة:</strong> بعد إنشاء المبنى، يمكنك إضافة الطوابق والشقق من صفحة تفاصيل المبنى.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Building2 size={20} />
                                        إنشاء المبنى
                                    </>
                                )}
                            </button>
                            <Link
                                href="/dashboard/buildings"
                                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-center"
                            >
                                إلغاء
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
