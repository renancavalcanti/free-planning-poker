import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SessionService } from '../../services/session.service';
import { Deck } from '../../models/deck.model';

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
  
  activeTab: 'join' | 'create' = 'join';

  constructor(
    private formBuilder: FormBuilder,
    private sessionService: SessionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadDecks();
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
    }
  }

  createSession(): void {
    if (this.loginForm.valid && this.createSessionForm.valid) {
      this.login();
      const { sessionName, deckId } = this.createSessionForm.value;
      
      this.sessionService.createSession(sessionName, deckId).subscribe(sessionId => {
        this.router.navigate(['/session', sessionId]);
      });
    }
  }

  joinSession(): void {
    if (this.loginForm.valid && this.joinSessionForm.valid) {
      this.login();
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
} 