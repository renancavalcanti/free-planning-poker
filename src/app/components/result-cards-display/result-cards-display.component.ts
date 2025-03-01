import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResultCardComponent } from '../result-card/result-card.component';
import { Vote } from '../../models/session.model';

@Component({
  selector: 'app-result-cards-display',
  standalone: true,
  imports: [CommonModule, ResultCardComponent],
  templateUrl: './result-cards-display.component.html',
  styleUrls: ['./result-cards-display.component.scss']
})
export class ResultCardsDisplayComponent {
  @Input() votes: Vote[] = [];
  @Input() revealed: boolean = false;
  
  // Counter for staggering the reveal animation
  private revealDelayMs: number = 200;
  
  getRevealDelay(index: number): number {
    return index * this.revealDelayMs;
  }
}
