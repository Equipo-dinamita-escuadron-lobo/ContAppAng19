import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { EditorModule } from 'primeng/editor';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HelpCenterServiceService } from '../../services/help-center.service';
import { HelpCenterValidators } from '../../services/help-center-validators.service';
import katex from 'katex';

(window as any).katex = katex;

@Component({
  selector: 'app-help-center-edit',
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
  templateUrl: './help-center-edit.component.html',
  styleUrl: './help-center-edit.component.css'
})
export class HelpCenterEditComponent implements OnInit {
  modules: any[] = [];
  form: FormGroup;
  helpCenterId: number = 0;
  isLoading: boolean = true;
  initialFormValue: any = null;

  constructor(
    private fb: FormBuilder,
    private service: HelpCenterServiceService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      id: [null],
      moduleId: [null as number | null, Validators.required],
      name: ['', Validators.required],
      description: ['', HelpCenterValidators.quillEditorRequired],
      status: [true]
    });
  }

  ngOnInit(): void {
    this.helpCenterId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.helpCenterId) {
      this.loadModules();
      this.loadHelpCenter();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'ID de centro de ayuda no válido.'
      });
      this.router.navigate(['/gen-masters/help-center/list']);
    }
  }

  private loadModules(): void {
    this.service.getModules().subscribe({
      next: (modules) => {
        this.modules = modules;
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los módulos.',
          life: 5000
        });
      }
    });
  }

  private loadHelpCenter(): void {
    this.service.findById(this.helpCenterId).subscribe({
      next: (helpCenter) => {
        this.form.patchValue({
          id: helpCenter.id,
          moduleId: helpCenter.moduleId,
          name: helpCenter.name,
          description: helpCenter.description,
          status: helpCenter.status
        });
        this.initialFormValue = this.form.value;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el centro de ayuda.',
          life: 5000
        });
        this.router.navigate(['/gen-masters/help-center/list']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.service.update(this.form.value as any).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Centro de ayuda actualizado correctamente.'
          });
          this.router.navigate(['/gen-masters/help-center/list']);
        },
        error: (error: any) => {
          let errorMessage = 'No se pudo actualizar el centro de ayuda.';
          let errorSummary = 'Error';
          
          if (error?.error) {
            if (error.error.code === 'HELP_CENTER_ALREADY_EXISTS') {
              errorSummary = 'Nombre duplicado';
              errorMessage = error.error.message;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            }
          }
          
          this.messageService.add({
            severity: 'error',
            summary: errorSummary,
            detail: errorMessage,
            life: 5000
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

  hasChanges(): boolean {
    if (!this.initialFormValue) return false;
    return JSON.stringify(this.form.value) !== JSON.stringify(this.initialFormValue);
  }
}
