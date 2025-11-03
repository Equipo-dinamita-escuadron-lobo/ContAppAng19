import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { DocumentTypesServiceService } from '../../services/document-types-service.service';
import { ClassesOfDocumentsServiceService } from '../../services/classes-of-documents-service.service';

@Component({
  selector: 'app-document-types-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, KeyFilterModule, ButtonModule, Toast, SelectModule],
  templateUrl: './document-types-edit.component.html',
  styleUrl: './document-types-edit.component.css'
})
export class DocumentTypesEditComponent implements OnInit {
  form: FormGroup;
  id!: number;
  classesOptions: { label: string; value: number }[] = [];
  modulesOptions: { label: string; value: number }[] = [];
  initialValue: any = {};

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly messageService: MessageService,
    private readonly service: DocumentTypesServiceService,
    private readonly classesService: ClassesOfDocumentsServiceService
  ) {
    this.form = this.fb.group({
      prefix: ['', [Validators.required, Validators.maxLength(10), Validators.pattern('^[a-zA-Z0-9]+$')]],
      name: ['', [Validators.required]],
      documentClassId: [null, [Validators.required]],
      moduleId: [null, [Validators.required, Validators.min(1), Validators.max(8)]]
    });
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';
    if (!enterpriseId || !this.id) return;

    // Cargar módulos disponibles
    this.service.getAllModules().subscribe({
      next: (modules) => {
        this.modulesOptions = modules.map(m => ({ label: m.name, value: m.id }));
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudieron cargar los módulos disponibles' 
        });
      }
    });

    // Cargar todas las clases activas de una vez para dropdown
    this.classesService.findAllActive(enterpriseId, 0, 200).subscribe((page: any) => {
      const content = page?.content || page || [];
      // Solo cargar clases activas (status = true)
      const activeClasses = content.filter((c: any) => c.status === true);
      this.classesOptions = activeClasses.map((c: any) => ({ label: c.name, value: c.id }));
    });

    this.service.findById(this.id, enterpriseId).subscribe((dt) => {
      this.form.patchValue({
        prefix: dt.prefix,
        name: dt.name,
        documentClassId: dt.documentClassId,
        moduleId: dt.moduleId
      });
      this.initialValue = this.form.getRawValue();
    });
  }

  goBack() {
    this.router.navigate(['/gen-masters/document-types/list']);
  }

  hasChanges(): boolean {
    return JSON.stringify(this.initialValue) !== JSON.stringify(this.form.getRawValue());
  }

  onSubmit() {
    if (this.form.invalid || !this.hasChanges()) {
      this.form.markAllAsTouched();
      return;
    }
    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';
    const payload = {
      id: this.id,
      idEnterprise: enterpriseId,
      ...this.form.value
    } as any;
    this.service.update(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Actualización exitosa', detail: 'Tipo de documento actualizado correctamente.' });
        this.goBack();
      },
      error: (err) => {
        if (err?.status === 409) {
          const msg: string = err?.error?.message || err?.error?.detail || '';
          const prefixMatch = msg.match(/prefijo\s+'([^']+)'/i) || msg.match(/prefijo\s*[:=]\s*([A-Za-z0-9]+)/i);
          const nameMatch = msg.match(/nombre\s+'([^']+)'/i) || msg.match(/nombre\s*[:=]\s*([A-Za-zÀ-ÿ0-9\s]+)/i);
          if (prefixMatch) {
            const p = (prefixMatch[1] || prefixMatch[0])?.toString().replace(/^[^']*'|'/g,'');
            this.messageService.add({ severity: 'error', summary: 'Prefijo ya existente', detail: `El prefijo "${p}" ya existe.` });
            return;
          }
          if (nameMatch) {
            const n = (nameMatch[1] || nameMatch[0])?.toString().replace(/^[^']*'|'/g,'');
            this.messageService.add({ severity: 'error', summary: 'Nombre ya existente', detail: `El tipo de documento "${n}" ya existe.` });
            return;
          }
          this.messageService.add({ severity: 'error', summary: 'Duplicado', detail: 'Ya existe un tipo con el mismo prefijo o nombre.' });
          return;
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el tipo de documento' });
      }
    });
  }
}

