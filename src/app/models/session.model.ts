import { Deck } from './deck.model';

export interface Vote {
  userId: string;
  userName: string;
  value: string;
  revealed: boolean;
}

export interface User {
  id: string;
  name: string;
  isHost?: boolean;
}

export interface Session {
  id: string;
  name: string;
  selectedDeck: Deck;
  users: User[];
  votes: Vote[];
  revealed: boolean;
  createdAt: number;
  updatedAt: number;
} 