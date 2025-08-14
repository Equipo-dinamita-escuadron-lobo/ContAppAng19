import { Component } from '@angular/core';
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
  styleUrl: './classes-of-documents-edit.component.css',
  providers: [MessageService]
})
export class ClassesOfDocumentsEditComponent {
  form: FormGroup;
  id!: number;
  nameKeyFilter: RegExp = /^[A-Za-zÀ-ÿ ]*$/;
  private initialName = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private service: ClassesOfDocumentsServiceService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.pattern('^[A-Za-zÀ-ÿ ]+$')]],
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
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Clase actualizada' });
        this.goBack();
      },
      error: (err) => {
        const detail = err?.error?.message || err?.error?.detail || 'No se pudo actualizar la clase';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      }
    });
  }

  hasChanges(): boolean {
    const current = (this.form.get('name')?.value || '').trim();
    return current !== (this.initialName || '');
  }
}


