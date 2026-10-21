import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-empty-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-empty-message.component.html',
  styleUrl: './table-empty-message.component.css'
})
export class TableEmptyMessageComponent {
  @Input() loading: boolean = false;
  @Input() colspan: number = 1;
}
