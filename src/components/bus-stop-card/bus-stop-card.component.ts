import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { BusStopData } from '../../models/bus-stop-data.model';

@Component({
  selector: 'app-bus-stop-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './bus-stop-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusStopCardComponent {
  data = input.required<BusStopData>();

  statusStyles = computed(() => {
    switch (this.data().status) {
      case 'normal':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-500',
          text: 'Normal'
        };
      case 'moderate':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-500',
          text: 'Moderado'
        };
      case 'congested':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-500',
          text: 'Congestionado'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-400',
          text: 'Desconocido'
        };
    }
  });

  personCountStyles = computed(() => {
    const count = this.data().personCount;
    if (count > 10) return 'text-red-600';
    if (count > 5) return 'text-yellow-600';
    return 'text-green-600';
  });
}