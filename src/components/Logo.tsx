import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 120 }: LogoProps) {
  // Brand Colors matching the logo:
  // Dark Slate Blue: #1e293b or #1f3d54
  const darkBlue = "#1f3d54";
  const white = "#ffffff";

  return (
    <div 
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      id="brand-logo-container"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-sm hover:drop-shadow-md transition-all duration-300"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circular Clip Paths for Horizontal Split Background */}
        <defs>
          <clipPath id="top-half">
            <rect x="0" y="0" width="200" height="100" />
          </clipPath>
          <clipPath id="bottom-half">
            <rect x="0" y="100" width="200" height="100" />
          </clipPath>
          
          {/* Paths for text-on-curve */}
          {/* Top curve: From left to right (clockwise) */}
          <path
            id="textPath-top"
            d="M 28,100 A 72,72 0 0,1 172,100"
            fill="none"
          />
          {/* Bottom curve: From left to right (counter-clockwise/upside-down) or custom curve to prevent upside down reading */}
          {/* In SVG, to write RTL or correctly oriented curved text along the bottom, we can use a left-to-right bottom arc */}
          <path
            id="textPath-bottom"
            d="M 172,100 A 72,72 0 0,1 28,100"
            fill="none"
          />
        </defs>

        {/* Base Background Circle */}
        <circle cx="100" cy="100" r="92" fill={white} stroke={darkBlue} strokeWidth="4" />

        {/* Bottom Half Background (Dark Blue) */}
        <circle cx="100" cy="100" r="92" fill={darkBlue} clipPath="url(#bottom-half)" />

        {/* Middle divider line */}
        <line x1="8" y1="100" x2="192" y2="100" stroke={darkBlue} strokeWidth="4" />

        {/* Circular borders for text area */}
        <circle cx="100" cy="100" r="80" fill="none" stroke={darkBlue} strokeWidth="1.5" clipPath="url(#top-half)" />
        <circle cx="100" cy="100" r="80" fill="none" stroke={white} strokeWidth="1.5" clipPath="url(#bottom-half)" />

        {/* Top Text: RAHKAR PADIDEH ABAN (Dark Blue) */}
        <text
          fontFamily="'Inter', 'Space Grotesk', sans-serif"
          fontSize="11.5"
          fontWeight="500"
          letterSpacing="5"
          fill={darkBlue}
          clipPath="url(#top-half)"
        >
          <textPath href="#textPath-top" startOffset="50%" textAnchor="middle">
            RAHKAR PADIDEH ABAN
          </textPath>
        </text>

        {/* Bottom Text: RAHKAR PADIDEH ABAN (White) */}
        <text
          fontFamily="'Inter', 'Space Grotesk', sans-serif"
          fontSize="11.5"
          fontWeight="500"
          letterSpacing="5"
          fill={white}
          clipPath="url(#bottom-half)"
        >
          <textPath href="#textPath-bottom" startOffset="50%" textAnchor="middle">
            RAHKAR PADIDEH ABAN
          </textPath>
        </text>

        {/* Inner Circle Frame (Divided horizontally as well) */}
        <circle cx="100" cy="100" r="52" fill={white} stroke={darkBlue} strokeWidth="3" />
        <circle cx="100" cy="100" r="52" fill={darkBlue} stroke={white} strokeWidth="3" clipPath="url(#bottom-half)" />

        {/* RPA Custom Monogram Letters in center */}
        {/* We can craft a high-fidelity vector representation of the custom interlocking RPA letters */}
        {/* R letter (Left) */}
        <path
          d="M 72,138 L 72,66 L 85,66 C 92,66 96,69 96,75 C 96,81 92,84 85,84 L 72,84 M 82,84 L 95,138"
          stroke={darkBlue}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          clipPath="url(#top-half)"
        />
        <path
          d="M 72,138 L 72,66 L 85,66 C 92,66 96,69 96,75 C 96,81 92,84 85,84 L 72,84 M 82,84 L 95,138"
          stroke={white}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          clipPath="url(#bottom-half)"
        />

        {/* P letter (Middle) */}
        <path
          d="M 97,138 L 97,66 L 110,66 C 117,66 122,69 122,76 C 122,83 117,86 110,86 L 97,86"
          stroke={darkBlue}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          clipPath="url(#top-half)"
        />
        <path
          d="M 97,138 L 97,66 L 110,66 C 117,66 122,69 122,76 C 122,83 117,86 110,86 L 97,86"
          stroke={white}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          clipPath="url(#bottom-half)"
        />

        {/* A letter (Right) */}
        <path
          d="M 116,138 L 126,66 L 136,138 M 120,110 L 132,110"
          stroke={darkBlue}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          clipPath="url(#top-half)"
        />
        <path
          d="M 116,138 L 126,66 L 136,138 M 120,110 L 132,110"
          stroke={white}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          clipPath="url(#bottom-half)"
        />
      </svg>
    </div>
  );
}
