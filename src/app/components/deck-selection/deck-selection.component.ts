import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Deck } from '../../models/deck.model';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-deck-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './deck-selection.component.html',
  styleUrls: ['./deck-selection.component.scss']
})
export class DeckSelectionComponent implements OnInit {
  @Input() sessionId!: string;
  @Output() deckSelected = new EventEmitter<Deck>();
  
  decks: Deck[] = [];
  showCustomDeckForm = false;
  customDeckForm!: FormGroup;
  
  constructor(
    private sessionService: SessionService,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loadDecks();
    this.initForm();
  }

  initForm(): void {
    this.customDeckForm = this.formBuilder.group({
      deckName: ['Custom Deck', [Validators.required]],
      cardValues: ['', [Validators.required]]
    });
  }

  loadDecks(): void {
    this.sessionService.getDecks().subscribe(decks => {
      this.decks = decks;
    });
  }

  selectDeck(deck: Deck): void {
    this.sessionService.changeDeck(this.sessionId, deck.id).subscribe(() => {
      this.deckSelected.emit(deck);
    });
  }

  toggleCustomDeckForm(): void {
    this.showCustomDeckForm = !this.showCustomDeckForm;
  }

  createCustomDeck(): void {
    if (this.customDeckForm.valid) {
      const { deckName, cardValues } = this.customDeckForm.value;
      const values = cardValues.split(',').map((v: string) => v.trim()).filter((v: string) => v);
      
      if (values.length > 0) {
        this.sessionService.addCustomDeck(deckName, values);
        this.showCustomDeckForm = false;
        this.customDeckForm.reset({
          deckName: 'Custom Deck',
          cardValues: ''
        });
      }
    }
  }
} 