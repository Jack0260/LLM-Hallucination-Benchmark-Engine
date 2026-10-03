interface RadarChartProps {
  data: { label: string; values: { name: string; color: string; value: number }[] }[];
  max?: number;
  size?: number;
}

export function RadarChart({ data, max = 100, size = 320 }: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 50;
  const angleStep = (2 * Math.PI) / data.length;

  const getPoint = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const getAxisPoint = (index: number, r: number = radius) => {
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Grid rings at 25%, 50%, 75%, 100%
  const ringValues = [0.25, 0.5, 0.75, 1.0];

  // Collect all series names
  const seriesNames = data.length > 0 ? data[0].values.map((v) => v.name) : [];
  const seriesColors = data.length > 0 ? data[0].values.map((v) => v.color) : [];

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Grid rings */}
        {ringValues.map((ring, ri) => {
          const r = ring * radius;
          const points = data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');
          return (
            <polygon
              key={ri}
              points={points}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth={0.5}
              strokeDasharray={ri === ringValues.length - 1 ? '0' : '3 3'}
            />
          );
        })}

        {/* Axis lines */}
        {data.map((_, i) => {
          const p = getAxisPoint(i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="var(--border-color)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Axis labels */}
        {data.map((item, i) => {
          const p = getAxisPoint(i, radius + 25);
          const label = item.label.length > 16 ? item.label.slice(0, 14) + '...' : item.label;
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill="var(--text-secondary)"
            >
              {label}
            </text>
          );
        })}

        {/* Data polygons */}
        {seriesNames.map((_, si) => {
          const points = data.map((item, i) => {
            const val = item.values[si]?.value ?? 0;
            const p = getPoint(val, i);
            return `${p.x},${p.y}`;
          }).join(' ');
          const color = seriesColors[si];
          return (
            <g key={si}>
              <polygon
                points={points}
                fill={color}
                fillOpacity={0.12}
                stroke={color}
                strokeWidth={2}
              />
              {data.map((item, i) => {
                const val = item.values[si]?.value ?? 0;
                const p = getPoint(val, i);
                return (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    fill={color}
                  >
                    <title>{`${seriesNames[si]} - ${item.label}: ${val}`}</title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        {seriesNames.map((name, si) => (
          <div key={si} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: seriesColors[si] }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
