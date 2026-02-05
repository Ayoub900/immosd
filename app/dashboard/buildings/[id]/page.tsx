'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Building2, ArrowRight, Edit, Trash2, Plus } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';

interface Flat {
    id: string;
    referenceNum: string;
    floorNum: number;
    flatType: 'FULL' | 'HALF_RIGHT' | 'HALF_LEFT';
    status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
    parentFlatId?: string;
}

interface Floor {
    floorNum: number;
    flats: Flat[];
}

interface Building {
    id: string;
    name: string;
    address?: string;
    plotNumber?: string;
    area?: number;
    projectLocation?: string;
    totalFloors: number;
    floors: Floor[];
    stats: {
        totalFlats: number;
        availableFlats: number;
        reservedFlats: number;
        soldFlats: number;
        totalValue: number;
    };
}

export default function BuildingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [building, setBuilding] = useState<Building | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', address: '', plotNumber: '', area: '', projectLocation: '', totalFloors: 1 });

    useEffect(() => {
        if (params.id) {
            fetchBuilding();
        }
    }, [params.id]);

    async function fetchBuilding() {
        try {
            const res = await fetch(`/api/buildings/${params.id}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setBuilding(data);
            setEditForm({
                name: data.name,
                address: data.address || '',
                plotNumber: data.plotNumber || '',
                area: data.area ? data.area.toString() : '',
                projectLocation: data.projectLocation || '',
                totalFloors: data.totalFloors,
            });
        } catch (error) {
            console.error('Error:', error);
            alert('فشل في تحميل بيانات المبنى');
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdate() {
        try {
            const res = await fetch(`/api/buildings/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editForm,
                    area: editForm.area ? parseFloat(editForm.area) : undefined,
                }),
            });
            if (!res.ok) throw new Error();
            await fetchBuilding();
            setEditing(false);
        } catch (error) {
            alert('فشل في تحديث المبنى');
        }
    }

    async function handleDelete() {
        if (!confirm('هل أنت متأكد من حذف هذا المبنى؟ سيتم حذف جميع الشقق المرتبطة به.')) return;

        try {
            const res = await fetch(`/api/buildings/${params.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            router.push('/dashboard/buildings');
        } catch (error) {
            alert('فشل في حذف المبنى');
        }
    }

    async function handleAddFloor(floorNum: number) {
        try {
            const res = await fetch('/api/flats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buildingId: params.id,
                    floorNum,
                    flatType: 'FULL',
                    status: 'AVAILABLE',
                }),
            });
            if (!res.ok) throw new Error();
            await fetchBuilding();
        } catch (error) {
            alert('فشل في إضافة الطابق');
        }
    }

    async function handleSplit(flatId: string, flatRef: string) {
        if (!confirm(`هل تريد تقسيم الشقة ${flatRef} إلى نصفين؟`)) return;

        try {
            const res = await fetch(`/api/flats/${flatId}/split`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'فشل في تقسيم الشقة');
            }
            await fetchBuilding();
        } catch (error: any) {
            alert(error.message || 'فشل في تقسيم الشقة');
        }
    }

    async function handleMerge(flatId: string, flatRef: string) {
        if (!confirm(`هل تريد دمج الشقة ${flatRef} مع النصف الآخر؟`)) return;

        try {
            const res = await fetch(`/api/flats/${flatId}/merge`, {
                method: 'POST',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'فشل في دمج الشقة');
            }
            await fetchBuilding();
        } catch (error: any) {
            alert(error.message || 'فشل في دمج الشقة');
        }
    }

    function getStatusClass(status: string) {
        switch (status) {
            case 'AVAILABLE': return 'bg-green-500';
            case 'RESERVED': return 'bg-amber-500';
            case 'SOLD': return 'bg-gray-400';
            default: return 'bg-gray-300';
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

    if (!building) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Building2 className="mx-auto text-gray-300 mb-4" size={64} />
                    <p className="text-gray-600">المبنى غير موجود</p>
                    <Link href="/dashboard/buildings" className="text-blue-600 hover:underline mt-4 inline-block">
                        العودة إلى المباني
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav currentPage="buildings" />

            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/buildings" className="text-gray-600 hover:text-gray-900">
                            <ArrowRight size={24} />
                        </Link>
                        <div className="flex-1">
                            {editing ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="text-2xl font-bold border-b-2 border-blue-500 focus:outline-none bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={editForm.address}
                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        placeholder="العنوان"
                                        className="text-sm text-gray-600 border-b border-gray-300 focus:outline-none bg-transparent w-full"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editForm.plotNumber}
                                            onChange={(e) => setEditForm({ ...editForm, plotNumber: e.target.value })}
                                            placeholder="رقم القطعة"
                                            className="text-sm text-gray-600 border-b border-gray-300 focus:outline-none bg-transparent flex-1"
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editForm.area}
                                            onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                                            placeholder="المساحة (م²)"
                                            className="text-sm text-gray-600 border-b border-gray-300 focus:outline-none bg-transparent w-32"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={editForm.projectLocation}
                                        onChange={(e) => setEditForm({ ...editForm, projectLocation: e.target.value })}
                                        placeholder="موقع المشروع"
                                        className="text-sm text-gray-600 border-b border-gray-300 focus:outline-none bg-transparent w-full"
                                    />
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold text-gray-900">{building.name}</h1>
                                    {building.address && <p className="mt-1 text-sm text-gray-600">{building.address}</p>}
                                    {(building.plotNumber || building.area) && (
                                        <p className="text-sm text-gray-600">
                                            {building.plotNumber && `رقم القطعة: ${building.plotNumber}`}
                                            {building.plotNumber && building.area && ' • '}
                                            {building.area && `المساحة: ${building.area} م²`}
                                        </p>
                                    )}
                                    {building.projectLocation && <p className="text-sm text-gray-600">{building.projectLocation}</p>}
                                </>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {editing ? (
                                <>
                                    <button
                                        onClick={handleUpdate}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                    >
                                        حفظ
                                    </button>
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                                    >
                                        إلغاء
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg"
                                    >
                                        <Edit size={20} />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-600">إجمالي الشقق</p>
                        <p className="text-2xl font-bold text-gray-900">{building.stats.totalFlats}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
                        <p className="text-sm text-green-700">متاحة</p>
                        <p className="text-2xl font-bold text-green-600">{building.stats.availableFlats}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 shadow-sm border border-amber-200">
                        <p className="text-sm text-amber-700">محجوزة</p>
                        <p className="text-2xl font-bold text-amber-600">{building.stats.reservedFlats}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-700">مباعة</p>
                        <p className="text-2xl font-bold text-gray-600">{building.stats.soldFlats}</p>
                    </div>
                </div>
            </div>

            {/* Building Visualization */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 pb-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold">المبنى - رسم تخطيطي</h2>
                        <p className="text-sm text-gray-600 mt-1">اضغط على أي شقة لعرض التفاصيل</p>
                    </div>

                    {building.floors.length === 0 ? (
                        <div className="text-center py-16">
                            <Building2 className="mx-auto text-gray-300 mb-4" size={64} />
                            <p className="text-gray-600 mb-4">لا توجد طوابق في هذا المبنى</p>
                            <button
                                onClick={() => handleAddFloor(1)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
                            >
                                <Plus size={20} />
                                إضافة الطابق الأول
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Add Floor Button - Top */}
                            <div className="px-6 pt-6 pb-4">
                                <button
                                    onClick={() => {
                                        const maxFloor = Math.max(...building.floors.map(f => f.floorNum));
                                        handleAddFloor(maxFloor + 1);
                                    }}
                                    className="w-full border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg p-3 hover:border-blue-600 hover:bg-blue-100 transition-all group"
                                >
                                    <Plus className="mx-auto mb-1 text-blue-600 group-hover:scale-110 transition-transform" size={20} />
                                    <span className="text-sm text-blue-700 font-medium">إضافة طابق جديد</span>
                                </button>
                            </div>

                            {/* Building Stack - NO GAPS */}
                            <div className="px-6 space-y-0">
                                {building.floors
                                    .sort((a, b) => b.floorNum - a.floorNum) // Top to bottom
                                    .map((floor) => (
                                        <div key={floor.floorNum} className="border border-gray-300">
                                            {/* Floor Label */}
                                            <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
                                                <span className="text-sm font-bold">الطابق {floor.floorNum}</span>
                                                <span className="text-xs opacity-75">{floor.flats.length} شقة</span>
                                            </div>

                                            {/* Flats Row - Touch each other */}
                                            <div className="flex">
                                                {floor.flats.map((flat, idx) => (
                                                    <div key={flat.id} className="relative flex-1 group">
                                                        <Link
                                                            href={`/dashboard/flats/${flat.id}`}
                                                            className={`
                                                                block h-full
                                                                ${getStatusClass(flat.status)} 
                                                                text-white p-6 
                                                                hover:brightness-110 transition-all
                                                                ${idx !== 0 ? 'border-l border-white/30' : ''}
                                                            `}
                                                            title={`${flat.referenceNum} - ${getStatusText(flat.status)}`}
                                                        >
                                                            <div className="flex flex-col items-center justify-center h-full min-h-[80px]">
                                                                <p className="text-xs opacity-75 mb-1">{flat.referenceNum}</p>
                                                                <p className="text-3xl mb-1">
                                                                    {flat.flatType === 'FULL' ? '🏠' :
                                                                        flat.flatType === 'HALF_RIGHT' ? '◀️' : '▶️'}
                                                                </p>
                                                                <p className="text-xs font-bold uppercase tracking-wide">
                                                                    {getStatusText(flat.status)}
                                                                </p>
                                                            </div>
                                                        </Link>

                                                        {/* Action Buttons Overlay - Show on hover */}
                                                        {flat.status === 'AVAILABLE' && (
                                                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none z-10">
                                                                <div className="pointer-events-auto flex gap-2">
                                                                    {flat.flatType === 'FULL' && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                handleSplit(flat.id, flat.referenceNum);
                                                                            }}
                                                                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-1"
                                                                            title="تقسيم إلى نصفين"
                                                                        >
                                                                            ✂️ تقسيم
                                                                        </button>
                                                                    )}

                                                                    {(flat.flatType === 'HALF_RIGHT' || flat.flatType === 'HALF_LEFT') && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                handleMerge(flat.id, flat.referenceNum);
                                                                            }}
                                                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-1"
                                                                            title="دمج مع النصف الآخر"
                                                                        >
                                                                            🔗 دمج
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {/* Add Floor Button - Bottom */}
                            <div className="p-6 pt-4">
                                <button
                                    onClick={() => handleAddFloor(1)}
                                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                                >
                                    <Plus className="mx-auto mb-1 text-gray-400 group-hover:text-blue-600 group-hover:scale-110 transition-all" size={20} />
                                    <span className="text-sm text-gray-600 group-hover:text-blue-700">إضافة طابق جديد (Below)</span>
                                </button>
                            </div>
                        </>
                    )}

                    {/* Legend */}
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
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
                </div>
            </div>
        </div>
    );
}
