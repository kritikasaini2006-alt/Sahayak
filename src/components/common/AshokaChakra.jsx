import React from 'react';

/**
 * AshokaChakra
 * Symmetrical 24-spoke Ashoka Chakra vector SVG.
 * Designed with mathematically exact 15-degree spokes (24 * 15° = 360°), central hub,
 * and circular outer ring.
 * Rendered in Ashoka Chakra Deep Blue (#315D9B) with a transparent background.
 */
export default function AshokaChakra({
  className = 'w-[440px] h-[440px] text-[#315D9B]',
  color = '#315D9B',
  ariaHidden = true,
  ...props
}) {
  // Exactly 24 spokes (360 degrees / 24 = 15 degrees per spoke)
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={ariaHidden}
      role={ariaHidden ? 'presentation' : 'img'}
      aria-label={ariaHidden ? undefined : 'Ashoka Chakra'}
      {...props}
    >
      <g stroke={color} fill={color}>
        {/* Outer concentric rim borders */}
        <circle
          cx="250"
          cy="250"
          r="228"
          fill="none"
          strokeWidth="3.5"
        />
        <circle
          cx="250"
          cy="250"
          r="215"
          fill="none"
          strokeWidth="11"
        />
        <circle
          cx="250"
          cy="250"
          r="202"
          fill="none"
          strokeWidth="2.5"
        />

        {/* Central Hub */}
        <circle
          cx="250"
          cy="250"
          r="36"
          fill="none"
          strokeWidth="6"
        />
        <circle
          cx="250"
          cy="250"
          r="14"
          fill={color}
          stroke="none"
        />

        {/* 24 Symmetrical Spokes and traditional 24 rim beads */}
        {spokes.map((angle) => (
          <g key={angle} transform={`rotate(${angle} 250 250)`}>
            {/* Spoke: tapered lanceolate shape extending from hub (r=36) to rim (r=202) */}
            <polygon
              points="246.5,214 253.5,214 251.2,50 248.8,50"
              fill={color}
              stroke="none"
            />
            {/* Fine central spine for crisp definition */}
            <line
              x1="250"
              y1="214"
              x2="250"
              y2="49"
              strokeWidth="1"
              stroke="#FAF8F1"
              strokeOpacity="0.35"
            />
            {/* Traditional bead/notch at outer rim between spokes */}
            <circle
              cx="250"
              cy="48"
              r="4.5"
              fill={color}
              stroke="none"
              transform="rotate(7.5 250 250)"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
