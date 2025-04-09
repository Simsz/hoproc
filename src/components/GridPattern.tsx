import React from 'react';

interface GridPatternProps {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
  variant?: 'standard' | 'circuit' | 'brutalist';
}

/**
 * A component that renders a grid pattern background
 * to enhance the futuristic sci-fi look with brutalist elements
 */
const GridPattern: React.FC<GridPatternProps> = ({
  size = 30,
  color = 'rgba(224, 20, 20, 0.2)',
  opacity = 0.2,
  className = '',
  variant = 'standard',
}) => {
  const renderStandardGrid = () => (
    <div
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(to right, ${color} 1px, transparent 1px),
          linear-gradient(to bottom, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
        opacity,
      }}
      aria-hidden="true"
    />
  );

  const renderCircuitGrid = () => (
    <div
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <div
        style={{
          backgroundImage: `
            linear-gradient(to right, ${color} 1px, transparent 1px),
            linear-gradient(to bottom, ${color} 1px, transparent 1px)
          `,
          backgroundSize: `${size}px ${size}px`,
          height: '100%',
          width: '100%',
          position: 'absolute',
        }}
      />
      
      {/* Circuit nodes */}
      <div
        style={{
          backgroundImage: `radial-gradient(circle, ${color} 2px, transparent 2px)`,
          backgroundSize: `${size}px ${size}px`,
          backgroundPosition: `${size / 2}px ${size / 2}px`,
          height: '100%',
          width: '100%',
          position: 'absolute',
          opacity: 0.7,
        }}
      />
      
      {/* Rochester-inspired diagonal lines */}
      <div
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 85%, ${color} 85%, ${color} 86%, transparent 86%),
            linear-gradient(-45deg, transparent 85%, ${color} 85%, ${color} 86%, transparent 86%)
          `,
          backgroundSize: `${size * 3}px ${size * 3}px`,
          height: '100%',
          width: '100%',
          position: 'absolute',
          opacity: 0.5,
        }}
      />
    </div>
  );

  const renderBrutalistGrid = () => (
    <div
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Base grid */}
      <div
        style={{
          backgroundImage: `
            linear-gradient(to right, ${color} 1px, transparent 1px),
            linear-gradient(to bottom, ${color} 1px, transparent 1px)
          `,
          backgroundSize: `${size * 2}px ${size * 2}px`,
          height: '100%',
          width: '100%',
          position: 'absolute',
        }}
      />
      
      {/* Glitch effect lines */}
      <div
        style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 98%, ${color} 98%, ${color} 100%, transparent 100%)
          `,
          backgroundSize: `${size * 8}px ${size * 12}px`,
          backgroundPosition: 'center',
          height: '100%',
          width: '100%',
          position: 'absolute',
          opacity: 0.7,
        }}
      />
      
      {/* Rochester symbol - flower city diamond shapes */}
      <div
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 70%, ${color} 70%, ${color} 72%, transparent 72%),
            linear-gradient(-45deg, transparent 70%, ${color} 70%, ${color} 72%, transparent 72%),
            linear-gradient(135deg, transparent 70%, ${color} 70%, ${color} 72%, transparent 72%),
            linear-gradient(-135deg, transparent 70%, ${color} 70%, ${color} 72%, transparent 72%)
          `,
          backgroundSize: `${size * 6}px ${size * 6}px`,
          backgroundPosition: 'center',
          height: '100%',
          width: '100%',
          position: 'absolute',
          opacity: 0.4,
        }}
      />
    </div>
  );

  // Render the appropriate grid pattern based on variant
  if (variant === 'circuit') return renderCircuitGrid();
  if (variant === 'brutalist') return renderBrutalistGrid();
  return renderStandardGrid();
};

export default GridPattern; 