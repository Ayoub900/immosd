'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Search } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import PaginationComponent from '@/components/PaginationComponent';

interface Building {
    id: string;
    name: string;
    address?: string;
    totalFloors: number;
    stats: {
        totalFlats: number;
        availableFlats: number;
        reservedFlats: number;
        soldFlats: number;
        totalValue: number;
        floors: number;
        floorNumbers: number[];
    };
    flats: Array<{
        id: string;
        status: string;
        floorNum: number;
    }>;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function BuildingsPage() {
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchBuildings();
    }, [pagination.page]);

    async function fetchBuildings() {
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (searchQuery) {
                params.set('search', searchQuery);
            }

            const res = await fetch(`/api/buildings?${params.toString()}`);
            const data = await res.json();
            setBuildings(data.buildings || []);
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
        fetchBuildings();
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'AVAILABLE':
                return 'bg-green-500';
            case 'RESERVED':
                return 'bg-amber-500';
            case 'SOLD':
                return 'bg-gray-400';
            default:
                return 'bg-gray-300';
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
            <DashboardNav currentPage="buildings" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">المباني</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                عرض وإدارة جميع المباني - إجمالي: {pagination.total}
                            </p>
                        </div>
                        <Link
                            href="/dashboard/buildings/new"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                        >
                            <Plus size={20} />
                            إضافة مبنى
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="البحث بالاسم، العنوان، أو رقم القطعة..."
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
                                    fetchBuildings();
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 px-4"
                            >
                                مسح
                            </button>
                        )}
                    </div>
                </div>

                {buildings.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <Building2 className="mx-auto text-gray-300 mb-4" size={64} />
                        <p className="text-gray-600 mb-4">
                            {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد مبانٍ بعد'}
                        </p>
                        {!searchQuery && (
                            <Link
                                href="/dashboard/buildings/new"
                                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                            >
                                إضافة أول مبنى
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildings.map((building) => {
                                // Group flats by floor for visual representation
                                const floorMap = new Map<number, typeof building.flats>();
                                building.flats.forEach((flat) => {
                                    if (!floorMap.has(flat.floorNum)) {
                                        floorMap.set(flat.floorNum, []);
                                    }
                                    floorMap.get(flat.floorNum)!.push(flat);
                                });

                                const floors = Array.from(floorMap.entries())
                                    .map(([floorNum, flats]) => ({ floorNum, flats }))
                                    .sort((a, b) => b.floorNum - a.floorNum); // Top floor first

                                return (
                                    <Link
                                        key={building.id}
                                        href={`/dashboard/buildings/${building.id}`}
                                        className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
                                    >
                                        {/* Header */}
                                        <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="text-lg font-bold">{building.name}</h3>
                                                    {building.address && (
                                                        <p className="text-sm opacity-90 mt-1">{building.address}</p>
                                                    )}
                                                </div>
                                                <Building2 size={24} />
                                            </div>
                                        </div>

                                        {/* Visual Floor Representation */}
                                        <div className="p-4 bg-gray-50">
                                            <div className="space-y-1">
                                                {floors.length > 0 ? (
                                                    floors.map((floor) => (
                                                        <div
                                                            key={floor.floorNum}
                                                            className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200"
                                                        >
                                                            <div className="text-xs font-bold text-gray-600 w-12">
                                                                ط {floor.floorNum}
                                                            </div>
                                                            <div className="flex-1 flex gap-1">
                                                                {floor.flats.map((flat, idx) => (
                                                                    <div
                                                                        key={flat.id}
                                                                        className={`h-8 flex-1 rounded ${getStatusColor(
                                                                            flat.status
                                                                        )}`}
                                                                        title={flat.status}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-4 text-gray-400 text-sm">
                                                        لا توجد شقق
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="p-4 border-t border-gray-200 bg-white">
                                            <div className="grid grid-cols-3 gap-3 text-center">
                                                <div>
                                                    <p className="text-xs text-gray-600">متاحة</p>
                                                    <p className="text-lg font-bold text-green-600">
                                                        {building.stats.availableFlats}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600">محجوزة</p>
                                                    <p className="text-lg font-bold text-amber-600">
                                                        {building.stats.reservedFlats}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600">مباعة</p>
                                                    <p className="text-lg font-bold text-gray-600">
                                                        {building.stats.soldFlats}
                                                    </p>
                                                </div>
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

                {/* Legend */}
                {buildings.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl p-4 border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">مفتاح الألوان:</h3>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-green-500"></div>
                                <span className="text-sm text-gray-700">متاحة</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-amber-500"></div>
                                <span className="text-sm text-gray-700">محجوزة</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gray-400"></div>
                                <span className="text-sm text-gray-700">مباعة</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
