'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';

export default function NewClientPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        cin: '',
        address: '',
        fullNameFr: '',
        addressFr: '',
        notes: '',
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    phone: formData.phone,
                    cin: formData.cin || undefined,
                    address: formData.address || undefined,
                    fullNameFr: formData.fullNameFr || undefined,
                    addressFr: formData.addressFr || undefined,
                    notes: formData.notes || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'حدث خطأ');
                setLoading(false);
                return;
            }

            router.push(`/dashboard/clients/${data.id}`);
        } catch (err) {
            setError('حدث خطأ في الاتصال');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav currentPage="clients" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/clients"
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowRight size={24} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">إضافة عميل جديد</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                إدخال بيانات العميل
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                الاسم الكامل <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="أدخل الاسم الكامل"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                رقم الهاتف <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="+212600000000"
                                dir="ltr"
                            />
                        </div>

                        {/* CIN */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                رقم البطاقة الوطنية (CIN)
                            </label>
                            <input
                                type="text"
                                value={formData.cin}
                                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="AB123456"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                العنوان
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="المدينة، الحي، الشارع"
                            />
                        </div>

                        {/* Full Name (French) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom complet (FR)
                            </label>
                            <input
                                type="text"
                                value={formData.fullNameFr}
                                onChange={(e) => setFormData({ ...formData, fullNameFr: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nom complet en français"
                                dir="ltr"
                            />
                        </div>

                        {/* Address (French) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Adresse (FR)
                            </label>
                            <input
                                type="text"
                                value={formData.addressFr}
                                onChange={(e) => setFormData({ ...formData, addressFr: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ville, quartier, rue"
                                dir="ltr"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ملاحظات
                            </label>
                            <textarea
                                rows={4}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="أي ملاحظات إضافية..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <Save size={20} />
                            {loading ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                        <Link
                            href="/dashboard/clients"
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
                        >
                            إلغاء
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
