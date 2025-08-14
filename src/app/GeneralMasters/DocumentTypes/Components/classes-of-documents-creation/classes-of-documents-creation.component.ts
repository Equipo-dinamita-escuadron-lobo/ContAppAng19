import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ClassesOfDocumentsServiceService } from '../../services/classes-of-documents-service.service';

@Component({
  selector: 'app-classes-of-documents-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, KeyFilterModule, ButtonModule, Toast],
  templateUrl: './classes-of-documents-creation.component.html',
  styleUrl: './classes-of-documents-creation.component.css',
  providers: [MessageService]
})
export class ClassesOfDocumentsCreationComponent {
  form: FormGroup;
  nameKeyFilter: RegExp = /^[A-Za-zÀ-ÿ ]*$/;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private service: ClassesOfDocumentsServiceService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.pattern('^[A-Za-zÀ-ÿ ]+$')]],
    });
  }

  goBack() {
    this.router.navigate(['/gen-masters/document-types/classes/list']);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';
    const payload = { idEnterprise: enterpriseId, ...this.form.value };
    this.service.create(payload.name, enterpriseId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Registro exitoso', detail: 'Clase de documento creada correctamente.' });
        setTimeout(() => {
          this.goBack();
        }, 1000);
      },
      error: (err) => {
        if (err?.status === 409) {
          this.showDuplicateToast('crear', this.form.value?.name, err?.error?.message || err?.error?.detail || '');
          return;
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la clase' });
      }
    });
  }

  private showDuplicateToast(action: 'crear' | 'actualizar', name?: string, rawMessage?: string) {
    const extracted = this.extractName(rawMessage || '');
    const displayName = (name || extracted || '').toString().trim();
    const summary = action === 'crear' ? 'Nombre duplicado' : 'Nombre ya existente';
    const detail = displayName ? `La clase "${displayName}" ya existe.` : 'Ya existe una clase con el mismo nombre.';
    this.messageService.add({ severity: 'error', summary, detail });
  }

  private extractName(message: string): string | null {
    if (!message) return null;
    const m1 = message.match(/nombre\s+'([^']+)'/i);
    if (m1 && m1[1]) return m1[1];
    const m2 = message.match(/nombre\s*[:=]\s*([A-Za-zÀ-ÿ\s]+)/i);
    if (m2 && m2[1]) return m2[1].trim();
    return null;
  }
}