import React from 'react';

interface StatItemProps {
  title: string;
  value: string;
  percentage: string;
  isPositive: boolean;
  isLast?: boolean;
  isSecondToLastInMobile?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ title, value, percentage, isPositive, isLast, isSecondToLastInMobile }) => {
  const borderClasses = `border-b border-gray-200 dark:border-gray-800 px-6 py-5 
                       sm:border-r 
                       xl:border-b-0 
                       ${isLast ? 'sm:border-r-0' : ''} 
                       ${isSecondToLastInMobile ? 'sm:border-b-0' : ''}`;
  
  const percentageColor = isPositive ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500' : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500';

  return (
    <div className={borderClasses}>
      <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
      <div className="mt-2 flex items-end gap-3">
        <h4 className="text-title-xs sm:text-title-sm font-bold text-gray-800 dark:text-white/90">{value}</h4>
        <div>
          <span className={`${percentageColor} flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-sm font-medium`}>
            {percentage}
          </span>
        </div>
      </div>
    </div>
  );
};

const StatsCards: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Overview</h3>
        </div>
      </div>
      <div className="grid rounded-2xl border border-gray-200 bg-white sm:grid-cols-2 xl:grid-cols-4 dark:border-gray-800 dark:bg-gray-900">
        <StatItem title="Total Revenue" value="$200,45.87" percentage="+2.5%" isPositive={true} />
        <StatItem title="Active Users" value="9,528" percentage="+9.5%" isPositive={true} />
        <StatItem title="Customer Lifetime Value" value="$849.54" percentage="-1.6%" isPositive={false} isSecondToLastInMobile={true} />
        <StatItem title="Customer Acquisition Cost" value="9,528" percentage="+3.5%" isPositive={true} isLast={true} />
      </div>
    </div>
  );
};

export default StatsCards; 