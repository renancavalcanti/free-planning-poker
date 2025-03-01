import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseService } from './firebase.service';
import { Session, User, Vote } from '../models/session.model';
import { Deck, DEFAULT_DECKS } from '../models/deck.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private currentUser$ = this.currentUserSubject.asObservable();
  private currentSession$ = new BehaviorSubject<Session | null>(null);
  private availableDecks$ = new BehaviorSubject<Deck[]>(DEFAULT_DECKS);

  constructor(private firebaseService: FirebaseService) {
    // Check if user already exists in localStorage
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (userId && userName) {
      this.currentUserSubject.next({
        id: userId,
        name: userName
      });
    }
  }

  // Get current user
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  // Set current user (used for login)
  setCurrentUser(userName: string): void {
    const userId = localStorage.getItem('userId') || uuidv4();
    localStorage.setItem('userId', userId);
    localStorage.setItem('userName', userName);
    
    const user: User = {
      id: userId,
      name: userName
    };
    
    this.currentUserSubject.next(user);
  }

  // Create a new session with the current user as host
  createSession(sessionName: string, selectedDeckId: string): Observable<string> {
    const user = this.currentUserSubject.value;
    if (!user) {
      throw new Error('User must be logged in to create a session');
    }
    
    const deck = this.getSelectedDeck(selectedDeckId);
    
    return this.firebaseService.createSession(sessionName, deck, user);
  }

  // Join an existing session
  joinSession(sessionId: string): Observable<boolean> {
    const user = this.currentUserSubject.value;
    if (!user) {
      throw new Error('User must be logged in to join a session');
    }
    
    return this.firebaseService.joinSession(sessionId, user);
  }

  // Get a session by ID
  getSession(sessionId: string): Observable<Session | null> {
    return this.firebaseService.getSession(sessionId);
  }

  // Leave the current session
  leaveSession(sessionId: string): Observable<boolean> {
    const user = this.currentUserSubject.value;
    if (!user) {
      throw new Error('User must be logged in to leave a session');
    }
    
    return this.firebaseService.leaveSession(sessionId, user.id);
  }

  // Submit a vote
  submitVote(sessionId: string, value: string): Observable<boolean> {
    const user = this.currentUserSubject.value;
    if (!user) {
      throw new Error('User must be logged in to vote');
    }
    
    const vote: Vote = {
      userId: user.id,
      userName: user.name,
      value,
      revealed: false
    };
    
    return this.firebaseService.submitVote(sessionId, vote);
  }

  // Reveal all votes
  revealVotes(sessionId: string): Observable<boolean> {
    return this.firebaseService.revealVotes(sessionId);
  }

  // Reset votes (new round)
  resetVotes(sessionId: string): Observable<boolean> {
    return this.firebaseService.resetVotes(sessionId);
  }

  // Change the deck for a session
  changeDeck(sessionId: string, deckId: string): Observable<boolean> {
    const deck = this.getSelectedDeck(deckId);
    return this.firebaseService.changeDeck(sessionId, deck);
  }

  // Helper method to find a deck by ID
  private getSelectedDeck(deckId: string): Deck {
    const decks = this.availableDecks$.value;
    const deck = decks.find(d => d.id === deckId);
    
    if (!deck) {
      throw new Error(`Deck with ID ${deckId} not found`);
    }
    
    return deck;
  }

  // Get available decks
  getDecks(): Observable<Deck[]> {
    return this.availableDecks$;
  }

  // Add a custom deck
  addCustomDeck(name: string, cardValues: string[]): void {
    const decks = this.availableDecks$.value;
    
    const cards = cardValues.map(value => ({
      value,
      displayValue: value
    }));
    
    const customDeck: Deck = {
      id: `custom-${Date.now()}`,
      name,
      cards,
      isCustom: true
    };
    
    this.availableDecks$.next([...decks, customDeck]);
  }

  // Delete a session
  deleteSession(sessionId: string): Observable<boolean> {
    return this.firebaseService.deleteSession(sessionId);
  }
} 