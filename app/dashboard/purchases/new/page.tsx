'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save, Search } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';

function NewPurchaseForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedClientId = searchParams.get('clientId');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [flats, setFlats] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        clientId: preselectedClientId || '',
        flatId: '',
        agreedPrice: '',
    });

    useEffect(() => {
        fetchClients();
        fetchFlats();
    }, []);

    async function fetchClients() {
        const res = await fetch('/api/clients?limit=1000');
        const data = await res.json();
        setClients(data.clients || []);
    }

    async function fetchFlats() {
        const res = await fetch('/api/flats');
        const data = await res.json();
        // Handle both old and new API responses
        const allFlats = data.floors?.flatMap((f: any) => f.flats) || data.flats || [];
        setFlats(allFlats);
    }

    const availableFlats = flats.filter(f => f.status === 'AVAILABLE');

    // Filter clients based on search query
    const filteredClients = clients.filter(client => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            client.fullName?.toLowerCase().includes(query) ||
            client.cin?.toLowerCase().includes(query) ||
            client.phone?.includes(query)
        );
    });

    const selectedFlat = flats.find(f => f.id === formData.flatId);

    useEffect(() => {
        if (selectedFlat && !formData.agreedPrice) {
            // Removed auto-fill of agreedPrice - user must enter price manually
        }
    }, [selectedFlat]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: formData.clientId,
                    flatId: formData.flatId,
                    agreedPrice: parseFloat(formData.agreedPrice),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'حدث خطأ');
                setLoading(false);
                return;
            }

            router.push(`/dashboard/clients/${formData.clientId}`);
        } catch (err) {
            setError('حدث خطأ في الاتصال');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav currentPage="purchases" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/clients"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowRight size={24} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">بيع شقة</h1>
                            <p className="mt-1 text-sm text-gray-600">إنشاء عملية شراء جديدة</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="البحث بالاسم، رقم الهاتف، أو رقم البطاقة..."
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
                            عدد النتائج: {filteredClients.length}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Client Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                العميل <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">اختر العميل</option>
                                {filteredClients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.fullName} {client.cin ? `(${client.cin})` : ''} - {client.phone}
                                    </option>
                                ))}
                            </select>
                            {searchQuery && filteredClients.length === 0 && (
                                <p className="mt-2 text-sm text-red-600">
                                    لا توجد نتائج للبحث
                                </p>
                            )}
                        </div>

                        {/* Flat Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                الشقة <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.flatId}
                                onChange={(e) => setFormData({ ...formData, flatId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">اختر الشقة المتاحة</option>
                                {availableFlats.map(flat => (
                                    <option key={flat.id} value={flat.id}>
                                        {flat.referenceNum} - الطابق {flat.floorNum}
                                    </option>
                                ))}
                            </select>
                            {availableFlats.length === 0 && (
                                <p className="mt-2 text-sm text-red-600">
                                    لا توجد شقق متاحة حالياً
                                </p>
                            )}
                        </div>

                        {/* Agreed Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                السعر المتفق عليه <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.agreedPrice}
                                    onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                                <span className="absolute left-4 top-2.5 text-gray-500">درهم</span>
                            </div>
                            {/* Base price removed - flats don't have prices anymore */}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex gap-4">
                        <button
                            type="submit"
                            disabled={loading || availableFlats.length === 0}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            {loading ? 'جاري الحفظ...' : 'تأكيد البيع'}
                        </button>
                        <Link
                            href="/dashboard/clients"
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
                        >
                            إلغاء
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function NewPurchasePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">جاري التحميل...</p>
                </div>
            </div>
        }>
            <NewPurchaseForm />
        </Suspense>
    );
}
