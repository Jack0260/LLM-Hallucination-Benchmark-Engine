interface LineChartProps {
  series: { name: string; color: string; data: number[] }[];
  labels: string[];
  height?: number;
  yLabel?: string;
  yMax?: number;
  yMin?: number;
}

export function LineChart({ series, labels, height = 240, yLabel, yMax = 100, yMin = 0 }: LineChartProps) {
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const xStep = labels.length > 1 ? chartW / (labels.length - 1) : chartW;
  const yRange = yMax - yMin;

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => yMin + (yRange * i) / yTicks);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 400 }}>
        {/* Y axis grid lines and labels */}
        {yTickValues.map((tick, i) => {
          const y = padding.top + chartH - ((tick - yMin) / yRange) * chartH;
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

        {/* X axis labels */}
        {labels.map((label, i) => (
          <text
            key={i}
            x={padding.left + i * xStep}
            y={height - padding.bottom + 18}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-muted)"
          >
            {label.length > 12 ? label.slice(0, 10) + '...' : label}
          </text>
        ))}

        {/* Y axis label */}
        {yLabel && (
          <text
            x={-(height / 2)}
            y={14}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-muted)"
            transform="rotate(-90)"
          >
            {yLabel}
          </text>
        )}

        {/* Series lines */}
        {series.map((s, si) => {
          if (s.data.length === 0) return null;
          const points = s.data.map((val, i) => {
            const x = padding.left + i * xStep;
            const y = padding.top + chartH - ((val - yMin) / yRange) * chartH;
            return `${x},${y}`;
          });
          const pathD = `M ${points.join(' L ')}`;
          const areaD = `${pathD} L ${padding.left + (s.data.length - 1) * xStep},${padding.top + chartH} L ${padding.left},${padding.top + chartH} Z`;

          return (
            <g key={si}>
              <defs>
                <linearGradient id={`gradient-${si}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={areaD} fill={`url(#gradient-${si})`} />
              <path d={pathD} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {s.data.map((val, i) => {
                const x = padding.left + i * xStep;
                const y = padding.top + chartH - ((val - yMin) / yRange) * chartH;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={3.5} fill="var(--card-bg)" stroke={s.color} strokeWidth={2} />
                    <title>{`${s.name} - ${labels[i]}: ${val}`}</title>
                  </g>
                );
              })}
              {/* Legend */}
              <g transform={`translate(${width - padding.right - 100}, ${padding.top + si * 16})`}>
                <rect width={10} height={10} rx={2} fill={s.color} />
                <text x={14} y={9} fontSize={10} fill="var(--text-secondary)">
                  {s.name.length > 14 ? s.name.slice(0, 12) + '...' : s.name}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
