import React from "react";

interface AitamLogoProps {
  className?: string;
  showText?: boolean;
  lightMode?: boolean;
}

export default function AitamLogo({ className = "w-10 h-10", showText = true, lightMode = false }: AitamLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        className={className}
        fill="none"
      >
        <defs>
          <linearGradient id="aitam-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" /> {/* Red/Rose */}
            <stop offset="50%" stopColor="#6366f1" /> {/* Indigo */}
            <stop offset="100%" stopColor="#a855f7" /> {/* Purple */}
          </linearGradient>
          <filter id="aitam-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" floodColor="#6366f1" />
          </filter>
        </defs>

        {/* Outer Tech Ring / Gear Dash */}
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="url(#aitam-grad)"
          strokeWidth="3.5"
          strokeDasharray="6 4"
          className="origin-center animate-[spin_60s_linear_infinite]"
        />

        {/* Inner Tech Circle */}
        <circle
          cx="50"
          cy="50"
          r="34"
          stroke="url(#aitam-grad)"
          strokeWidth="1.5"
          opacity="0.4"
        />

        {/* Stylized A Triangle */}
        <path
          d="M50 18 L25 72 L37 72 L50 44 L63 72 L75 72 Z"
          fill="url(#aitam-grad)"
          filter="url(#aitam-shadow)"
        />

        {/* Tech Node Crossbar */}
        <path
          d="M37 56 H63"
          stroke={lightMode ? "#0f172a" : "#ffffff"}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle
          cx="50"
          cy="56"
          r="5"
          fill="url(#aitam-grad)"
          stroke={lightMode ? "#0f172a" : "#ffffff"}
          strokeWidth="2"
        />

        {/* Floating Top Peak Node */}
        <circle cx="50" cy="33" r="3" fill="#ffffff" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight select-none">
          <span className={`text-lg font-black tracking-wider ${lightMode ? "text-white" : "text-slate-900"}`}>
            ClassVault
          </span>
          <span className={`text-[8px] font-bold tracking-[0.2em] uppercase ${lightMode ? "text-slate-400" : "text-slate-500"}`}>
            AITAM
          </span>
        </div>
      )}
    </div>
  );
}
