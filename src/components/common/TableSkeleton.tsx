import { TableBody, TableCell, TableRow } from "../ui/table";

const SkeletonRow = () => (
  <TableRow>
    <TableCell className="px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div>
          <div className="mb-1 h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    </TableCell>
    <TableCell className="px-4 py-3">
      <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
    </TableCell>
    <TableCell className="px-4 py-3">
      <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
    </TableCell>
    <TableCell className="px-4 py-3">
      <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
    </TableCell>
    <TableCell className="px-4 py-3">
      <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
    </TableCell>
    <TableCell className="px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="h-4 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    </TableCell>
  </TableRow>
);

interface TableSkeletonProps {
  rows?: number;
}

const TableSkeleton = ({ rows = 5 }: TableSkeletonProps) => {
  return (
    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonRow key={index} />
      ))}
    </TableBody>
  );
};

export default TableSkeleton; 