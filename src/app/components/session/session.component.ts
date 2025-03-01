import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionService } from '../../services/session.service';
import { Session, User, Vote } from '../../models/session.model';
import { Card } from '../../models/card.model';
import { Deck } from '../../models/deck.model';
import { CardComponent } from '../card/card.component';
import { DeckSelectionComponent } from '../deck-selection/deck-selection.component';
import { ThreeComponentComponent } from '../three-component/three-component.component';
import { ResultCardComponent } from '../result-card/result-card.component';
import { ResultCardsDisplayComponent } from '../result-cards-display/result-cards-display.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [
    CommonModule, 
    CardComponent, 
    DeckSelectionComponent, 
    ThreeComponentComponent, 
    ResultCardComponent,
    ResultCardsDisplayComponent
  ],
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit, OnDestroy {
  sessionId!: string;
  session: Session | null = null;
  currentUser: User | null = null;
  selectedCard: Card | null = null;
  showDeckSelection = false;
  showThreeDemo = true;
  isReloading = false;
  shareUrl: string = '';

  private sessionSubscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.sessionId) {
      this.router.navigate(['/']);
      return;
    }
    
    // Generate shareable URL
    this.shareUrl = `${window.location.origin}/session/${this.sessionId}`;
    
    // Check if user is authenticated or has stored credentials
    this.checkUserAuthentication();
    
    this.loadSession();
    this.loadCurrentUser();
  }

  // Check if user is authenticated or has stored information
  checkUserAuthentication(): void {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (!userId || !userName) {
      // If no stored user info, redirect to home page for login
      // Store the session ID to redirect back after login
      localStorage.setItem('pendingSessionId', this.sessionId);
      this.router.navigate(['/']);
      return;
    }
    
    // If user info exists in local storage but not in the service, set it
    this.sessionService.getCurrentUser().subscribe(user => {
      if (!user && userId && userName) {
        this.sessionService.setCurrentUser(userName);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
    }
    
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    
    if (this.currentUser && this.session) {
      this.sessionService.leaveSession(this.sessionId).subscribe();
    }
  }

  loadSession(): void {
    this.sessionSubscription = this.sessionService.getSession(this.sessionId).subscribe(
      session => {
        console.log('Session updated:', session);
        this.session = session;
        
        if (session && this.currentUser) {
          // Check if the user is in the session
          const userExists = session.users?.some(u => u.id === this.currentUser?.id);
          
          if (!userExists) {
            console.log('User not in session after session load, joining now:', this.currentUser.id);
            this.sessionService.joinSession(this.sessionId).subscribe(
              success => {
                console.log('Joined session:', success);
              },
              error => {
                console.error('Error joining session:', error);
              }
            );
          } else {
            console.log('User already in session after load:', this.currentUser.id);
          }
          
          // Update selected card based on existing vote
          const userVote = session.votes?.find(v => v.userId === this.currentUser?.id);
          
          if (userVote) {
            this.selectedCard = {
              value: userVote.value,
              displayValue: userVote.value
            };
          } else {
            // Reset selected card if user has no vote
            this.selectedCard = null;
          }
        }
      },
      error => {
        console.error('Error loading session:', error);
      }
    );
  }

  loadCurrentUser(): void {
    this.userSubscription = this.sessionService.getCurrentUser().subscribe(
      user => {
        console.log('Current user updated:', user);
        this.currentUser = user;
        
        if (user && this.sessionId && this.session) {
          // Check if the user is already in the session
          const userExists = this.session.users?.some(u => u.id === user.id);
          if (!userExists) {
            console.log('User not in session, joining now:', user.id);
            this.sessionService.joinSession(this.sessionId).subscribe(
              success => {
                console.log('Joined session:', success);
              },
              error => {
                console.error('Error joining session:', error);
              }
            );
          } else {
            console.log('User already in session:', user.id);
          }
        } else if (user && this.sessionId && !this.session) {
          // Session not loaded yet, will attempt to join once session is loaded
          console.log('Session not loaded yet, will join when session data arrives');
        }
      },
      error => {
        console.error('Error loading current user:', error);
      }
    );
  }

  selectCard(card: Card): void {
    if (this.currentUser) {
      this.selectedCard = { ...card };
      this.sessionService.submitVote(this.sessionId, card.value).subscribe();
    }
  }

  revealCards(): void {
    this.sessionService.revealVotes(this.sessionId).subscribe();
  }

  resetVoting(): void {
    this.selectedCard = null;
    this.sessionService.resetVotes(this.sessionId).subscribe();
  }

  toggleDeckSelection(): void {
    this.showDeckSelection = !this.showDeckSelection;
  }

  onDeckSelected(deck: Deck): void {
    this.showDeckSelection = false;
  }

  leaveSession(): void {
    this.router.navigate(['/']);
  }

  copySessionLinkToClipboard(): void {
    navigator.clipboard.writeText(this.shareUrl);
    this.toastr.success('Session link copied to clipboard!', 'Success');
  }

  copySessionIdToClipboard(): void {
    navigator.clipboard.writeText(this.sessionId);
    this.toastr.success('Session ID copied to clipboard!', 'Success');
  }

  toggleThreeDemo(): void {
    this.showThreeDemo = !this.showThreeDemo;
    if(this.showThreeDemo){
      this.isReloading = true;
      window.location.reload();
    }
  }

  getVoteCount(): number {
    if (!this.session || !this.session.votes) return 0;
    return this.session.votes.length;
  }

  getUserCount(): number {
    if (!this.session || !this.session.users) return 0;
    return this.session.users.length;
  }

  isHost(): boolean {
    if (!this.session || !this.currentUser || !this.session.users) return false;
    const user = this.session.users.find(u => u.id === this.currentUser?.id);
    return !!user?.isHost;
  }

  getResultSummary(): { value: string, count: number }[] {
    if (!this.session || !this.session.revealed || !this.session.votes) return [];
    
    const voteCount = new Map<string, number>();
    
    for (const vote of this.session.votes) {
      const count = voteCount.get(vote.value) || 0;
      voteCount.set(vote.value, count + 1);
    }
    
    return Array.from(voteCount.entries()).map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  hasUserVoted(userId: string): boolean {
    if (!this.session || !this.session.votes) return false;
    return this.session.votes.some(v => v.userId === userId);
  }

  canChangeVote(): boolean {
    return true; // Always allow vote changes
  }
} 