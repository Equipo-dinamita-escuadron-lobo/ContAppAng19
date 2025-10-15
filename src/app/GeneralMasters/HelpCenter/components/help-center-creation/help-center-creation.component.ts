import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { EditorModule } from 'primeng/editor';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HelpCenterServiceService } from '../../services/help-center.service';
import katex from 'katex';

(window as any).katex = katex;

@Component({
  selector: 'app-help-center-creation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    EditorModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './help-center-creation.component.html',
  styleUrl: './help-center-creation.component.css'
})
export class HelpCenterCreationComponent implements OnInit {
  modules: any[] = [];
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: HelpCenterServiceService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      moduleId: [null as number | null, Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
      status: [true]
    });
  }

  ngOnInit(): void {
    this.loadModules();
  }

  private loadModules(): void {
    this.service.getModules().subscribe({
      next: (modules) => {
        this.modules = modules;
      },
      error: (error: any) => {
        console.error('Error al cargar módulos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los módulos.',
          life: 5000
        });
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.service.create(this.form.value as any).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Centro de ayuda creado correctamente.'
          });
          this.router.navigate(['/gen-masters/help-center/list']);
        },
        error: (error: any) => {
          console.error('Error al crear centro de ayuda:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el centro de ayuda.'
          });
        }
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor, complete todos los campos requeridos.'
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/gen-masters/help-center/list']);
  }
}
