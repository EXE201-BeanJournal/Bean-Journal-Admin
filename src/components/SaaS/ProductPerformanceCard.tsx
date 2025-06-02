import React, { useState } from 'react';
import BarChartOne from '../charts/bar/BarChartOne'; 
import { ApexOptions } from 'apexcharts';

const ProductPerformanceCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'online' | 'newUsers'>('daily');

  const tabButtonClasses = (tabName: 'daily' | 'online' | 'newUsers') => {
    return `text-sm w-full rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white ${
      activeTab === tabName
        ? 'shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800'
        : 'text-gray-500 dark:text-gray-400'
    }`;
  };

  const barChartOptions: ApexOptions = {
    colors: ["#465FFF"], // Solid blue (Tailwind blue-500)
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "40%", // Made bars slimmer
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: false,
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
            colors: '#6B7280',
            fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        show: true, // Show Y-axis labels as per image
        style: {
          colors: '#6B7280',
          fontSize: '12px'
        },
        formatter: (val) => String(Math.floor(val)), // Format to whole numbers
      },
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 4,
      yaxis: {
        lines: {
          show: true, 
        },
      },
      xaxis: {
        lines: {
            show: false
        }
      }
    },
    tooltip: {
      enabled: true,
      x: {
        show: false, // Hide x-axis category from tooltip body
      },
      y: {
        formatter: (val: number) => String(val), // Show plain number
        title: {
          formatter: (seriesName: string) => seriesName ? `${seriesName}:` : '' // Ensure series name is shown
        }
      },
      marker: { 
        show: true // Show color marker in tooltip
      }
    },
    legend: {
        show: false // Legend itself is hidden, series name shown in tooltip
    }
  };

  const barChartSeries = [
    {
      name: "Sales", // Changed series name
      data: [168, 385, 201, 298, 187, 195, 152], // Example data, last value adjusted to fit image example
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Product Performance</h3>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle">
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6"><path fillRule="evenodd" clipRule="evenodd" d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 11.9941 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z" fill="currentColor"></path></svg>
          </button>
        </div>
      </div>
      
      <div>
        <div className="flex w-full items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
          <button onClick={() => setActiveTab('daily')} className={tabButtonClasses('daily')}>Daily Sales</button>
          <button onClick={() => setActiveTab('online')} className={tabButtonClasses('online')}>Online Sales</button>
          <button onClick={() => setActiveTab('newUsers')} className={tabButtonClasses('newUsers')}>New Users</button>
        </div>

        <div className="mt-4">
          {activeTab === 'daily' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 justify-between gap-10 divide-x divide-gray-100 rounded-xl border border-gray-100 bg-white py-4 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-800/[0.03]">
                <div className="px-5">
                  <span className="block text-sm text-gray-500 dark:text-gray-400">Digital Product</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="bg-success-50 dark:bg-success-500/15 text-success-600 inline-flex size-5 items-center justify-center rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M5.56462 1.62411C5.70194 1.47091 5.90136 1.37451 6.12329 1.37451C6.1236 1.37451 6.1239 1.37451 6.12421 1.37451C6.3163 1.37434 6.50845 1.4475 6.65505 1.594L9.65514 4.59199C9.94814 4.88478 9.94831 5.35966 9.65552 5.65265C9.36272 5.94565 8.88785 5.94581 8.59486 5.65302L6.87329 3.93267L6.87329 10.1252C6.87329 10.5394 6.53751 10.8752 6.12329 10.8752C5.70908 10.8752 5.37329 10.5394 5.37329 10.1252L5.37329 3.93597L3.65516 5.65301C3.36218 5.94581 2.8873 5.94566 2.5945 5.65267C2.3017 5.35968 2.30185 4.88481 2.59484 4.59201L5.56462 1.62411Z" fill="currentColor"></path></svg>
                    </span>
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">790</h4>
                  </div>
                </div>
                <div className="px-5">
                  <span className="block text-sm text-gray-500 dark:text-gray-400">Physical Product</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="bg-error-50 dark:bg-error-500/15 text-error-600 inline-flex size-5 items-center justify-center rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C5.8736 10.6257 5.8739 10.6257 5.87421 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753L6.62329 1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875L5.12329 8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z" fill="currentColor"></path></svg>
                    </span>
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">572</h4>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 px-5 py-4 dark:border-gray-800">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Daily Sales</span>
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">$2,950</h3>
                  </div>
                  <div>
                    <span className="bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500 flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-sm font-medium">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C5.8736 10.6257 5.8739 10.6257 5.87421 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753L6.62329 1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875L5.12329 8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z" fill="currentColor"></path></svg> 
                      0.52%
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto -ml-3">
                  <BarChartOne 
                    options={barChartOptions}
                    series={barChartSeries}
                    type="bar"
                    height={215}
                    width="100%"
                  />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'online' && <div className="p-4 text-center">Content for Online Sales (Placeholder)</div>}
          {activeTab === 'newUsers' && <div className="p-4 text-center">Content for New Users (Placeholder)</div>}
        </div>
      </div>
    </div>
  );
};

export default ProductPerformanceCard; 