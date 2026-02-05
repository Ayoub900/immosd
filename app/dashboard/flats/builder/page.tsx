'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Split, Merge, Minus, Home, ArrowRight } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';

interface Building {
    id: string;
    name: string;
}

interface Flat {
    id: string;
    referenceNum: string;
    buildingId: string;
    floorNum: number;
    flatType: 'FULL' | 'HALF_RIGHT' | 'HALF_LEFT';
    status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
    price: number;
    parentFlatId?: string;
    building?: Building;
}

interface Floor {
    floorNum: number;
    flats: Flat[];
}

export default function FlatBuilderPage() {
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
    const [floors, setFloors] = useState<Floor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBuildings();
    }, []);

    useEffect(() => {
        if (selectedBuildingId) {
            fetchFlats();
        } else {
            setFloors([]);
        }
    }, [selectedBuildingId]);

    async function fetchBuildings() {
        try {
            const res = await fetch('/api/buildings');
            const data = await res.json();
            setBuildings(data);
            if (data.length > 0) {
                setSelectedBuildingId(data[0].id);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchFlats() {
        if (!selectedBuildingId) return;

        try {
            const res = await fetch(`/api/flats?buildingId=${selectedBuildingId}`);
            const data = await res.json();
            setFloors(data.floors || []);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function handleAddFloor() {
        const newFloorNum = floors.length > 0 ? Math.max(...floors.map(f => f.floorNum)) + 1 : 1;
        setFloors([{ floorNum: newFloorNum, flats: [] }, ...floors]);
    }

    async function handleAddFlat(floorNum: number) {
        if (!selectedBuildingId) {
            alert('يرجى اختيار مبنى أولاً');
            return;
        }

        try {
            await fetch('/api/flats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buildingId: selectedBuildingId,
                    floorNum,
                    price: 500000,
                    flatType: 'FULL',
                    status: 'AVAILABLE',
                }),
            });
            await fetchFlats();
        } catch (error) {
            console.error('Error:', error);
            alert('فشل في إضافة الشقة');
        }
    }

    async function handleDeleteFloor(floorNum: number) {
        const floor = floors.find(f => f.floorNum === floorNum);
        if (!floor) return;

        if (!confirm(`هل أنت متأكد من حذف الطابق ${floorNum}؟`)) return;

        for (const flat of floor.flats) {
            await fetch(`/api/flats/${flat.id}`, { method: 'DELETE' });
        }

        setFloors(floors.filter(f => f.floorNum !== floorNum));
    }

    async function handleDeleteFlat(flat: Flat) {
        if (!confirm(`هل أنت متأكد من حذف الشقة ${flat.referenceNum}؟`)) return;

        try {
            await fetch(`/api/flats/${flat.id}`, { method: 'DELETE' });
            await fetchFlats();
        } catch (error) {
            alert('فشل في حذف الشقة');
        }
    }

    async function handleSplitFlat(flat: Flat) {
        if (!confirm(`هل تريد تقسيم الشقة ${flat.referenceNum} إلى نصفين؟`)) return;

        try {
            const res = await fetch(`/api/flats/${flat.id}/split`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // No price calculations - price only exists in Purchase
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                alert(error.error || 'فشل في تقسيم الشقة');
                return;
            }

            await fetchFlats();
        } catch (error) {
            alert('فشل في تقسيم الشقة');
        }
    }

    async function handleMergeFloor(floor: Floor) {
        if (floor.flats.length !== 2) {
            alert('يجب أن يحتوي الطابق على نصفين للدمج');
            return;
        }

        const [flat1, flat2] = floor.flats;

        if (flat1.flatType === 'FULL' || flat2.flatType === 'FULL') {
            alert('لا يمكن دمج شقة كاملة');
            return;
        }

        if (flat1.parentFlatId !== flat2.parentFlatId || !flat1.parentFlatId) {
            alert('يجب أن يكون النصفان من نفس الشقة الأصلية');
            return;
        }

        if (flat1.status !== 'AVAILABLE' || flat2.status !== 'AVAILABLE') {
            alert('يجب أن يكون النصفان متاحين للدمج');
            return;
        }

        if (!confirm('هل تريد دمج النصفين في شقة كاملة؟')) return;

        try {
            await fetch(`/api/flats/${flat1.id}`, { method: 'DELETE' });
            await fetch(`/api/flats/${flat2.id}`, { method: 'DELETE' });

            await fetch(`/api/flats/${flat1.parentFlatId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'AVAILABLE' }),
            });

            await fetchFlats();
        } catch (error) {
            alert('فشل في دمج الشقق');
        }
    }

    function getStatusClass(status: string) {
        switch (status) {
            case 'AVAILABLE': return 'flat-available';
            case 'RESERVED': return 'flat-reserved';
            case 'SOLD': return 'flat-sold';
            default: return '';
        }
    }

    function getStatusText(status: string) {
        switch (status) {
            case 'AVAILABLE': return 'متاحة';
            case 'RESERVED': return 'محجوزة';
            case 'SOLD': return 'مباعة';
            default: return status;
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
            <DashboardNav currentPage="flats" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">مخطط العمارة</h1>
                    <p className="text-sm text-gray-600">منشئ الشقق المرئي</p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {/* Building Selector */}
                {buildings.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300 mb-4">
                        <p className="text-gray-600 mb-4">لا توجد مبانٍ. يرجى إنشاء مبنى أولاً.</p>
                        <a
                            href="/dashboard/buildings/new"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                        >
                            إنشاء مبنى جديد
                        </a>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">اختر المبنى:</label>
                            <select
                                value={selectedBuildingId}
                                onChange={(e) => setSelectedBuildingId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {buildings.map((building) => (
                                    <option key={building.id} value={building.id}>
                                        {building.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Add Floor Button */}
                        <div className="mb-2">
                            <button
                                onClick={handleAddFloor}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                            >
                                <Plus size={20} />
                                إضافة طابق
                            </button>
                        </div>

                        {/* Building */}
                        {floors.length === 0 ? (
                            <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                                <p className="text-gray-600 mb-4">لا توجد طوابق في هذا المبنى</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {floors.map((floor) => {
                                    const hasTwoHalves = floor.flats.length === 2 && floor.flats.every(f => f.flatType !== 'FULL');
                                    const canMerge = hasTwoHalves && floor.flats.every(f => f.status === 'AVAILABLE');

                                    return (
                                        <div
                                            key={floor.floorNum}
                                            className="bg-white border-2 border-gray-400 rounded-lg overflow-hidden"
                                        >
                                            {/* Floor Header */}
                                            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-300">
                                                <h3 className="font-bold text-sm text-gray-800">
                                                    الطابق {floor.floorNum}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    {canMerge && (
                                                        <button
                                                            onClick={() => handleMergeFloor(floor)}
                                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
                                                        >
                                                            <Merge size={14} />
                                                            دمج
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteFloor(floor.floorNum)}
                                                        className="text-red-600 hover:text-red-700 p-1"
                                                        title="حذف الطابق"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Flats - Horizontal Grid */}
                                            <div className="p-2">
                                                {floor.flats.length === 0 ? (
                                                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                                        <p className="text-gray-500 text-sm mb-3">لا توجد شقق في هذا الطابق</p>
                                                        <button
                                                            onClick={() => handleAddFlat(floor.floorNum)}
                                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                                                        >
                                                            <Plus size={16} />
                                                            إضافة شقة
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1">
                                                        {floor.flats.map((flat) => (
                                                            <div
                                                                key={flat.id}
                                                                className={`
                                  ${getStatusClass(flat.status)}
                                  flex-1 relative rounded border-2 p-3 transition-all min-h-[120px]
                                `}
                                                            >
                                                                <div className="text-sm font-bold mb-2">{flat.referenceNum}</div>
                                                                <div className="text-xs text-gray-600 mb-1">
                                                                    {flat.flatType === 'FULL' ? '🏠 كاملة' : flat.flatType === 'HALF_RIGHT' ? '◀️ يمين' : '▶️ يسار'}
                                                                </div>
                                                                <div className="text-xs mb-1">{getStatusText(flat.status)}</div>
                                                                {/* Price removed - only in Purchase */}

                                                                {/* Actions */}
                                                                <div className="mt-3 flex gap-1">
                                                                    {flat.flatType === 'FULL' && flat.status === 'AVAILABLE' && (
                                                                        <button
                                                                            onClick={() => handleSplitFlat(flat)}
                                                                            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-2 py-1.5 rounded text-xs flex items-center justify-center gap-1"
                                                                        >
                                                                            <Split size={14} />
                                                                            تقسيم
                                                                        </button>
                                                                    )}

                                                                    {flat.status === 'AVAILABLE' && (
                                                                        <button
                                                                            onClick={() => handleDeleteFlat(flat)}
                                                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded text-xs flex items-center justify-center gap-1"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                            حذف
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Help */}
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800"><strong>كيف تعمل:</strong></p>
                            <ul className="text-xs text-blue-700 mt-1 space-y-1">
                                <li>• اختر المبنى من القائمة أعلاه</li>
                                <li>• كل طابق يحتوي على شقة واحدة أو نصفين</li>
                                <li>• اضغط "تقسيم" على الشقة الكاملة لتقسيمها</li>
                                <li>• اضغط "دمج" في رأس الطابق لدمج النصفين</li>
                                <li>• يمكن حذف الشقق المتاحة فقط</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
