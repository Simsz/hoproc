import React, { CSSProperties, useState } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'corner';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Button component with brutalist styling options
 */
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Base variant classes
  const variantClasses = {
    primary: 'bg-[#e01414] text-white hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_0px_#111] active:shadow-[2px_2px_0px_0px_#111] active:translate-x-[4px] active:translate-y-[4px]',
    secondary: 'bg-[#1a1a1a] border-2 border-[#e01414] text-white hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_0px_#e01414] active:shadow-[2px_2px_0px_0px_#e01414] active:translate-x-[4px] active:translate-y-[4px]',
    accent: 'bg-[#1a1a1a] text-white hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_0px_#e01414] border-b-4 border-b-[#e01414]',
    corner: 'bg-[#1a1a1a] text-white hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_0px_#e01414] border-l-4 border-b-4 border-[#e01414]',
  };

  // Common button styling
  const baseClasses = 'text-xs font-bold uppercase tracking-wider px-4 py-2 transition-all duration-150 cursor-pointer flex items-center justify-center';

  return (
    <div className="relative inline-block">
      <button
        type={type}
        onClick={onClick}
        className={`${baseClasses} ${variantClasses[variant]} ${className} relative overflow-hidden`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
        
        {/* Holographic shader effect on hover */}
        {isHovered && (
          <div className="shader absolute inset-0 pointer-events-none">
            <div className="shader__layer specular">
              <div className="shader__layer mask" style={{
                background: variant === 'primary' 
                  ? 'radial-gradient(circle at top right, rgba(255,255,255,0.8), transparent 70%)'
                  : 'radial-gradient(circle at top right, rgba(224,20,20,0.5), transparent 70%)'
              }}></div>
            </div>
          </div>
        )}
        
        {/* Subtle noise overlay */}
        {isHovered && variant === 'primary' && (
          <div className="absolute inset-0 pointer-events-none opacity-10 z-10 vhs-noise"></div>
        )}
      </button>
      
      {/* Glitch effect for button corners */}
      {isHovered && (
        <>
          <div className="absolute w-2 h-2 bg-[#e01414] top-0 right-0 animate-pulse opacity-70"></div>
          <div className="absolute w-2 h-2 bg-[#e01414] bottom-0 left-0 animate-pulse opacity-70"></div>
        </>
      )}
    </div>
  );
};

export default Button; 