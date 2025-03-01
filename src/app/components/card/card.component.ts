import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  @Input() card!: Card;
  @Input() revealed: boolean = false;
  @Input() selected: boolean = false;
  @Output() cardSelected = new EventEmitter<Card>();

  selectCard(): void {
    if (!this.selected) {
      this.cardSelected.emit(this.card);
    }
  }
} 