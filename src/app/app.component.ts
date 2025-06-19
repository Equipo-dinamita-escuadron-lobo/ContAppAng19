import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TestTableComponent } from './Components/test-table/test-table.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TestTableComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'ContAppAng19';
}
