import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DataTable } from '@/components/gtfs-table/data-table';
import { columns } from '@/components/gtfs-table/columns';
import { projectService } from '@/services/projectService';
import { toast } from 'sonner';

/**
 * StopsTable component
 * Displays a paginated and searchable table of stops for a project.
 * 
 * @param {string} projectId - The ID of the project to fetch stops for.
 */
const StopsTable = ({ projectId }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [meta, setMeta] = useState(null);

    const fetchStops = useCallback(async (pageNum, searchQuery) => {
        setLoading(true);
        try {
            const response = await projectService.getStops(projectId, {
                page: pageNum,
                limit: 10,
                search: searchQuery
            });

            if (response.success) {
                setData(response.data.stops);
                setTotalPages(response.data.pagination.totalPages);
                setMeta({
                    totalItems: response.data.pagination.totalCount,
                    pageSize: 10,
                    page: pageNum
                });
            } else {
                toast.error(response.message || "Failed to fetch stops");
            }
        } catch (error) {
            console.error("Error fetching stops:", error);
            toast.error("An error occurred while fetching stops");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    // Initial fetch and on dependencies change
    useEffect(() => {
        fetchStops(page, search);
    }, [fetchStops, page, search]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleSearchChange = (value) => {
        setSearch(value);
        setPage(1); // Reset to first page on search
    };

    // Placeholder handlers for row actions
    const handleSelectData = (row) => {
        console.log("Selected stop:", row);
    };

    const handleHoverCoordinate = (coords) => {
        // Can be used to highlight on map later
        // console.log("Hover coords:", coords);
    };

    // Columns configuration
    // We can filter or enhance columns here if needed
    const tableColumns = useMemo(() => columns.stops, []);

    return (
        <div className="space-y-4">
            <DataTable
                columns={tableColumns}
                data={data}
                isLoading={loading}
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                searchValue={search}
                onSearchChange={handleSearchChange}
                onSelectData={handleSelectData}
                onHoverCoordinate={handleHoverCoordinate}
                showPagination={true}
                meta={meta}
            />
        </div>
    );
};

export default StopsTable;
