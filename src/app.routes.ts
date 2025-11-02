import { Routes } from '@angular/router';
import { GalleryComponent } from './gallery/gallery.component';

export const routes: Routes = [
  { path: 'gallery/:page', component: GalleryComponent },
  { path: '', redirectTo: '/gallery/1', pathMatch: 'full' },
  { path: '**', redirectTo: '/gallery/1' } // Wildcard route
];
