'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export default function PaginationComponent({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    className = '',
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const maxVisible = 5; // Maximum page buttons to show

        if (totalPages <= maxVisible) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            // Calculate range around current page
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            // Add ellipsis after first page if needed
            if (start > 2) {
                pages.push('ellipsis');
                start = Math.max(start, currentPage - 1);
            }

            // Add middle pages
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // Add ellipsis before last page if needed
            if (end < totalPages - 1) {
                pages.push('ellipsis');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className={`flex items-center justify-between bg-white rounded-lg shadow-sm px-6 py-4 ${className}`}>
            {/* Item count display */}
            <div className="text-sm text-gray-700">
                عرض <span className="font-medium">{startItem}</span> إلى{' '}
                <span className="font-medium">{endItem}</span> من{' '}
                <span className="font-medium">{totalItems}</span> نتيجة
            </div>

            {/* Pagination controls */}
            <div className="flex gap-2">
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    aria-label="الصفحة السابقة"
                >
                    <ChevronRight size={16} />
                    السابق
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {pageNumbers.map((page, idx) =>
                        page === 'ellipsis' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                                ...
                            </span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`px-4 py-2 rounded-lg transition-colors ${page === currentPage
                                        ? 'bg-blue-600 text-white font-medium'
                                        : 'border border-gray-300 hover:bg-gray-50'
                                    }`}
                                aria-label={`الصفحة ${page}`}
                                aria-current={page === currentPage ? 'page' : undefined}
                            >
                                {page}
                            </button>
                        )
                    )}
                </div>

                {/* Next button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    aria-label="الصفحة التالية"
                >
                    التالي
                    <ChevronLeft size={16} />
                </button>
            </div>
        </div>
    );
}
