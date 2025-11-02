import { Component, ChangeDetectionStrategy, signal, inject, effect, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, distinctUntilChanged } from 'rxjs/operators';

import { PicsumImage } from '../models/image.model';
import { AnalyticsService } from '../services/analytics.service';
import { PaginationComponent } from '../components/pagination/pagination.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, PaginationComponent, FormsModule],
  templateUrl: './gallery.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryComponent {
  // FIX: Explicitly type injected services to resolve type errors.
  private http: HttpClient = inject(HttpClient);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  analyticsService: AnalyticsService = inject(AnalyticsService);

  // State Signals
  images = signal<PicsumImage[]>([]);
  itemsPerPage = signal(12);
  totalPages = signal(10); // Assume 10 pages for this demo
  loading = signal(true);
  error = signal<string | null>(null);

  // Get current page from route params
  private pageFromRoute$ = this.route.paramMap.pipe(
    map(params => Number(params.get('page')) || 1),
    distinctUntilChanged()
  );
  currentPage = toSignal(this.pageFromRoute$, {initialValue: 1});

  // Derived Signals
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  analyticsLog = this.analyticsService.eventsLog;

  constructor() {
    effect(() => {
      const page = this.currentPage();
      // Ensure page is valid before fetching
      if (page > 0) {
        this.fetchImages(page);
      }
    });
  }

  fetchImages(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    const url = `https://picsum.photos/v2/list?page=${page}&limit=${this.itemsPerPage()}`;

    this.http.get<PicsumImage[]>(url).subscribe({
      next: (data) => {
        this.images.set(data);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to fetch images. Error: ${err.message}`);
        this.loading.set(false);
        this.analyticsService.trackEvent('api_error', { error_message: err.message, url });
        this.cdr.markForCheck();
      }
    });
  }
  
  onPageChange(page: number): void {
    this.router.navigate(['/gallery', page]);
    this.analyticsService.trackEvent('navigate_page', { page_number: page, method: 'pagination_buttons' });
  }

  onPageSelect(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      const page = Number(target.value);
      if (page !== this.currentPage()) {
        this.router.navigate(['/gallery', page]);
        this.analyticsService.trackEvent('select_page', { selected_page: page, method: 'dropdown' });
      }
    }
  }

  trackByImageId(index: number, image: PicsumImage): string {
    return image.id;
  }

  prettyPrintJson(params: Record<string, any> | undefined | null): string {
    if (!params || Object.keys(params).length === 0) {
      return '{}';
    }
    return JSON.stringify(params, null, 2);
  }
}