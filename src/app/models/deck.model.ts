import { Card } from './card.model';

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  isCustom?: boolean;
}

export const FIBONACCI_DECK: Deck = {
  id: 'fibonacci',
  name: 'Fibonacci',
  cards: [
    { value: '0', displayValue: '0' },
    { value: '1', displayValue: '1' },
    { value: '2', displayValue: '2' },
    { value: '3', displayValue: '3' },
    { value: '5', displayValue: '5' },
    { value: '8', displayValue: '8' },
    { value: '13', displayValue: '13' },
    { value: '21', displayValue: '21' },
    { value: '34', displayValue: '34' },
    { value: '55', displayValue: '55' },
    { value: '89', displayValue: '89' },
    { value: '?', displayValue: '?' }
  ]
};

export const MODIFIED_FIBONACCI_DECK: Deck = {
  id: 'modified-fibonacci',
  name: 'Modified Fibonacci',
  cards: [
    { value: '0', displayValue: '0' },
    { value: '0.5', displayValue: '½' },
    { value: '1', displayValue: '1' },
    { value: '2', displayValue: '2' },
    { value: '3', displayValue: '3' },
    { value: '5', displayValue: '5' },
    { value: '8', displayValue: '8' },
    { value: '13', displayValue: '13' },
    { value: '20', displayValue: '20' },
    { value: '40', displayValue: '40' },
    { value: '100', displayValue: '100' },
    { value: '?', displayValue: '?' }
  ]
};

export const TSHIRT_DECK: Deck = {
  id: 'tshirt',
  name: 'T-Shirt Sizes',
  cards: [
    { value: 'XS', displayValue: 'XS' },
    { value: 'S', displayValue: 'S' },
    { value: 'M', displayValue: 'M' },
    { value: 'L', displayValue: 'L' },
    { value: 'XL', displayValue: 'XL' },
    { value: '?', displayValue: '?' }
  ]
};

export const POWERS_OF_TWO_DECK: Deck = {
  id: 'powers-of-two',
  name: 'Powers of 2',
  cards: [
    { value: '0', displayValue: '0' },
    { value: '1', displayValue: '1' },
    { value: '2', displayValue: '2' },
    { value: '4', displayValue: '4' },
    { value: '8', displayValue: '8' },
    { value: '16', displayValue: '16' },
    { value: '32', displayValue: '32' },
    { value: '?', displayValue: '?' }
  ]
};

export const DEFAULT_DECKS: Deck[] = [
  FIBONACCI_DECK,
  MODIFIED_FIBONACCI_DECK,
  TSHIRT_DECK,
  POWERS_OF_TWO_DECK
]; 