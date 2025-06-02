import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface LineChartProps {
  options?: ApexOptions;
  series: ApexOptions['series'];
  height?: string | number;
  type?: "line" | "area" | "bar" | "pie" | "donut" | "radialBar" | "scatter" | "bubble" | "heatmap" | "candlestick" | "boxPlot" | "radar" | "polarArea" | "rangeBar" | "rangeArea" | "treemap";
  width?: string | number;
  idSuffix?: string; // For unique IDs if multiple charts on one page
}

const defaultOptions: ApexOptions = {
  legend: {
    show: false,
    position: "top",
    horizontalAlign: "left",
  },
  colors: ["#465FFF", "#9CB9FF"],
  chart: {
    fontFamily: "Outfit, sans-serif",
    height: 310,
    type: "line",
    toolbar: {
      show: false,
    },
  },
  stroke: {
    curve: "straight",
    width: [2, 2],
  },
  fill: {
    type: "gradient",
    gradient: {
      opacityFrom: 0.55,
      opacityTo: 0,
    },
  },
  markers: {
    size: 0,
    strokeColors: "#fff",
    strokeWidth: 2,
    hover: {
      size: 6,
    },
  },
  grid: {
    xaxis: {
      lines: {
        show: false,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    enabled: true,
    x: {
      format: "dd MMM yyyy",
    },
  },
  xaxis: {
    type: "category",
    categories: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    tooltip: {
      enabled: false,
    },
  },
  yaxis: {
    labels: {
      style: {
        fontSize: "12px",
        colors: ["#6B7280"],
      },
    },
    title: {
      text: "",
      style: {
        fontSize: "0px",
      },
    },
  },
};

const defaultSeries = [
  {
    name: "Sales",
    data: [180, 190, 170, 160, 175, 165, 170, 205, 230, 210, 240, 235],
  },
  {
    name: "Revenue",
    data: [40, 30, 50, 40, 55, 40, 70, 100, 110, 120, 150, 140],
  },
];

export default function LineChartOne({
  options,
  series,
  height,
  type,
  width,
  idSuffix // Unique suffix for chart ID
}: LineChartProps) {
  // Deep merge options, giving precedence to user-provided options
  const mergedOptions = JSON.parse(JSON.stringify(defaultOptions)) as ApexOptions;
  if (options) {
    (Object.keys(options) as Array<keyof ApexOptions>).forEach(key => {
      if (typeof options[key] === 'object' && options[key] !== null && !Array.isArray(options[key]) && mergedOptions[key] && typeof mergedOptions[key] === 'object') {
        // @ts-expect-error - Complex type merging, accepting potential type looseness here for pragmatic merge
        mergedOptions[key] = { ...mergedOptions[key] as object, ...options[key] as object };
      } else {
        // @ts-expect-error - Complex type merging, accepting potential type looseness here for pragmatic merge
        mergedOptions[key] = options[key];
      }
    });
  }
  // Specifically ensure chart sub-options are merged if provided
  if (options?.chart) {
    mergedOptions.chart = { ...defaultOptions.chart, ...options.chart };
  }

  const chartSeries = series || defaultSeries;
  const chartHeight = height || mergedOptions.chart?.height;
  const chartType = type || mergedOptions.chart?.type as LineChartProps['type'];
  const chartWidth = width;

  const isSparkline = mergedOptions.chart?.sparkline?.enabled;

  const chartWrapperId = `lineChartOne-${idSuffix || Math.random().toString(36).substring(7)}`;

  // For sparklines, the container should be simple and let the parent dictate size
  if (isSparkline) {
    return (
      <div style={{ width: chartWidth || '100%', height: chartHeight || 'auto' }} id={chartWrapperId}>
        <Chart 
            options={mergedOptions} 
            series={chartSeries} 
            type={chartType} 
            height={chartHeight}
            width="100%" // Sparkline chart itself should fill its direct wrapper
        />
      </div>
    );
  }

  // For regular charts, keep the scrollable wrapper if width is not constrained by parent
  return (
    <div className={`max-w-full ${chartWidth ? '' : 'overflow-x-auto custom-scrollbar min-w-[700px] sm:min-w-[800px] md:min-w-[1000px]'}`}>
      <div id={chartWrapperId}>
        <Chart 
            options={mergedOptions} 
            series={chartSeries} 
            type={chartType} 
            height={chartHeight} 
            width={chartWidth}
        />
      </div>
    </div>
  );
}
