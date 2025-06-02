import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface BarChartProps {
  options?: ApexOptions;
  series: ApexOptions['series'];
  height?: string | number;
  type?: "line" | "area" | "bar" | "pie" | "donut" | "radialBar" | "scatter" | "bubble" | "heatmap" | "candlestick" | "boxPlot" | "radar" | "polarArea" | "rangeBar" | "rangeArea" | "treemap";
  width?: string | number;
}

const defaultOptions: ApexOptions = {
  colors: ["#465fff"],
  chart: {
    fontFamily: "Outfit, sans-serif",
    type: "bar",
    height: 180,
    toolbar: {
      show: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "39%",
      borderRadius: 5,
      borderRadiusApplication: "end",
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 4,
    colors: ["transparent"],
  },
  xaxis: {
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
  },
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "left",
    fontFamily: "Outfit",
  },
  yaxis: {
    title: {
      text: undefined,
    },
  },
  grid: {
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  fill: {
    opacity: 1,
  },
  tooltip: {
    x: {
      show: false,
    },
    y: {
      formatter: (val: number) => `${val}`,
    },
  },
};

const defaultSeries = [
  {
    name: "Sales",
    data: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112],
  },
];

export default function BarChartOne({
  options,
  series,
  height,
  type,
  width,
}: BarChartProps) {
  const chartOptions = { ...defaultOptions, ...options };
  const chartSeries = series || defaultSeries;
  const chartHeight = height || defaultOptions.chart?.height;
  const chartType = type || defaultOptions.chart?.type as BarChartProps['type'];
  const chartWidth = width;

  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div id="barChartOne" className={width ? '' : 'min-w-[700px] sm:min-w-[800px] md:min-w-[1000px]'}>
        <Chart 
            options={chartOptions} 
            series={chartSeries} 
            type={chartType} 
            height={chartHeight} 
            width={chartWidth}
        />
      </div>
    </div>
  );
}
