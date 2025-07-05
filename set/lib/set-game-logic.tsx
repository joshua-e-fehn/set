export interface Card {
  color: "red" | "green" | "purple";
  shape: "circle" | "square" | "triangle";
  filling: "blank" | "filled" | "striped";
  number: 1 | 2 | 3;
}

export function generateDeck(): Card[] {
  const colors: Card["color"][] = ["red", "green", "purple"];
  const shapes: Card["shape"][] = ["circle", "square", "triangle"];
  const fillings: Card["filling"][] = ["blank", "filled", "striped"];
  const numbers: Card["number"][] = [1, 2, 3];

  const deck: Card[] = [];

  for (const color of colors) {
    for (const shape of shapes) {
      for (const filling of fillings) {
        for (const number of numbers) {
          deck.push({ color, shape, filling, number });
        }
      }
    }
  }

  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function dealCards(
  deck: Card[],
  count: number
): { cards: Card[]; remainingDeck: Card[] } {
  const cards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  return { cards, remainingDeck };
}

export function isValidSet(cards: Card[]): boolean {
  if (cards.length !== 3) return false;

  const [card1, card2, card3] = cards;

  // For each attribute, all three cards must have either all the same or all different values
  const checkAttribute = (attr: keyof Card) => {
    const values = [card1[attr], card2[attr], card3[attr]];
    const uniqueValues = new Set(values);
    return uniqueValues.size === 1 || uniqueValues.size === 3;
  };

  return (
    checkAttribute("color") &&
    checkAttribute("shape") &&
    checkAttribute("filling") &&
    checkAttribute("number")
  );
}

export function findAllSets(cards: Card[]): Card[][] {
  const sets: Card[][] = [];

  for (let i = 0; i < cards.length - 2; i++) {
    for (let j = i + 1; j < cards.length - 1; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        const potentialSet = [cards[i], cards[j], cards[k]];
        if (isValidSet(potentialSet)) {
          sets.push(potentialSet);
        }
      }
    }
  }

  return sets;
}

export function findThirdCard(card1: Card, card2: Card): Card {
  const findThirdAttribute = (
    attr1: string,
    attr2: string,
    possibleValues: string[]
  ) => {
    if (attr1 === attr2) {
      // If first two are the same, third must be the same
      return attr1;
    } else {
      // If first two are different, third must be the remaining one
      return possibleValues.find((val) => val !== attr1 && val !== attr2)!;
    }
  };

  const colors: Card["color"][] = ["red", "green", "purple"];
  const shapes: Card["shape"][] = ["circle", "square", "triangle"];
  const fillings: Card["filling"][] = ["blank", "filled", "striped"];
  const numbers: Card["number"][] = [1, 2, 3];

  return {
    color: findThirdAttribute(
      card1.color,
      card2.color,
      colors
    ) as Card["color"],
    shape: findThirdAttribute(
      card1.shape,
      card2.shape,
      shapes
    ) as Card["shape"],
    filling: findThirdAttribute(
      card1.filling,
      card2.filling,
      fillings
    ) as Card["filling"],
    number: parseInt(
      findThirdAttribute(
        card1.number.toString(),
        card2.number.toString(),
        numbers.map((n) => n.toString())
      )
    ) as Card["number"],
  };
}
