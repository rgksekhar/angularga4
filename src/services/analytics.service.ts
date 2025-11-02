import { Injectable, signal, WritableSignal } from '@angular/core';

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

  constructor() {
    this.trackEvent('app_load', { component: 'AppComponent' });
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
}
