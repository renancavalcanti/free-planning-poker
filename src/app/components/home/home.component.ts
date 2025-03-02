import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SessionService } from '../../services/session.service';
import { Deck } from '../../models/deck.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  loginForm!: FormGroup;
  createSessionForm!: FormGroup;
  joinSessionForm!: FormGroup;
  decks: Deck[] = [];
  pendingSessionId: string | null = null;
  
  activeTab: 'join' | 'create' = 'join';

  constructor(
    private formBuilder: FormBuilder,
    private sessionService: SessionService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadDecks();
    this.checkPendingSession();
  }

  // Check if there's a pending session to join
  checkPendingSession(): void {
    this.pendingSessionId = localStorage.getItem('pendingSessionId');
    
    // If user is already logged in and there's a pending session, redirect immediately
    this.sessionService.getCurrentUser().subscribe(user => {
      if (user && this.pendingSessionId) {
        this.redirectToPendingSession();
      }
    });
  }

  // Redirect to pending session and clear storage
  redirectToPendingSession(): void {
    if (this.pendingSessionId) {
      const sessionId = this.pendingSessionId;
      localStorage.removeItem('pendingSessionId');
      
      this.sessionService.joinSession(sessionId).subscribe(success => {
        if (success) {
          this.router.navigate(['/session', sessionId]);
        } else {
          console.error('Failed to join pending session');
          // Handle error (e.g., show error message)
        }
      });
    }
  }

  initForms(): void {
    this.loginForm = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.createSessionForm = this.formBuilder.group({
      sessionName: ['', [Validators.required, Validators.minLength(3)]],
      deckId: ['fibonacci', Validators.required]
    });

    this.joinSessionForm = this.formBuilder.group({
      sessionId: ['', [Validators.required, Validators.minLength(3)]]
    });
    
    // If there's a pending session, pre-fill the join form
    if (this.pendingSessionId) {
      this.joinSessionForm.patchValue({
        sessionId: this.pendingSessionId
      });
      this.activeTab = 'join';
    }
  }

  loadDecks(): void {
    this.sessionService.getDecks().subscribe(decks => {
      this.decks = decks;
    });
  }

  setActiveTab(tab: 'join' | 'create'): void {
    this.activeTab = tab;
  }

  login(): void {
    if (this.loginForm.valid) {
      this.sessionService.setCurrentUser(this.loginForm.value.userName);
      
      // If there's a pending session, redirect to it after login
      if (this.pendingSessionId) {
        this.redirectToPendingSession();
      }
    }
  }

  createSession(): void {
    if (this.loginForm.valid && this.createSessionForm.valid) {
      this.sessionService.setCurrentUser(this.loginForm.value.userName);
      const { sessionName, deckId } = this.createSessionForm.value;
      
      this.sessionService.createSession(sessionName, deckId).subscribe(sessionId => {
        this.router.navigate(['/session', sessionId]);
      });
    }
  }

  joinSession(): void {
    if (this.loginForm.valid && this.joinSessionForm.valid) {
      this.sessionService.setCurrentUser(this.loginForm.value.userName);
      const sessionId = this.joinSessionForm.value.sessionId;
      
      this.sessionService.joinSession(sessionId).subscribe(success => {
        if (success) {
          this.router.navigate(['/session', sessionId]);
        } else {
          console.error('Failed to join session');
          // Handle error (e.g., show error message)
        }
      });
    }
  }

  // New method specifically for joining from a shared link
  joinPendingSession(): void {
    if (this.loginForm.valid && this.pendingSessionId) {
      this.sessionService.setCurrentUser(this.loginForm.value.userName);
      
      // Direct join with the stored session ID
      this.sessionService.joinSession(this.pendingSessionId).subscribe(
        success => {
          if (success) {
            // Remove pending session as we're handling it now
            localStorage.removeItem('pendingSessionId');
            this.router.navigate(['/session', this.pendingSessionId]);
          } else {
            this.toastr.error('Failed to join session. Please check the session ID.', 'Error');
          }
        },
        error => {
          console.error('Error joining session:', error);
          this.toastr.error('An error occurred while joining the session.', 'Error');
        }
      );
    }
  }
} 