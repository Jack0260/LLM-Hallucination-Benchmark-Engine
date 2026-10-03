interface BarChartProps {
  data: { label: string; value: number; color: string; secondary?: number }[];
  height?: number;
  max?: number;
  showSecondary?: boolean;
}

export function BarChart({ data, height = 240, max = 100, showSecondary }: BarChartProps) {
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 50, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barWidth = data.length > 0 ? (chartW / data.length) * 0.6 : 0;
  const barGap = data.length > 0 ? (chartW / data.length) * 0.4 : 0;

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (max * i) / yTicks);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 400 }}>
        {/* Y axis grid */}
        {yTickValues.map((tick, i) => {
          const y = padding.top + chartH - (tick / max) * chartH;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--border-color)"
                strokeWidth={0.5}
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="var(--text-muted)"
                fontFamily="JetBrains Mono, monospace"
              >
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, i) => {
          const x = padding.left + i * (barWidth + barGap) + barGap / 2;
          const barH = (item.value / max) * chartH;
          const y = padding.top + chartH - barH;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={item.color}
                opacity={0.85}
              >
                <title>{`${item.label}: ${item.value}`}</title>
              </rect>
              {showSecondary && item.secondary !== undefined && (
                <rect
                  x={x + barWidth / 2}
                  y={padding.top + chartH - (item.secondary / max) * chartH}
                  width={barWidth / 2}
                  height={(item.secondary / max) * chartH}
                  rx={4}
                  fill={item.color}
                  opacity={0.4}
                >
                  <title>{`${item.label} (secondary): ${item.secondary}`}</title>
                </rect>
              )}
              <text
                x={x + barWidth / 2}
                y={padding.top + chartH - barH - 6}
                textAnchor="middle"
                fontSize={10}
                fill="var(--text-primary)"
                fontFamily="JetBrains Mono, monospace"
                fontWeight={600}
              >
                {item.value}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                fontSize={10}
                fill="var(--text-muted)"
              >
                {item.label.length > 14 ? item.label.slice(0, 12) + '...' : item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
