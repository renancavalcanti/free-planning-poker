import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultCardsDisplayComponent } from './result-cards-display.component';

describe('ResultCardsDisplayComponent', () => {
  let component: ResultCardsDisplayComponent;
  let fixture: ComponentFixture<ResultCardsDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultCardsDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultCardsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
