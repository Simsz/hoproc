import React from 'react';

const Astronaut: React.FC = () => {
  return (
    <svg
      width="200"
      height="300"
      viewBox="0 0 200 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="astronaut-svg"
    >
      {/* Helmet */}
      <ellipse cx="100" cy="80" rx="45" ry="50" fill="#f5f5f5" fillOpacity="0.8" />
      <ellipse cx="100" cy="80" rx="38" ry="43" fill="#111111" fillOpacity="0.7" />
      
      {/* Body/Suit */}
      <path
        d="M55 110C55 110 60 150 60 180C60 210 80 240 100 240C120 240 140 210 140 180C140 150 145 110 145 110"
        fill="#f5f5f5"
      />
      
      {/* Backpack */}
      <rect x="70" y="120" width="60" height="70" rx="10" fill="#cecece" />
      <rect x="85" y="130" width="30" height="40" rx="5" fill="#a0a0a0" />
      <circle cx="100" cy="150" r="8" fill="#333333" />
      
      {/* Arms */}
      <path
        d="M55 120C55 120 35 140 30 160C25 180 30 200 40 210"
        stroke="#f5f5f5"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <path
        d="M145 120C145 120 165 140 170 160C175 180 170 200 160 210"
        stroke="#f5f5f5"
        strokeWidth="20"
        strokeLinecap="round"
      />
      
      {/* Legs */}
      <path
        d="M85 240C85 240 75 260 80 280"
        stroke="#f5f5f5"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path
        d="M115 240C115 240 125 260 120 280"
        stroke="#f5f5f5"
        strokeWidth="15"
        strokeLinecap="round"
      />
      
      {/* Helmet Reflection */}
      <path
        d="M75 60C85 50 115 50 125 60"
        stroke="#ffffff"
        strokeWidth="2"
        strokeOpacity="0.8"
      />
      <path
        d="M80 50C90 40 110 40 120 50"
        stroke="#ffffff"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      
      {/* Red Lights/Accents */}
      <circle cx="65" cy="100" r="3" fill="#e01414" className="pulse-light" />
      <circle cx="135" cy="100" r="3" fill="#e01414" className="pulse-light" />
      <rect x="90" cy="190" width="20" height="5" rx="2" fill="#e01414" className="pulse-light" />
      
      <style jsx>{`
        .astronaut-svg {
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
        }
        .pulse-light {
          animation: pulse-light 2s infinite;
        }
        @keyframes pulse-light {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </svg>
  );
};

export default Astronaut; 