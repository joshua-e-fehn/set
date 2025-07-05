"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/set-card";
import { GameStats } from "@/components/game-stats";
import {
  generateDeck,
  dealCards,
  findAllSets,
  isValidSet,
  findThirdCard,
} from "@/lib/set-game-logic";
import type { Card as CardType } from "@/lib/set-game-logic";

type GameMode = "classic" | "puzzle";

export default function SetGame() {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [deck, setDeck] = useState<CardType[]>([]);
  const [cardsOnTable, setCardsOnTable] = useState<CardType[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const [foundSets, setFoundSets] = useState<CardType[][]>([]);
  const [score, setScore] = useState(0);
  const [wrongSelection, setWrongSelection] = useState<CardType[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [hintMessage, setHintMessage] = useState<string>("");
  const [showHint, setShowHint] = useState(false);

  // Puzzle mode specific state
  const [puzzleCards, setPuzzleCards] = useState<CardType[]>([]);
  const [targetCards, setTargetCards] = useState<CardType[]>([]);
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [bestTimes, setBestTimes] = useState<number[]>([]);

  // Track processed sets to prevent double counting
  const processedSetsRef = useRef(new Set<string>());

  // Timer effect for puzzle mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      gameMode === "puzzle" &&
      gameStarted &&
      !puzzleCompleted &&
      startTime > 0
    ) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 10);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameMode, gameStarted, puzzleCompleted, startTime]);

  const generatePuzzle = useCallback(() => {
    const fullDeck = generateDeck();

    // Pick two random cards
    const card1 = fullDeck[Math.floor(Math.random() * fullDeck.length)];
    let card2;
    do {
      card2 = fullDeck[Math.floor(Math.random() * fullDeck.length)];
    } while (
      card1.color === card2.color &&
      card1.shape === card2.shape &&
      card1.filling === card2.filling &&
      card1.number === card2.number
    );

    // Find the third card that completes the set
    const thirdCard = findThirdCard(card1, card2);

    // Create a selection of 9 cards including the correct third card
    const remainingCards = fullDeck.filter(
      (card) =>
        !(
          card.color === card1.color &&
          card.shape === card1.shape &&
          card.filling === card1.filling &&
          card.number === card1.number
        ) &&
        !(
          card.color === card2.color &&
          card.shape === card2.shape &&
          card.filling === card2.filling &&
          card.number === card2.number
        ) &&
        !(
          card.color === thirdCard.color &&
          card.shape === thirdCard.shape &&
          card.filling === thirdCard.filling &&
          card.number === thirdCard.number
        )
    );

    // Shuffle and take 8 random cards, then add the correct third card
    const shuffledRemaining = remainingCards.sort(() => Math.random() - 0.5);
    const wrongCards = shuffledRemaining.slice(0, 8);
    const puzzleOptions = [...wrongCards, thirdCard].sort(
      () => Math.random() - 0.5
    );

    setTargetCards([card1, card2]);
    setPuzzleCards(puzzleOptions);
    setPuzzleCompleted(false);
    setStartTime(Date.now());
    setCurrentTime(Date.now());
  }, []);

  const startNewGame = useCallback(() => {
    if (gameMode === "classic") {
      const newDeck = generateDeck();
      const { cards, remainingDeck } = dealCards(newDeck, 12);
      setDeck(remainingDeck);
      setCardsOnTable(cards);
    } else if (gameMode === "puzzle") {
      generatePuzzle();
    }

    setSelectedCards([]);
    setFoundSets([]);
    setScore(0);
    setWrongSelection([]);
    setGameStarted(true);
    setHintMessage("");
    setShowHint(false);
    processedSetsRef.current.clear();
  }, [gameMode, generatePuzzle]);

  const handleClassicCardClick = useCallback(
    (card: CardType) => {
      if (wrongSelection.length > 0) return;

      // Hide hint when user starts interacting
      setShowHint(false);

      setSelectedCards((prev) => {
        const isAlreadySelected = prev.some(
          (c) =>
            c.color === card.color &&
            c.shape === card.shape &&
            c.filling === card.filling &&
            c.number === card.number
        );

        if (isAlreadySelected) {
          return prev.filter(
            (c) =>
              !(
                c.color === card.color &&
                c.shape === card.shape &&
                c.filling === card.filling &&
                c.number === card.number
              )
          );
        }

        const newSelection = [...prev, card];

        if (newSelection.length === 3) {
          if (isValidSet(newSelection)) {
            const setId = newSelection
              .map((c) => `${c.color}-${c.shape}-${c.filling}-${c.number}`)
              .sort()
              .join("|");

            if (!processedSetsRef.current.has(setId)) {
              processedSetsRef.current.add(setId);
              setScore((prevScore) => prevScore + 1);
              setFoundSets((prevSets) => [...prevSets, newSelection]);
            }

            setCardsOnTable((prevCards) => {
              const remainingCards = prevCards.filter(
                (c) =>
                  !newSelection.some(
                    (selected) =>
                      selected.color === c.color &&
                      selected.shape === c.shape &&
                      selected.filling === c.filling &&
                      selected.number === c.number
                  )
              );

              if (remainingCards.length < 12 && deck.length > 0) {
                const cardsNeeded = Math.min(3, deck.length);
                const newCards = deck.slice(0, cardsNeeded);
                setDeck((prevDeck) => prevDeck.slice(cardsNeeded));
                return [...remainingCards, ...newCards];
              }

              return remainingCards;
            });

            return [];
          } else {
            setWrongSelection(newSelection);
            setTimeout(() => {
              setWrongSelection([]);
              setSelectedCards([]);
            }, 2000);
            return newSelection;
          }
        }

        return newSelection;
      });
    },
    [deck, wrongSelection]
  );

  const handlePuzzleCardClick = useCallback(
    (card: CardType) => {
      if (puzzleCompleted || wrongSelection.length > 0) return;

      const testSet = [...targetCards, card];
      if (isValidSet(testSet)) {
        // Correct answer!
        const timeElapsed = currentTime - startTime;
        setPuzzleCompleted(true);
        setScore((prevScore) => prevScore + 1);
        setBestTimes((prev) =>
          [...prev, timeElapsed].sort((a, b) => a - b).slice(0, 10)
        );

        // Generate new puzzle after a short delay
        setTimeout(() => {
          generatePuzzle();
        }, 2000);
      } else {
        // Wrong answer
        setWrongSelection([card]);
        setTimeout(() => {
          setWrongSelection([]);
        }, 1000);
      }
    },
    [
      targetCards,
      puzzleCompleted,
      wrongSelection,
      currentTime,
      startTime,
      generatePuzzle,
    ]
  );

  const addMoreCards = useCallback(() => {
    if (deck.length >= 3) {
      const newCards = deck.slice(0, 3);
      setDeck((prev) => prev.slice(3));
      setCardsOnTable((prev) => [...prev, ...newCards]);
      // Hide hint when cards change
      setShowHint(false);
    }
  }, [deck]);

  const getHint = useCallback(() => {
    const availableSets = findAllSets(cardsOnTable);
    if (availableSets.length === 0) {
      setHintMessage(
        "No sets available! Click 'Add 3 Cards' to get more options."
      );
    } else if (availableSets.length === 1) {
      setHintMessage("There is 1 set available on the table!");
    } else {
      setHintMessage(
        `There are ${availableSets.length} sets available on the table!`
      );
    }
    setShowHint(true);

    // Auto-hide hint after 5 seconds
    setTimeout(() => {
      setShowHint(false);
    }, 5000);
  }, [cardsOnTable]);

  // Removed the automatic card addition useEffect

  const formatTime = (ms: number) => {
    const seconds = (ms / 1000).toFixed(2);
    return `${seconds}s`;
  };

  // Mode selection screen
  if (!gameMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">Set Card Game</h1>
          <div className="space-y-4">
            <button
              onClick={() => setGameMode("classic")}
              className="block w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <div className="text-xl font-semibold">Classic Mode</div>
              <div className="text-sm opacity-90">
                Find sets of 3 cards from 12+ cards
              </div>
            </button>
            <button
              onClick={() => setGameMode("puzzle")}
              className="block w-full px-6 py-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
            >
              <div className="text-xl font-semibold">Puzzle Mode</div>
              <div className="text-sm opacity-90">
                Find the third card to complete the set
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game start screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            {gameMode === "classic" ? "Classic Set Game" : "Puzzle Set Game"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {gameMode === "classic"
              ? "Find sets of 3 cards where each attribute is all same or all different"
              : "Complete the set by finding the third matching card"}
          </p>
          <div className="space-y-4">
            <button
              onClick={startNewGame}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Game
            </button>
            <button
              onClick={() => setGameMode(null)}
              className="block px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
            >
              Change Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {gameMode === "classic" ? "Classic Set" : "Puzzle Set"}
          </h1>
          <div className="flex gap-4 items-center">
            <GameStats
              score={score}
              cardsRemaining={gameMode === "classic" ? deck.length : 0}
              timer={
                gameMode === "puzzle" && startTime > 0
                  ? formatTime(currentTime - startTime)
                  : undefined
              }
            />
            {gameMode === "classic" && (
              <>
                <button
                  onClick={getHint}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/80 transition-colors"
                >
                  Hint
                </button>
                <button
                  onClick={addMoreCards}
                  disabled={deck.length < 3}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add 3 Cards
                </button>
              </>
            )}
            <button
              onClick={startNewGame}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              New {gameMode === "classic" ? "Game" : "Puzzle"}
            </button>
            <button
              onClick={() => {
                setGameMode(null);
                setGameStarted(false);
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            >
              Change Mode
            </button>
          </div>
        </div>

        {/* Hint message */}
        {showHint && gameMode === "classic" && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 text-center font-medium">
              💡 {hintMessage}
            </p>
          </div>
        )}

        {gameMode === "classic" && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {cardsOnTable.map((card, index) => (
              <Card
                key={`${card.color}-${card.shape}-${card.filling}-${card.number}-${index}`}
                card={card}
                isSelected={selectedCards.some(
                  (c) =>
                    c.color === card.color &&
                    c.shape === card.shape &&
                    c.filling === card.filling &&
                    c.number === card.number
                )}
                isWrong={wrongSelection.some(
                  (c) =>
                    c.color === card.color &&
                    c.shape === card.shape &&
                    c.filling === card.filling &&
                    c.number === card.number
                )}
                onClick={() => handleClassicCardClick(card)}
              />
            ))}
          </div>
        )}

        {gameMode === "puzzle" && (
          <div className="space-y-8">
            {/* Target cards */}
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Complete this set:</h2>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {targetCards.map((card, index) => (
                  <Card
                    key={index}
                    card={card}
                    isSelected={false}
                    isWrong={false}
                    onClick={() => {}}
                  />
                ))}
                <div className="flex items-center justify-center min-h-[140px] min-w-[110px] border-2 border-dashed border-muted-foreground/50 rounded-xl">
                  <span className="text-muted-foreground text-2xl">?</span>
                </div>
              </div>
            </div>

            {/* Puzzle options */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">
                Choose the third card:
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {puzzleCards.map((card, index) => (
                  <Card
                    key={`puzzle-${index}`}
                    card={card}
                    isSelected={false}
                    isWrong={wrongSelection.some(
                      (c) =>
                        c.color === card.color &&
                        c.shape === card.shape &&
                        c.filling === card.filling &&
                        c.number === card.number
                    )}
                    onClick={() => handlePuzzleCardClick(card)}
                  />
                ))}
              </div>
            </div>

            {puzzleCompleted && (
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                  Correct! ✓
                </h3>
                <p className="text-green-600 dark:text-green-400">
                  Completed in {formatTime(currentTime - startTime)}
                </p>
              </div>
            )}

            {bestTimes.length > 0 && (
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Best Times:</h3>
                <div className="flex justify-center gap-2 flex-wrap">
                  {bestTimes.slice(0, 5).map((time, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-muted rounded text-sm"
                    >
                      {formatTime(time)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
