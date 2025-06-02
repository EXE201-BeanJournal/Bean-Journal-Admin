import React from 'react';
import LineChartOne from '../charts/line/LineChartOne';
import { ApexOptions } from 'apexcharts';

const UserGrowthCard: React.FC = () => {
  const chartOptions: ApexOptions = {
    legend: {
      show: false,
    },
    colors: ["#10B981"], // Using a success color
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
          return String(val);
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
      name: "User Growth",
      data: [20, 35, 25, 45, 30, 50, 40, 60], // Example data
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">User Growth</h3>
          <p className="text-theme-sm mt-1 text-gray-500 dark:text-gray-400">New signups website + mobile</p>
        </div>
      </div>
      <div className="flex justify-between">
        <div>
          <h3 className="text-title-xs font-semibold text-gray-800 dark:text-white/90">3,768</h3>
          <p className="text-theme-xs mt-1 text-gray-500 dark:text-gray-400">
            <span className="text-success-600 mr-1 inline-block">+3.85%</span>than last Week
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

export default UserGrowthCard; 