'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';

interface Flat {
    id: string;
    referenceNum: string;
    floorNum: number;
    flatType: string;
    status: string;
    price: number;
}

export default function FlatsPage() {
    const [floors, setFloors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFlats();
    }, []);

    async function fetchFlats() {
        try {
            const res = await fetch('/api/flats');
            const data = await res.json();
            setFloors(data.floors || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    const allFlats = floors.flatMap(f => f.flats);
    const availableCount = allFlats.filter((f: Flat) => f.status === 'AVAILABLE').length;
    const reservedCount = allFlats.filter((f: Flat) => f.status === 'RESERVED').length;
    const soldCount = allFlats.filter((f: Flat) => f.status === 'SOLD').length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav currentPage="flats" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">الشقق</h1>
                            <p className="mt-1 text-sm text-gray-600">عرض وإد ارة جميع الشقق</p>
                        </div>
                        <Link
                            href="/dashboard/buildings"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                        >
                            <Building2 size={20} />
                            إدارة المباني
                        </Link>
                    </div>

                    {/* Notice */}
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            💡 <strong>ملاحظة:</strong> لإضافة شقق جديدة، انتقل إلى صفحة المباني واختر المبنى المطلوب، ثم أضف الشقق للطوابق.
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">إجمالي الشقق</p>
                        <p className="text-3xl font-bold text-gray-900">{allFlats.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">متاحة</p>
                        <p className="text-3xl font-bold text-green-600">{availableCount}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">محجوزة</p>
                        <p className="text-3xl font-bold text-amber-600">{reservedCount}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">مباعة</p>
                        <p className="text-3xl font-bold text-gray-600">{soldCount}</p>
                    </div>
                </div>

                {/* Flats by Floor */}
                {floors.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <Building2 className="mx-auto text-gray-300 mb-4" size={64} />
                        <p className="text-gray-600 mb-4">لا توجد شقق بعد</p>
                        <Link
                            href="/dashboard/buildings"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                        >
                            انتقل إلى المباني لإضافة شقق
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {floors.map((floor) => (
                            <div key={floor.floorNum} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold mb-4">الطابق {floor.floorNum}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {floor.flats.map((flat: Flat) => (
                                        <div
                                            key={flat.id}
                                            className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-lg">{flat.referenceNum}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {flat.flatType === 'FULL' ? 'شقة كاملة' : flat.flatType === 'HALF_RIGHT' ? 'نصف يمين' : 'نصف يسار'}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium status-${flat.status.toLowerCase()}`}>
                                                    {flat.status === 'AVAILABLE' ? 'متاحة' : flat.status === 'RESERVED' ? 'محجوزة' : 'مباعة'}
                                                </span>
                                            </div>
                                            {/* Price removed - now only in Purchase */}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
