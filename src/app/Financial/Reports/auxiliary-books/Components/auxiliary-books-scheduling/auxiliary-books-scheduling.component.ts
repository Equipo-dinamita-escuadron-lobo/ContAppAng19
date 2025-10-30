import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

// Interfaces
interface AuxiliaryBookHistory {
  id: number;
  bookName: string;
  generationDate: Date;
  user: string;
  status: 'Generando' | 'Completado' | 'Error';
}

@Component({
  selector: 'app-auxiliary-books-scheduling',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    SelectButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './auxiliary-books-scheduling.component.html',
  styleUrls: ['./auxiliary-books-scheduling.component.css'],
})
export class AuxiliaryBooksSchedulingComponent implements OnInit, OnChanges {
  @Input() historyItem: AuxiliaryBookHistory | null = null;
  @Output() closeModal = new EventEmitter<void>();

  scheduleForm!: FormGroup;
  sendOptions: any[];
  minDate: Date;

  constructor(private fb: FormBuilder, private messageService: MessageService) {
    this.minDate = new Date();
    this.sendOptions = [
      { label: 'Correo', value: 'email' },
      { label: 'Descarga', value: 'download' },
    ];
  }

  ngOnInit(): void {
    this.scheduleForm = this.fb.group({
      scheduleDate: [new Date(), Validators.required],
      sendType: ['email', Validators.required],
      email: ['', [Validators.email]],
    });

    // Actualizar validadores basados en el tipo de envío
    this.scheduleForm.get('sendType')?.valueChanges.subscribe((type) => {
      const emailControl = this.scheduleForm.get('email');
      if (type === 'email') {
        emailControl?.setValidators([Validators.required, Validators.email]);
      } else {
        emailControl?.clearValidators();
      }
      emailControl?.updateValueAndValidity();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['historyItem'] && this.historyItem) {
      // Podrías pre-rellenar el email si lo tuvieras disponible
    }
  }

  onSubmit(): void {
    if (this.scheduleForm.valid) {
      console.log(
        'Formulario de programación enviado:',
        this.scheduleForm.value
      );
      this.messageService.add({
        severity: 'success',
        summary: 'Programado',
        detail: 'El reporte ha sido programado con éxito.',
      });
      setTimeout(() => this.closeModal.emit(), 1500);
    }
  }
}
