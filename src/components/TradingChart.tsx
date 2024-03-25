import {
  createChart,
  isUTCTimestamp,
  isBusinessDay,
  Time,
  TimeChartOptions,
  DeepPartial,
  ColorType,
} from "lightweight-charts";
import React, { useEffect, useRef } from "react";
import { SessionHighlighting } from "../plugins/session-highlighting/session-highlighting";

interface DataItem {
  date: string;
  pnl: number;
  cumsum: number;
}

interface ReferenceDataItem {
  Start_Date: string;
  End_Date: string;
  isHighlightes?: boolean;
}

const TradingChart: React.FC<{
  data: DataItem[];
  referenceDate: ReferenceDataItem[];
}> = ({ data, referenceDate }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function getDate(time: Time) {
      if (isUTCTimestamp(time)) {
        return new Date(time * 1000);
      } else if (isBusinessDay(time)) {
        return new Date(time.year, time.month, time.day);
      } else {
        return new Date(time);
      }
    }

    let highlights: ReferenceDataItem[] = referenceDate.sort((a, b) => {
      return (
        new Date(a.Start_Date).getTime() - new Date(b.Start_Date).getTime()
      );
    });
    highlights.forEach((item, index) => {
      if (index % 2 === 0) {
        item.isHighlightes = true;
      }
    });

    const sessionHighlighter = (time: Time) => {
      const date = getDate(time);
      let referenceItem = highlights.find((item) => {
        return (
          date.getTime() >= new Date(item.Start_Date).getTime() &&
          date.getTime() <= new Date(item.End_Date).getTime()
        );
      });
      if (referenceItem && referenceItem.isHighlightes === true) {
        // Weekend 🏖️
        return "rgba(255, 152, 1, 0.08)";
      }
      return "rgba(41, 98, 255, 0.08)";
    };

    if (chartContainerRef.current) {
      const chartOptions: DeepPartial<TimeChartOptions> = {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
        },
        leftPriceScale: {
          visible: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        rightPriceScale: {
          visible: false,
        },
        width: 700,
        height: 300,
      };

      const chart = createChart(chartContainerRef.current, chartOptions);
      const sessionHighlighting = new SessionHighlighting(sessionHighlighter);

      const newSeries = chart.addAreaSeries({
        lineColor: "#ff0400",
        topColor: "#f36361",
        bottomColor: "rgba(255, 41, 41, 0.052)",
      });

      const chartData = data.map((item) => ({
        time: item.date,
        value: item.cumsum,
      }));

      newSeries.setData(chartData);

      newSeries.attachPrimitive(sessionHighlighting);

      const watermark = document.createElement("div");
      watermark.style.position = "absolute";
      watermark.style.zIndex = "1";
      watermark.style.top = "80%";
      watermark.style.left = "100%";
      watermark.style.transform = "translate(-50%, -50%)";
      watermark.style.width = "200px";
      watermark.style.height = "100px";
      watermark.style.backgroundImage = `url("/logo_white.png")`;
      watermark.style.backgroundRepeat = "no-repeat";
      watermark.style.backgroundSize = "contain";
      watermark.style.opacity = "0.2";
      chartContainerRef.current.style.position = "relative";
      chartContainerRef.current.appendChild(watermark);

      return () => {
        chart.remove();
      };
    }
  }, [data, referenceDate]);

  return <div ref={chartContainerRef}></div>;
};

export default TradingChart;
