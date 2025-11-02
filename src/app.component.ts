import { Component, ChangeDetectionStrategy, signal, inject, effect, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { PicsumImage } from './models/image.model';
import { AnalyticsService } from './services/analytics.service';
import { PaginationComponent } from './components/pagination/pagination.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, PaginationComponent, FormsModule],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  analyticsService = inject(AnalyticsService);

  // State Signals
  images = signal<PicsumImage[]>([]);
  currentPage = signal(1);
  itemsPerPage = signal(12);
  totalPages = signal(10); // Assume 10 pages for this demo
  loading = signal(true);
  error = signal<string | null>(null);

  // Derived Signals
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  analyticsLog = this.analyticsService.eventsLog;

  constructor() {
    effect(() => {
      const page = this.currentPage();
      this.fetchImages(page);
    }, { allowSignalWrites: true });
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
    this.currentPage.set(page);
    this.analyticsService.trackEvent('navigate_page', { page_number: page, method: 'pagination_buttons' });
  }

  onPageSelect(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      const page = Number(target.value);
      if (page !== this.currentPage()) {
        this.currentPage.set(page);
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
