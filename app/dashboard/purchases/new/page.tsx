'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save, Search } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';

interface Building {
    id: string;
    name: string;
    address?: string;
    floors: Floor[];
}

interface Floor {
    floorNum: number;
    flats: Flat[];
}

interface Flat {
    id: string;
    referenceNum: string;
    floorNum: number;
    flatType: 'FULL' | 'HALF_RIGHT' | 'HALF_LEFT';
    propertyType: 'APARTMENT' | 'COMMERCIAL_STORE';
    status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
}

function NewPurchaseForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedClientId = searchParams.get('clientId');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [buildings, setBuildings] = useState<any[]>([]);
    const [buildingDetails, setBuildingDetails] = useState<Building | null>(null);
    const [loadingBuilding, setLoadingBuilding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBuildingId, setSelectedBuildingId] = useState('');
    const [formData, setFormData] = useState({
        clientId: preselectedClientId || '',
        flatId: '',
        agreedPrice: '',
    });

    useEffect(() => {
        fetchClients();
        fetchBuildings();
    }, []);

    async function fetchClients() {
        const res = await fetch('/api/clients?limit=1000');
        const data = await res.json();
        setClients(data.clients || []);
    }

    async function fetchBuildings() {
        const res = await fetch('/api/buildings?limit=1000');
        const data = await res.json();
        setBuildings(data.buildings || []);
    }

    async function fetchBuildingDetails(buildingId: string) {
        setLoadingBuilding(true);
        try {
            const res = await fetch(`/api/buildings/${buildingId}`);
            const data = await res.json();
            setBuildingDetails(data);
        } catch (error) {
            console.error('Error fetching building:', error);
        } finally {
            setLoadingBuilding(false);
        }
    }

    const filteredClients = clients.filter(client => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            client.fullName?.toLowerCase().includes(query) ||
            client.cin?.toLowerCase().includes(query) ||
            client.phone?.includes(query)
        );
    });

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

    function getFloorDisplayName(floorNum: number): string {
        if (floorNum === 1) {
            return 'الطابق الألرضي';
        }
        return `الطابق ${floorNum - 1}`;
    }

    function getStatusClass(status: string) {
        switch (status) {
            case 'AVAILABLE': return 'bg-green-500';
            case 'RESERVED': return 'bg-amber-500';
            case 'SOLD': return 'bg-gray-400';
            default: return 'bg-gray-300';
        }
    }

    function handleFlatClick(flatId: string, flatStatus: string) {
        if (flatStatus !== 'AVAILABLE') return;
        setFormData(prev => ({ ...prev, flatId }));
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav currentPage="purchases" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/purchases" className="text-gray-600 hover:text-gray-900">
                            <ArrowRight size={24} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">بيع شقة</h1>
                            <p className="mt-1 text-sm text-gray-600">إنشاء عملية شراء جديدة</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Client */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">1. اختر العميل</h2>
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="البحث بالاسم، رقم الهاتف، أو رقم البطاقة..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <select
                            required
                            value={formData.clientId}
                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        >
                            <option value="">اختر العميل *</option>
                            {filteredClients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.fullName} {client.cin ? `(${client.cin})` : ''} - {client.phone}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Step 2: Building */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">2. اختر المبنى</h2>
                        <select
                            required
                            value={selectedBuildingId}
                            onChange={(e) => {
                                const buildingId = e.target.value;
                                setSelectedBuildingId(buildingId);
                                setFormData(prev => ({ ...prev, flatId: '' }));
                                if (buildingId) {
                                    fetchBuildingDetails(buildingId);
                                } else {
                                    setBuildingDetails(null);
                                }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        >
                            <option value="">اختر المبنى *</option>
                            {buildings.map(building => (
                                <option key={building.id} value={building.id}>
                                    {building.name} {building.address ? `- ${building.address}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Step 3: Visual Flat Selection */}
                    {selectedBuildingId && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                3. اختر الشقة من المبنى
                                {formData.flatId && buildingDetails && (
                                    <span className="text-blue-600 text-base mr-2">
                                        ✓ تم اختيار: {buildingDetails.floors
                                            .flatMap((f: Floor) => f.flats)
                                            .find((f: Flat) => f.id === formData.flatId)?.referenceNum}
                                    </span>
                                )}
                            </h2>

                            {loadingBuilding ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                </div>
                            ) : buildingDetails?.floors ? (
                                <>
                                    <div className="space-y-0 border border-gray-300 rounded-lg overflow-hidden">
                                        {buildingDetails.floors
                                            .sort((a, b) => b.floorNum - a.floorNum)
                                            .map((floor) => (
                                                <div key={floor.floorNum}>
                                                    <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
                                                        <span className="text-sm font-bold">{getFloorDisplayName(floor.floorNum)}</span>
                                                        <span className="text-xs opacity-75">{floor.flats.length} شقة</span>
                                                    </div>
                                                    <div className="flex flex-row-reverse">
                                                        {floor.flats.map((flat, idx) => (
                                                            <button
                                                                key={flat.id}
                                                                type="button"
                                                                onClick={() => handleFlatClick(flat.id, flat.status)}
                                                                disabled={flat.status !== 'AVAILABLE'}
                                                                className={`
                                                                    flex-1 h-full ${getStatusClass(flat.status)}
                                                                    text-white p-4 transition-all
                                                                    ${idx !== 0 ? 'border-l border-white/30' : ''}
                                                                    ${flat.status === 'AVAILABLE' ? 'cursor-pointer hover:brightness-110' : 'cursor-not-allowed'}
                                                                    ${formData.flatId === flat.id ? 'ring-4 ring-blue-600 ring-inset' : ''}
                                                                `}
                                                            >
                                                                <div className="flex flex-col items-center justify-center h-full min-h-[80px]">
                                                                    <p className="text-xs opacity-75 mb-1">{flat.referenceNum}</p>
                                                                    <p className="text-3xl mb-1">
                                                                        {flat.propertyType === 'COMMERCIAL_STORE' ? '🏪' :
                                                                            (flat.flatType === 'FULL' ? '🏠' :
                                                                                flat.flatType === 'HALF_RIGHT' ? '◀️' : '▶️')}
                                                                    </p>
                                                                    <p className="text-xs opacity-90 mb-1">
                                                                        {flat.propertyType === 'COMMERCIAL_STORE' ? 'محل تجاري' : 'شقة'}
                                                                    </p>
                                                                    <p className="text-xs font-bold uppercase tracking-wide">
                                                                        {flat.status === 'AVAILABLE' ? 'متاحة' :
                                                                            flat.status === 'RESERVED' ? 'محجوزة' : 'مباعة'}
                                                                    </p>
                                                                    {formData.flatId === flat.id && (
                                                                        <p className="text-lg mt-1">✓</p>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                    <div className="mt-4 flex gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-green-500"></div>
                                            <span>متاحة</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-amber-500"></div>
                                            <span>محجوزة</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-gray-400"></div>
                                            <span>مباعة</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-500 text-center py-8">لا توجد طوابق في هذا المبنى</p>
                            )}
                        </div>
                    )}

                    {/* Step 4: Price */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. السعر المتفق عليه</h2>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.agreedPrice}
                                onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                placeholder="0.00"
                            />
                            <span className="absolute left-4 top-3.5 text-gray-500">درهم</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading || !formData.clientId || !formData.flatId || !formData.agreedPrice}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-lg font-medium flex items-center justify-center gap-2 text-lg"
                        >
                            <Save size={24} />
                            {loading ? 'جاري الحفظ...' : 'تأكيد البيع'}
                        </button>
                        <Link
                            href="/dashboard/purchases"
                            className="px-6 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center font-medium"
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
