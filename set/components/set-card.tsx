import React from "react";
import { cn } from "@/lib/utils";
import { Card as UICard } from "@/components/ui/card";
import type { Card as CardType } from "@/lib/set-game-logic";

interface SetCardProps {
  card: CardType;
  isSelected: boolean;
  isWrong: boolean;
  onClick: () => void;
  small?: boolean;
}

export function Card({
  card,
  isSelected,
  isWrong,
  onClick,
  small = false,
}: SetCardProps) {
  const { color, shape, filling, number } = card;

  const getColorClass = (color: string) => {
    switch (color) {
      case "red":
        return "text-red-500 stroke-red-500 fill-red-500";
      case "green":
        return "text-emerald-500 stroke-emerald-500 fill-emerald-500";
      case "purple":
        return "text-violet-500 stroke-violet-500 fill-violet-500";
      default:
        return "text-slate-500 stroke-slate-500 fill-slate-500";
    }
  };

  const renderShape = (
    shape: string,
    filling: string,
    colorClass: string,
    size: number
  ) => {
    const strokeWidth = small ? "1.5" : "2";
    const patternId = `stripes-${color}-${shape}-${filling}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const baseProps = {
      width: size,
      height: size,
      className: colorClass,
    };

    const getShapeElement = () => {
      switch (shape) {
        case "circle":
          return (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 3}
              strokeWidth={strokeWidth}
              fill={
                filling === "filled"
                  ? "currentColor"
                  : filling === "striped"
                  ? `url(#${patternId})`
                  : "none"
              }
              stroke="currentColor"
              className="drop-shadow-sm"
            />
          );
        case "square":
          return (
            <rect
              x="3"
              y="3"
              width={size - 6}
              height={size - 6}
              rx="3"
              strokeWidth={strokeWidth}
              fill={
                filling === "filled"
                  ? "currentColor"
                  : filling === "striped"
                  ? `url(#${patternId})`
                  : "none"
              }
              stroke="currentColor"
              className="drop-shadow-sm"
            />
          );
        case "triangle":
          const points = `${size / 2},4 4,${size - 4} ${size - 4},${size - 4}`;
          return (
            <polygon
              points={points}
              strokeWidth={strokeWidth}
              fill={
                filling === "filled"
                  ? "currentColor"
                  : filling === "striped"
                  ? `url(#${patternId})`
                  : "none"
              }
              stroke="currentColor"
              className="drop-shadow-sm"
            />
          );
        default:
          return null;
      }
    };

    return (
      <svg {...baseProps} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width="4"
            height="4"
            patternTransform="rotate(45)"
          >
            <rect width="4" height="4" fill="none" />
            <line
              x1="0"
              y1="2"
              x2="4"
              y2="2"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.6"
            />
          </pattern>
          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
          </filter>
        </defs>
        {getShapeElement()}
      </svg>
    );
  };

  const colorClass = getColorClass(color);
  const shapeSize = small ? 32 : 56;

  return (
    <UICard
      onClick={onClick}
      className={cn(
        // Base styles with proper outline
        "relative cursor-pointer select-none transition-all duration-300 ease-in-out",
        "border-2 outline-2 outline-offset-2 outline-transparent",
        "flex items-center justify-center gap-2",

        // Size variants
        small
          ? "p-3 min-h-[80px] min-w-[80px]"
          : "p-4 min-h-[140px] min-w-[110px]",

        // Default state with outline
        !isSelected &&
          !isWrong && [
            "border-border bg-card shadow-sm",
            "hover:border-primary/60 hover:bg-accent/30 hover:shadow-md hover:scale-[1.02]",
            "hover:outline-primary/20 hover:outline-2",
            "active:scale-[0.98] active:outline-primary/40",
          ],

        // Selected state with strong outline
        isSelected && [
          "border-primary bg-primary/10 shadow-lg scale-[1.02]",
          "outline-primary/50 outline-2",
          "ring-2 ring-primary/30 ring-offset-1",
        ],

        // Wrong state with error outline
        isWrong && [
          "border-destructive bg-destructive/10 shadow-lg",
          "outline-destructive/50 outline-2",
          "ring-2 ring-destructive/30 ring-offset-1",
          "animate-pulse",
        ]
      )}
    >
      {/* Subtle background gradient */}
      <div
        className={cn(
          "absolute inset-0 rounded-[inherit] opacity-[0.03]",
          "bg-gradient-to-br from-primary/20 via-transparent to-secondary/20"
        )}
      />

      {/* Card content container */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {Array.from({ length: number }, (_, index) => (
          <div
            key={index}
            className={cn(
              "transition-all duration-300 ease-out",
              isSelected && "scale-110 rotate-1",
              isWrong && "animate-bounce scale-95"
            )}
            style={{
              animationDelay: `${index * 150}ms`,
              transform: isSelected
                ? `scale(1.1) rotate(${(index - 1) * 2}deg)`
                : undefined,
            }}
          >
            {renderShape(shape, filling, colorClass, shapeSize)}
          </div>
        ))}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-background shadow-sm">
          <div className="w-full h-full rounded-full bg-primary animate-ping opacity-75" />
        </div>
      )}

      {/* Error indicator */}
      {isWrong && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive border-2 border-background shadow-sm">
          <div className="w-full h-full rounded-full bg-destructive animate-ping opacity-75" />
        </div>
      )}

      {/* Hover glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300",
          "bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5",
          "group-hover:opacity-100"
        )}
      />
    </UICard>
  );
}
