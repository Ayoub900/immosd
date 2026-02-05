'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Plus, Phone, MapPin, FileText, Search } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import PaginationComponent from '@/components/PaginationComponent';

interface Client {
    id: string;
    fullName: string;
    phone: string;
    cin?: string;
    address?: string;
    notes?: string;
    purchases: any[];
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchClients();
    }, [pagination.page]);

    async function fetchClients() {
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (searchQuery) {
                params.set('search', searchQuery);
            }

            const res = await fetch(`/api/clients?${params.toString()}`);
            const data = await res.json();
            setClients(data.clients || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
            setSearching(false);
        }
    }

    function handleSearch() {
        setSearching(true);
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchClients();
    }

    const clientsWithPurchases = clients.filter(c => c.purchases.length > 0).length;
    const totalPurchases = clients.reduce((sum, c) => sum + c.purchases.length, 0);

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
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">العملاء</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                إدارة بيانات العملاء وعمليات الشراء - إجمالي: {pagination.total}
                            </p>
                        </div>
                        <Link
                            href="/dashboard/clients/new"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-md"
                        >
                            <Plus size={20} />
                            إضافة عميل
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="البحث بالاسم، رقم الهاتف، أو رقم البطاقة..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={searching}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
                        >
                            {searching ? '...' : 'بحث'}
                        </button>
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSearching(true);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                    fetchClients();
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 px-4"
                            >
                                مسح
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">إجمالي العملاء</p>
                                <p className="text-3xl font-bold text-gray-900">{pagination.total}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Users className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">عملاء لديهم مشتريات</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {clientsWithPurchases}
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <FileText className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">إجمالي المشتريات</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {totalPurchases}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <FileText className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clients Grid */}
                {clients.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                        <Users className="mx-auto text-gray-300 mb-4" size={64} />
                        <p className="text-gray-600 mb-4">
                            {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد عملاء بعد'}
                        </p>
                        {!searchQuery && (
                            <Link
                                href="/dashboard/clients/new"
                                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                            >
                                إضافة أول عميل
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {clients.map((client) => (
                                <Link
                                    key={client.id}
                                    href={`/dashboard/clients/${client.id}`}
                                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-blue-100 p-3 rounded-lg">
                                            <Users className="text-blue-600" size={24} />
                                        </div>
                                        {client.purchases.length > 0 && (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                                {client.purchases.length} مشتريات
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {client.fullName}
                                    </h3>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} />
                                            <span dir="ltr">{client.phone}</span>
                                        </div>

                                        {client.address && (
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} />
                                                <span className="line-clamp-1">{client.address}</span>
                                            </div>
                                        )}

                                        {client.cin && (
                                            <div className="text-xs text-gray-500">
                                                CIN: {client.cin}
                                            </div>
                                        )}
                                    </div>

                                    {client.notes && (
                                        <p className="mt-4 text-sm text-gray-500 line-clamp-2 bg-gray-50 p-2 rounded">
                                            {client.notes}
                                        </p>
                                    )}
                                </Link>
                            ))}
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
