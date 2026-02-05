'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Users, Building2, ShoppingCart } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import { useSession } from '@/lib/auth-client';

interface DashboardStats {
    totalClients: number;
    totalFlats: number;
    availableFlats: number;
    reservedFlats: number;
    soldFlats: number;
    activePurchases: number;
    completedPurchases: number;
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            const [clientsRes, flatsRes, purchasesRes] = await Promise.all([
                fetch('/api/clients?limit=10000'),
                fetch('/api/flats'),
                fetch('/api/purchases'),
            ]);

            const clientsData = await clientsRes.json();
            const flatsData = await flatsRes.json();
            const purchasesData = await purchasesRes.json();

            // Calculate stats - handle paginated clients response
            const clients = clientsData.clients || clientsData;
            // Handle paginated purchases response  
            const purchases = purchasesData.purchases || purchasesData;
            // Get all flats and filter out soft-deleted ones
            const allFlats = (flatsData.floors?.flatMap((floor: any) => floor.flats) || []).filter(
                (f: any) => !f.deletedAt
            );

            setStats({
                totalClients: clients.length || 0,
                totalFlats: allFlats.length,
                availableFlats: allFlats.filter((f: any) => f.status === 'AVAILABLE').length,
                reservedFlats: allFlats.filter((f: any) => f.status === 'RESERVED').length,
                soldFlats: allFlats.filter((f: any) => f.status === 'SOLD').length,
                activePurchases: purchases.filter((p: any) => p.status === 'IN_PROGRESS').length,
                completedPurchases: purchases.filter((p: any) => p.status === 'COMPLETED').length,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading || !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">نظام إدارة العقارات</h1>
                            <p className="mt-2 text-gray-600">لوحة التحكم الرئيسية</p>
                        </div>
                        {session?.user?.email && (
                            <div className="text-right">
                                <p className="text-sm text-gray-500">المستخدم الحالي</p>
                                <p className="text-sm font-medium text-gray-900" dir="ltr">{session.user.email}</p>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <DashboardNav currentPage="dashboard" />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Clients */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">إجمالي العملاء</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Users className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Total Flats */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">إجمالي الشقق</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalFlats}</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Building2 className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Active Purchases */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">قيد الدفع</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.activePurchases}</p>
                            </div>
                            <div className="bg-amber-100 p-3 rounded-lg">
                                <ShoppingCart className="text-amber-600" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Completed Purchases */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">مكتملة</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.completedPurchases}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <ShoppingCart className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Flats Status Overview */}
                <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-6">حالة الشقق</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg status-available">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">متاحة</span>
                                <span className="text-2xl font-bold">{stats.availableFlats}</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-lg status-reserved">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">محجوزة</span>
                                <span className="text-2xl font-bold">{stats.reservedFlats}</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-lg status-sold">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">مباعة</span>
                                <span className="text-2xl font-bold">{stats.soldFlats}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link
                        href="/dashboard/clients/new"
                        className="bg-white p-6 rounded-xl shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                    >
                        <Users className="mx-auto mb-3 text-gray-400" size={32} />
                        <h3 className="font-bold text-gray-700">إضافة عميل جديد</h3>
                    </Link>

                    <Link
                        href="/dashboard/buildings/new"
                        className="bg-white p-6 rounded-xl shadow-sm border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
                    >
                        <Building2 className="mx-auto mb-3 text-gray-400" size={32} />
                        <h3 className="font-bold text-gray-700">إنشاء مبنى جديد</h3>
                    </Link>

                    <Link
                        href="/dashboard/purchases/new"
                        className="bg-white p-6 rounded-xl shadow-sm border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all text-center"
                    >
                        <ShoppingCart className="mx-auto mb-3 text-gray-400" size={32} />
                        <h3 className="font-bold text-gray-700">بيع شقة</h3>
                    </Link>
                </div>
            </main>
        </div>
    );
}
