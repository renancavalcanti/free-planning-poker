import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SessionComponent } from './components/session/session.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'session/:id', component: SessionComponent },
  { path: '**', redirectTo: '' }
];
