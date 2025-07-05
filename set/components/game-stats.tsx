interface GameStatsProps {
  score: number;
  cardsRemaining: number;
  timer?: string;
}

export function GameStats({ score, cardsRemaining, timer }: GameStatsProps) {
  return (
    <div className="flex gap-4 text-sm">
      <div className="text-center min-w-[60px]">
        <div className="font-semibold text-blue-600">Score</div>
        <div className="text-2xl font-bold tabular-nums">{score}</div>
      </div>
      {cardsRemaining > 0 && (
        <div className="text-center min-w-[80px]">
          <div className="font-semibold text-blue-600">Cards Left</div>
          <div className="text-2xl font-bold tabular-nums">
            {cardsRemaining}
          </div>
        </div>
      )}
      {timer && (
        <div className="text-center min-w-[80px]">
          <div className="font-semibold text-blue-600">Time</div>
          <div className="text-2xl font-bold tabular-nums font-mono">
            {timer}
          </div>
        </div>
      )}
    </div>
  );
}
