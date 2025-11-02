import { Injectable, signal, WritableSignal, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

// Declare the gtag function to make it available in the TypeScript environment.
declare const gtag: (...args: any[]) => void;

export interface AnalyticsEvent {
  name: string;
  params: Record<string, any>;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private _eventsLog: WritableSignal<AnalyticsEvent[]> = signal([]);
  public eventsLog = this._eventsLog.asReadonly();
  // FIX: Explicitly type the injected Router service.
  private router: Router = inject(Router);

  constructor() {
    this.trackEvent('app_load', { component: 'AppComponent' });

    // Manually track page views on router navigation
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.trackPageView(event.urlAfterRedirects);
    });
  }

  public trackEvent(eventName: string, eventParams: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      params: eventParams,
      timestamp: new Date(),
    };

    // Log the event for UI display
    this._eventsLog.update(currentLog => [event, ...currentLog]);
    
    // Send the event to Google Analytics
    try {
      if (typeof gtag === 'function') {
        gtag('event', eventName, eventParams);
      } else {
        console.warn('gtag function not found. Analytics event not sent.');
      }
    } catch (e) {
      console.error('Error sending analytics event:', e);
    }
  }

  private trackPageView(url: string): void {
    try {
      if (typeof gtag === 'function') {
        const fullUrl = window.location.origin + window.location.pathname + '#' + url;
        gtag('event', 'page_view', {
          page_path: url,
          page_location: fullUrl
        });
        // Also log it to our UI log for demonstration purposes
        this.trackEvent('manual_page_view', { page_path: url });
      } else {
        console.warn('gtag function not found. Page view not sent.');
      }
    } catch (e) {
      console.error('Error sending page_view event:', e);
    }
  }
}