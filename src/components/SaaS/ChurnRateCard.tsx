import React from 'react';
import LineChartOne from '../charts/line/LineChartOne';
import { ApexOptions } from 'apexcharts';

const ChurnRateCard: React.FC = () => {
  const chartOptions: ApexOptions = {
    legend: {
      show: false,
    },
    colors: ["#EF4444"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "line",
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: true,
      }
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.6,
        opacityTo: 0.1,
      },
    },
    markers: {
      size: 0,
    },
    grid: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      theme: "light",
      style: {
        fontSize: '10px',
        fontFamily: 'Outfit, sans-serif',
      },
      x: {
        show: false,
      },
      y: {
        formatter: function (val) {
          const num = parseFloat(String(val));
          if (typeof num === 'number' && isFinite(num)) {
            return `${num.toFixed(2)}%`;
          }
          return 'N/A';
        },
        title: {
          formatter: function (seriesName) {
            return seriesName ? `${seriesName}:` : '';
          }
        }
      },
      marker: {
        show: false,
      }
    },
    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { show: false },
    },
  };

  const chartSeries = [
    {
      name: "Churn",
      data: [30, 40, 25, 50, 49, 21, 70, 51],
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Churn Rate</h3>
          <p className="text-theme-sm mt-1 text-gray-500 dark:text-gray-400">Downgrade to Free plan</p>
        </div>
      </div>
      <div className="flex justify-between">
        <div>
          <h3 className="text-title-xs font-semibold text-gray-800 dark:text-white/90">4.26%</h3>
          <p className="text-theme-xs mt-1 text-gray-500 dark:text-gray-400">
            <span className="text-error-500 mr-1 inline-block">0.31%</span>than last Week
          </p>
        </div>
        <div className="max-w-full w-24 h-12">
          <LineChartOne 
            options={chartOptions} 
            series={chartSeries} 
            height={50} 
            type="area" 
            width="100%"
          />
        </div>
      </div>
    </div>
  );
};

export default ChurnRateCard;