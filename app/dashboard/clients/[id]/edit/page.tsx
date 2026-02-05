'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save, Trash2 } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    useEffect(() => {
        fetchClient();
    }, [id]);

    async function fetchClient() {
        try {
            const res = await fetch(`/api/clients/${id}`);
            const data = await res.json();
            setFormData({
                fullName: data.fullName || '',
                phone: data.phone || '',
                cin: data.cin || '',
                address: data.address || '',
                fullNameFr: data.fullNameFr || '',
                addressFr: data.addressFr || '',
                notes: data.notes || '',
            });
        } catch (error) {
            console.error('Error:', error);
            setError('فشل في جلب بيانات العميل');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/clients/${id}`, {
                method: 'PATCH',
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
                setSaving(false);
                return;
            }

            router.push(`/dashboard/clients/${id}`);
        } catch (err) {
            setError('حدث خطأ في الاتصال');
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm('هل أنت متأكد من حذف هذا العميل؟ سيتم حذف جميع المشتريات والدفعات المرتبطة به.')) {
            return;
        }

        try {
            await fetch(`/api/clients/${id}`, { method: 'DELETE' });
            router.push('/dashboard/clients');
        } catch (error) {
            alert('فشل في حذف العميل');
        }
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
            <DashboardNav currentPage="clients" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/dashboard/clients/${id}`}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowRight size={24} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">تعديل بيانات العميل</h1>
                            <p className="mt-1 text-sm text-gray-600">تحديث معلومات العميل</p>
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
                            />
                        </div>

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
                                dir="ltr"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                رقم البطاقة الوطنية (CIN)
                            </label>
                            <input
                                type="text"
                                value={formData.cin}
                                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                العنوان
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom complet (FR)
                            </label>
                            <input
                                type="text"
                                value={formData.fullNameFr}
                                onChange={(e) => setFormData({ ...formData, fullNameFr: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                dir="ltr"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Adresse (FR)
                            </label>
                            <input
                                type="text"
                                value={formData.addressFr}
                                onChange={(e) => setFormData({ ...formData, addressFr: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                dir="ltr"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ملاحظات
                            </label>
                            <textarea
                                rows={4}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                        </button>
                        <Link
                            href={`/dashboard/clients/${id}`}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
                        >
                            إلغاء
                        </Link>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2"
                        >
                            <Trash2 size={18} />
                            حذف العميل نهائياً
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
