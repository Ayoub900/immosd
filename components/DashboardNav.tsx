'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, Building2, LayoutGrid, ShoppingCart, Wallet, LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth-client';

interface DashboardNavProps {
    currentPage?: 'dashboard' | 'clients' | 'buildings' | 'flats' | 'purchases' | 'payments';
}

export default function DashboardNav({ currentPage }: DashboardNavProps) {
    const pathname = usePathname();
    const router = useRouter();

    // Auto-detect current page from pathname if not provided
    const detectCurrentPage = () => {
        if (currentPage) return currentPage;
        if (pathname === '/dashboard') return 'dashboard';
        if (pathname.includes('/clients')) return 'clients';
        if (pathname.includes('/buildings')) return 'buildings';
        if (pathname.includes('/flats')) return 'flats';
        if (pathname.includes('/purchases')) return 'purchases';
        if (pathname.includes('/payments')) return 'payments';
        return 'dashboard';
    };

    const active = detectCurrentPage();

    const navItems = [
        { id: 'dashboard', href: '/dashboard', icon: Home, label: 'الرئيسية' },
        { id: 'clients', href: '/dashboard/clients', icon: Users, label: 'العملاء' },
        { id: 'buildings', href: '/dashboard/buildings', icon: Building2, label: 'المباني' },
        { id: 'flats', href: '/dashboard/flats', icon: LayoutGrid, label: 'الشقق' },
        { id: 'purchases', href: '/dashboard/purchases', icon: ShoppingCart, label: 'المبيعات' },
        { id: 'payments', href: '/dashboard/payments', icon: Wallet, label: 'الدفعات' },
    ];

    async function handleLogout() {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push('/auth/login');
                },
            },
        });
    }

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div className="flex gap-8 py-4 overflow-x-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = active === item.id;

                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`flex items-center gap-2 pb-2 whitespace-nowrap font-medium transition-colors ${isActive
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="تسجيل الخروج"
                    >
                        <LogOut size={20} />
                        <span className="hidden sm:inline">خروج</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
