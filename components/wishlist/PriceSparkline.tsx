'use client';

interface PricePoint {
  price: number;
  checkedAt: number;
}

export function PriceSparkline({ history, targetPrice }: { history: PricePoint[]; targetPrice: number | null }) {
  if (history.length < 2) return null;

  const sorted = [...history].sort((a, b) => a.checkedAt - b.checkedAt).slice(-10);
  const prices = sorted.map((h) => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const W = 120;
  const H = 30;
  const pad = 2;

  const points = sorted.map((h, i) => {
    const x = pad + (i / (sorted.length - 1)) * (W - pad * 2);
    const y = pad + ((max - h.price) / range) * (H - pad * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const lastPrice = sorted[sorted.length - 1].price;
  const isAtOrBelowTarget = targetPrice !== null && lastPrice <= targetPrice;

  return (
    <svg width={W} height={H} className="overflow-visible">
      {targetPrice !== null && targetPrice >= min && targetPrice <= max && (
        <line
          x1={pad}
          x2={W - pad}
          y1={pad + ((max - targetPrice) / range) * (H - pad * 2)}
          y2={pad + ((max - targetPrice) / range) * (H - pad * 2)}
          stroke="#22c55e"
          strokeWidth="1"
          strokeDasharray="3,2"
          opacity={0.6}
        />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={isAtOrBelowTarget ? '#22c55e' : '#94a3b8'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {sorted.map((h, i) => {
        const [x, y] = points[i].split(',').map(Number);
        return (
          <circle key={i} cx={x} cy={y} r={1.5}
            fill={isAtOrBelowTarget ? '#22c55e' : '#94a3b8'} />
        );
      })}
    </svg>
  );
}
