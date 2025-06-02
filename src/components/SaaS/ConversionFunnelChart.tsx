import React from 'react';
import BarChartOne from '../charts/bar/BarChartOne';
import { ApexOptions } from 'apexcharts';

// Interface for the parameters passed to the tooltip.y.formatter
interface TooltipYFormatterParams {
  series: Array<{ name?: string }>; // We expect an array of series objects, each might have a name.
  seriesIndex: number;
  // dataPointIndex?: number; // Add if needed later
  // w?: any; // Add if needed later (ApexCharts chart instance)
}

interface LegendItemProps {
  color: string;
  label: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label }) => (
  <div className="flex items-center">
    <span className={`mr-2 inline-block size-3 rounded-full`} style={{ backgroundColor: color }}></span>
    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
  </div>
);

const ConversionFunnelChart: React.FC = () => {

  const funnelSeries = [
    {
      name: 'Ad Impressions',
      data: [44, 55, 41, 37, 22, 43, 21, 40],
    },
    {
      name: 'Website Session',
      data: [13, 23, 20, 8, 13, 27, 33, 24],
    },
    {
      name: 'App Download',
      data: [11, 17, 15, 15, 21, 14, 15, 13],
    },
    {
      name: 'New Users',
      data: [22, 7, 25, 13, 22, 8, 10, 9],
    },
  ];

  const seriesColors = ['#2A31D8', '#465FFF', '#7592FF', '#C2D6FF'];

  const funnelChartOptions: ApexOptions = {
    colors: seriesColors,
    chart: {
      type: 'bar',
      height: 330,
      fontFamily: "Outfit, sans-serif",
      stacked: true,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '40%',
        borderRadius: 10,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'all',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: false,
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: '#6B7280',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      min: 0,
      max: 120,
      tickAmount: 6,
      labels: {
        style: {
          colors: '#6B7280',
          fontSize: '12px'
        },
        formatter: (value) => String(Math.round(value)),
      },
    },
    legend: {
      show: false,
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
          show: false,
        },
      },
    },
    tooltip: {
      enabled: true,
      shared: false,
      intersect: true,
      x: {
        formatter: function(val, { dataPointIndex, w }) {
          if (w.globals.categoryLabels && w.globals.categoryLabels[dataPointIndex]) {
            return w.globals.categoryLabels[dataPointIndex];
          }
          return String(val);
        }
      },
      y: {
        formatter: (val: number, { series, seriesIndex }: TooltipYFormatterParams) => {
          if (series && series[seriesIndex] && series[seriesIndex].name) {
            return `${series[seriesIndex].name}: ${val}`;
          }
          return String(val);
        },
      },
      marker: {
        show: true,
      }
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-y-3 gap-x-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Conversion Funnel</h3>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {funnelSeries.map((series, index) => (
            <LegendItem key={series.name} color={seriesColors[index]} label={series.name || ''} />
          ))}
        </div>
      </div>

      <div className="-ml-3 overflow-x-auto custom-scrollbar">
        <BarChartOne 
          options={funnelChartOptions} 
          series={funnelSeries} 
          type="bar" 
          height={330} 
          width="100%"
        />
      </div>
    </div>
  );
};

export default ConversionFunnelChart; 