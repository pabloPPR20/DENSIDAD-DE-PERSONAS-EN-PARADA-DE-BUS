import { Component, ChangeDetectionStrategy, signal, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusStopService } from './services/bus-stop.service';
import { BusStopData } from './models/bus-stop-data.model';
import { BusStopCardComponent } from './components/bus-stop-card/bus-stop-card.component';
import { finalize, Subject, Subscription, takeUntil, timer } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, BusStopCardComponent]
})
export class AppComponent implements OnInit, OnDestroy {
  private busStopService = inject(BusStopService);

  busStops = signal<BusStopData[]>([]);
  isLoading = signal<boolean>(true);
  isAutoUpdating = signal<boolean>(false);
  error = signal<string | null>(null);

  selectedInterval = signal<number | null>(30);
  countdown = signal<number>(0);
  
  intervals = [
    { label: '5s', value: 5 },
    { label: '10s', value: 10 },
    { label: '30s', value: 30 },
    { label: 'Manual', value: null }
  ];

  private destroy$ = new Subject<void>();
  private timerSubscription?: Subscription;

  constructor() {
    effect(() => {
      this.setupAutoRefresh(this.selectedInterval());
    });
  }

  ngOnInit() {
    // Explicitly trigger the first data load when the component initializes.
    // This fixes the original deadlock and makes the initial state predictable.
    this.loadData(true);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(isInitialLoad: boolean = false) {
    if (isInitialLoad) {
      this.isLoading.set(true);
    } else {
      this.isAutoUpdating.set(true);
    }
    this.error.set(null);

    this.busStopService.fetchBusStopData()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.isAutoUpdating.set(false);
          // When a load finishes, reset the countdown to the selected interval.
          if (this.selectedInterval() !== null) {
            this.countdown.set(this.selectedInterval()!);
          }
        })
      )
      .subscribe({
        next: (data) => this.busStops.set(data),
        error: (err: Error) => {
          console.error('Failed to load bus stop data:', err);
          // Use the detailed error message from the service.
          this.error.set(err.message);
          this.selectedInterval.set(null); // Stop timer on error
        }
      });
  }
  
  selectInterval(interval: number | null) {
    this.selectedInterval.set(interval);
  }

  private setupAutoRefresh(intervalSeconds: number | null) {
    this.timerSubscription?.unsubscribe();

    if (intervalSeconds === null) {
      this.countdown.set(0); // Clear countdown in manual mode
      return;
    }

    // Immediately set the countdown so the UI updates when a new interval is selected.
    this.countdown.set(intervalSeconds);

    // Start ticking after 1 second to begin the countdown.
    this.timerSubscription = timer(1000, 1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Don't countdown if a manual load or another auto-update is in progress.
      if (this.isLoading() || this.isAutoUpdating()) return;

      const currentCountdown = this.countdown();
      if (currentCountdown <= 1) {
        // Time's up, fetch new data in the background.
        this.loadData(false); 
      } else {
        // Decrement countdown.
        this.countdown.update(c => c - 1);
      }
    });
  }
}