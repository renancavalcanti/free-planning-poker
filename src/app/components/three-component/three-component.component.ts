import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreeService } from '../../services/three.service';
import { Session, User, Vote } from '../../models/session.model';

@Component({
  selector: 'app-three-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './three-component.component.html',
  styleUrls: ['./three-component.component.scss']
})
export class ThreeComponentComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('threeContainer') threeContainer!: ElementRef;
  @Input() cardValue: string = '';
  @Input() session: Session | null = null;
  @Input() currentUserId: string = '';
  @Input() revealCards: boolean = false;
  @Input() visible: boolean = true; // Track visibility
  
  private initialized = false;
  private previousVoteCount = 0;
  private previousVisibility = true;
  
  constructor(private threeService: ThreeService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    if (this.threeContainer) {
      this.initThreeJs();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized) {
      if (changes['session'] && this.session) {
        // Update users in the 3D scene
        this.updateUsers();
        
        // Check if votes have been reset (previous session had votes but new session has none)
        const previousSession = changes['session'].previousValue;
        if (previousSession && previousSession.votes && previousSession.votes.length > 0 && 
            (!this.session.votes || this.session.votes.length === 0)) {
          this.clearAllCards();
        } else {
          // Update cards for votes
          this.updateCards();
        }
        
        // Check if we need to reveal cards
        if (changes['revealCards'] && this.revealCards) {
          this.threeService.revealAllCards();
        }
      }
      
      // If visibility changed, handle resize or refresh
      if (changes['visible'] && this.previousVisibility !== this.visible) {
        this.previousVisibility = this.visible;
        if (this.visible) {
          // When switching from 2D back to 3D mode, refresh the page
          window.location.reload();
        }
      }
      
      // Card value changes are now handled by updating the user's card directly
      if (changes['cardValue'] && this.cardValue && this.currentUserId) {
        // Find if the user already has a vote in the session
        const existingVote = this.session?.votes?.find(vote => vote.userId === this.currentUserId);
        
        if (existingVote) {
          // If user already has a card, it will be updated on the next session update
        } else {
          // Preview the card by temporarily showing it as the current user's card
          this.threeService.addUserCard(
            this.currentUserId,
            this.session?.users?.find(u => u.id === this.currentUserId)?.name || 'You',
            this.cardValue,
            false // Not revealed
          );
        }
      }
    }
  }
  
  ngOnDestroy(): void {
    this.threeService.dispose();
  }
  
  private initThreeJs(): void {
    this.threeService.initialize(this.threeContainer.nativeElement);
    this.initialized = true;
    
    if (this.session) {
      this.updateUsers();
      this.updateCards();
    }
  }
  
  private updateUsers(): void {
    if (!this.session) return;
    
    // Map session users to format needed by ThreeService
    const users = this.session.users.map(user => ({
      id: user.id,
      name: user.name
    }));
    
    this.threeService.updateUsers(users);
  }
  
  private updateCards(): void {
    if (!this.session) return;
    
    // First, ensure we're only showing cards for users with votes
    const voterIds = new Set(this.session.votes.map(vote => vote.userId));
    
    // Remove cards for users who no longer have votes
    if (this.session.users) {
      this.session.users.forEach(user => {
        if (!voterIds.has(user.id)) {
          this.threeService.removeUserCard(user.id);
        }
      });
    }
    
    // Add or update cards for all votes
    this.session.votes.forEach(vote => {
      this.threeService.addUserCard(
        vote.userId,
        vote.userName,
        vote.value,
        this.session?.revealed || false
      );
    });
    
    // If votes were revealed since last update
    if (this.session.revealed && this.previousVoteCount === this.session.votes.length) {
      this.threeService.revealAllCards();
    }
    
    this.previousVoteCount = this.session.votes.length;
  }
  
  private clearAllCards(): void {
    // Remove all cards from the scene
    if (this.session) {
      this.session.users.forEach(user => {
        this.threeService.removeUserCard(user.id);
      });
    }
  }
} 