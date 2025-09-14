import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { DynamicDialogModule } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toast, DynamicDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'ContApp';
}
