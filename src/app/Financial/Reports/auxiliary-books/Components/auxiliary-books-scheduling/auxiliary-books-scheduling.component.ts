import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

export interface AuxiliaryBookHistory {
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
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './auxiliary-books-scheduling.component.html',
  styleUrl: './auxiliary-books-scheduling.component.css',
})
export class AuxiliaryBooksSchedulingComponent implements OnInit {
  // Inputs y Outputs para compatibilidad con uso directo en HTML
  @Input() historyItem: AuxiliaryBookHistory | null = null;
  @Output() closeModal = new EventEmitter<any>();

  scheduleForm!: FormGroup;
  minDate: Date;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    public dynamicDialogConfig: DynamicDialogConfig,
    public dynamicDialogRef: DynamicDialogRef
  ) {
    this.minDate = new Date();
  }

  // Getter unificado para leer datos del Dialog o del Input
  get bookInfo() {
    return this.dynamicDialogConfig.data || this.historyItem;
  }

  ngOnInit(): void {
    this.scheduleForm = this.fb.group({
      scheduleDate: [new Date(), Validators.required],
      sendType: ['email', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    // Suscripción para lógica condicional de validadores
    this.scheduleForm.get('sendType')?.valueChanges.subscribe((type) => {
      this.updateValidators(type);
    });

    // Inicialización de estado
    this.updateValidators(this.scheduleForm.get('sendType')?.value);
  }

  setSendType(type: 'email' | 'download') {
    this.scheduleForm.get('sendType')?.setValue(type);
  }

  private updateValidators(type: string) {
    const emailControl = this.scheduleForm.get('email');
    if (type === 'email') {
      emailControl?.setValidators([Validators.required, Validators.email]);
      emailControl?.enable();
    } else {
      emailControl?.clearValidators();
      emailControl?.disable();
      emailControl?.setValue('');
    }
    emailControl?.updateValueAndValidity();
  }

  close(data?: any) {
    if (this.dynamicDialogRef) {
      // Cerrar como modal de PrimeNG
      this.dynamicDialogRef.close(data);
    } else {
      // Emitir evento si es componente embebido
      this.closeModal.emit(data);
    }
  }

  onSubmit(): void {
    if (this.scheduleForm.valid) {
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'La programación se ha guardado correctamente.',
        life: 2000,
      });

      // Pequeño delay para que el usuario vea el Toast antes de cerrar
      setTimeout(() => {
        this.close(this.scheduleForm.value);
      }, 1000);
    } else {
      this.scheduleForm.markAllAsTouched();
    }
  }
}
