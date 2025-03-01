import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  push, 
  update, 
  remove, 
  get,
  child,
  Database
} from 'firebase/database';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { environment } from '../../environments/environment';
import { Session, User, Vote } from '../models/session.model';
import { Deck, DEFAULT_DECKS } from '../models/deck.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app = initializeApp(environment.firebase);
  private db: Database = getDatabase(this.app);
  private sessionCache = new Map<string, BehaviorSubject<Session | null>>();
  
  constructor() { }

  // Create a new session
  createSession(sessionName: string, deck: Deck, hostUser: User): Observable<string> {
    const sessionsRef = ref(this.db, 'sessions');
    const newSessionRef = push(sessionsRef);
    const sessionId = newSessionRef.key as string;
    
    const newSession: Session = {
      id: sessionId,
      name: sessionName,
      selectedDeck: deck,
      users: [{ ...hostUser, isHost: true }],
      votes: [],
      revealed: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    console.log('Creating new session:', newSession);
    return from(set(newSessionRef, newSession)
      .then(() => sessionId));
  }

  // Join an existing session
  joinSession(sessionId: string, user: User): Observable<boolean> {
    return from(get(ref(this.db, `sessions/${sessionId}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const session = snapshot.val() as Session;
          
          // Ensure users array exists
          const existingUsers = Array.isArray(session.users) ? session.users : [];
          
          // Check if user with same ID already exists in the session
          const userExists = existingUsers.some(existingUser => existingUser.id === user.id);
          
          if (userExists) {
            console.log('User already in session, not adding duplicate:', user.id);
            return true; // Return true since the user is effectively in the session
          }
          
          // Add the user if they don't already exist
          const users = [...existingUsers, user];
          
          return update(ref(this.db, `sessions/${sessionId}`), { 
            users, 
            updatedAt: Date.now() 
          }).then(() => true);
        }
        return false;
      }));
  }

  // Leave a session
  leaveSession(sessionId: string, userId: string): Observable<boolean> {
    return from(get(ref(this.db, `sessions/${sessionId}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const session = snapshot.val() as Session;
          
          // Ensure arrays exist
          const existingUsers = Array.isArray(session.users) ? session.users : [];
          const existingVotes = Array.isArray(session.votes) ? session.votes : [];
          
          const users = existingUsers.filter(user => user.id !== userId);
          const votes = existingVotes.filter(vote => vote.userId !== userId);
          
          return update(ref(this.db, `sessions/${sessionId}`), { 
            users, 
            votes, 
            updatedAt: Date.now() 
          }).then(() => true);
        }
        return false;
      }));
  }

  // Submit a vote
  submitVote(sessionId: string, vote: Vote): Observable<boolean> {
    return from(get(ref(this.db, `sessions/${sessionId}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const session = snapshot.val() as Session;
          
          // Ensure votes array exists
          const existingVotes = Array.isArray(session.votes) ? session.votes : [];
          
          // Remove existing vote by this user if exists
          const votes = existingVotes.filter(v => v.userId !== vote.userId);
          votes.push({ ...vote, revealed: session.revealed });
          
          return update(ref(this.db, `sessions/${sessionId}`), { 
            votes, 
            updatedAt: Date.now() 
          }).then(() => true);
        }
        return false;
      }));
  }

  // Reveal all votes
  revealVotes(sessionId: string): Observable<boolean> {
    return from(get(ref(this.db, `sessions/${sessionId}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const session = snapshot.val() as Session;
          
          // Ensure votes array exists
          const existingVotes = Array.isArray(session.votes) ? session.votes : [];
          
          const votes = existingVotes.map(vote => ({
            ...vote,
            revealed: true
          }));
          
          return update(ref(this.db, `sessions/${sessionId}`), { 
            votes, 
            revealed: true, 
            updatedAt: Date.now() 
          }).then(() => true);
        }
        return false;
      }));
  }

  // Reset votes (new round)
  resetVotes(sessionId: string): Observable<boolean> {
    return from(update(ref(this.db, `sessions/${sessionId}`), { 
      votes: [], 
      revealed: false, 
      updatedAt: Date.now() 
    }).then(() => true));
  }

  // Change the deck for a session
  changeDeck(sessionId: string, deck: Deck): Observable<boolean> {
    return from(update(ref(this.db, `sessions/${sessionId}`), { 
      selectedDeck: deck, 
      votes: [], 
      revealed: false, 
      updatedAt: Date.now() 
    }).then(() => true));
  }

  // Get session by ID
  getSession(sessionId: string): Observable<Session | null> {
    if (!this.sessionCache.has(sessionId)) {
      this.sessionCache.set(sessionId, new BehaviorSubject<Session | null>(null));
      
      const sessionRef = ref(this.db, `sessions/${sessionId}`);
      onValue(sessionRef, (snapshot) => {
        if (snapshot.exists()) {
          const sessionData = snapshot.val();
          
          // Ensure all required properties exist
          const validatedSession: Session = {
            id: sessionData.id || sessionId,
            name: sessionData.name || 'Unnamed Session',
            selectedDeck: sessionData.selectedDeck || DEFAULT_DECKS[0],
            users: Array.isArray(sessionData.users) ? sessionData.users : [],
            votes: Array.isArray(sessionData.votes) ? sessionData.votes : [],
            revealed: !!sessionData.revealed,
            createdAt: sessionData.createdAt || Date.now(),
            updatedAt: sessionData.updatedAt || Date.now()
          };
          
          console.log('Validated session data:', validatedSession);
          this.sessionCache.get(sessionId)?.next(validatedSession);
        } else {
          console.log('Session not found:', sessionId);
          this.sessionCache.get(sessionId)?.next(null);
        }
      });
    }
    
    return this.sessionCache.get(sessionId)!.asObservable();
  }

  // Delete a session
  deleteSession(sessionId: string): Observable<boolean> {
    return from(remove(ref(this.db, `sessions/${sessionId}`))
      .then(() => true));
  }
} 