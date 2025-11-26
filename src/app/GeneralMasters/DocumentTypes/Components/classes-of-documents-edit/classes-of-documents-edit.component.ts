import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ClassesOfDocumentsServiceService } from '../../services/classes-of-documents-service.service';

@Component({
  selector: 'app-classes-of-documents-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, KeyFilterModule, ButtonModule, Toast],
  templateUrl: './classes-of-documents-edit.component.html',
  styleUrl: './classes-of-documents-edit.component.css'
})
export class ClassesOfDocumentsEditComponent {
  form: FormGroup;
  id!: number;
  private initialName = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly messageService: MessageService,
    private readonly service: ClassesOfDocumentsServiceService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';
    if (this.id && enterpriseId) {
      this.service.findAll(enterpriseId).subscribe((page: any) => {
        const content = page?.content || page || [];
        const current = content.find((c: any) => c.id === this.id);
        if (current) {
          this.form.patchValue({ name: current.name });
          this.initialName = current.name || '';
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/gen-masters/document-types/classes/list']);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.hasChanges()) {
      return;
    }
    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';
    const payload = { id: this.id, idEnterprise: enterpriseId, name: this.form.value.name };
    this.service['http'].put(`${this.service.apiURL}update`, payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Actualización exitosa', detail: 'Clase de documento actualizada correctamente.' });
        this.goBack();
      },
      error: (err) => {
        const errorCode = err?.error?.code || err?.code || '';
        if (errorCode === 'DOCUMENT_CLASS_IN_USE') {
          this.messageService.add({
            severity: 'info',
            summary: 'Información',
            detail: err?.error?.message || 'No se puede editar la clase de documento porque tiene tipos con movimientos contables'
          });
          this.goBack(); // Navegar de vuelta a la lista
          return;
        }
        if (err?.status === 409) {
          const msg: string = err?.error?.message || err?.error?.detail || '';
          const m1 = msg.match(/nombre\s+'([^']+)'/i);
          const m2 = msg.match(/nombre\s*[:=]\s*([A-Za-zÀ-ÿ0-9\s.,;]+)/i);
          const extracted = (m1 && m1[1]) || (m2 && m2[1]) || '';
          const displayName = (this.form.value?.name || extracted || '').toString().trim();
          const detail = displayName ? `La clase "${displayName}" ya existe.` : 'Ya existe una clase con el mismo nombre.';
          this.messageService.add({ severity: 'error', summary: 'Nombre ya existente', detail });
          return;
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la clase' });
      }
    });
  }

  hasChanges(): boolean {
    const current = (this.form.get('name')?.value || '').trim();
    return current !== (this.initialName || '');
  }
}


