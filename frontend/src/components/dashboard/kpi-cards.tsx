import React, { useState, useCallback, useRef } from "react";
import { Link } from "wouter";

interface ObsidianLiquidKpiCardProps {
  href: string;
  title: string;
  value: string | number;
  subtitle: string;
  badgeText: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface BrushedMercuryKpiCardProps {
  href: string;
  title: string;
  value: string | number;
  subtitle: string;
  badgeText: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Card 1: Primary Financial KPI Card in Liquid Glass Burgundy
 * - Deep refractive burgundy-chrome surface (.liquid-glass-burgundy)
 * - White tabular numerals + brushed rose-silver status badge
 * - Cursor-reactive specular light reflection
 */
export function ObsidianLiquidKpiCard({
  href,
  title,
  value,
  subtitle,
  badgeText,
  icon: Icon,
}: ObsidianLiquidKpiCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMousePos({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMousePos({ x: 50, y: 50 });
  }, []);

  return (
    <Link href={href} className="block group cursor-pointer h-full">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative h-full rounded-2xl liquid-burgundy-metal text-white overflow-hidden transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-12px_rgba(106,13,24,0.45)] flex flex-col justify-between p-5 space-y-4"
      >
        {/* Interactive Cursor-Tracking Specular Light Reflection */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0.35,
            background: `radial-gradient(240px circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.28), transparent 70%)`,
          }}
        />

        {/* Top Hairline Specular Highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        {/* Header Row: Title & Icon */}
        <div className="relative z-10 flex items-center justify-between text-xs text-rose-200/90 font-medium">
          <span>{title}</span>
          <Icon className="w-4 h-4 text-rose-200 group-hover:text-white transition-colors" />
        </div>

        {/* Body: Value and Brushed Rose-Silver Badge */}
        <div className="relative z-10 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-tabular">
              {value}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold text-[#6A0D18] bg-gradient-to-b from-white via-rose-50 to-rose-200 shadow-[inset_0_1px_0_#fff] shrink-0">
              {badgeText}
            </span>
          </div>
          <p className="text-xs text-rose-200/80 mt-1 font-normal">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

export const LiquidBurgundyKpiCard = ObsidianLiquidKpiCard;

/**
 * Cards 2, 3 & 4: Liquid Glass Light
 * - Specular frosted alabaster-mercury surface (.liquid-glass-light)
 * - Tabular numerals + crisp status badge
 * - Subtle hover sheen sweep across the surface
 */
export function BrushedMercuryKpiCard({
  href,
  title,
  value,
  subtitle,
  badgeText,
  icon: Icon,
}: BrushedMercuryKpiCardProps) {
  return (
    <Link href={href} className="block group cursor-pointer h-full">
      <div className="relative h-full rounded-2xl liquid-silver-card overflow-hidden transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between p-5 space-y-4">
        {/* Subtle Hover Sheen Sweep Across the Surface */}
        <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/60 dark:via-white/15 to-transparent" />

        {/* Top Edge Specular Reflection */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

        {/* Header Row */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          <span>{title}</span>
          <Icon className="w-4 h-4 text-zinc-500 group-hover:text-[#6A0D18] dark:text-zinc-400 dark:group-hover:text-[#E87985] transition-colors" />
        </div>

        {/* Body: Value and Status Pill */}
        <div className="relative z-10 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC] font-tabular">
              {value}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#FDF6F7] dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40 shrink-0">
              {badgeText}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-normal">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

export const LiquidLightKpiCard = BrushedMercuryKpiCard;
