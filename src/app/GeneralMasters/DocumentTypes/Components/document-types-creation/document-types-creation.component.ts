import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { DocumentTypesServiceService } from '../../services/document-types-service.service';
import { ClassesOfDocumentsServiceService } from '../../services/classes-of-documents-service.service';

@Component({
  selector: 'app-document-types-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, KeyFilterModule, ButtonModule, Toast, SelectModule],
  templateUrl: './document-types-creation.component.html',
  styleUrl: './document-types-creation.component.css',
  providers: [MessageService]
})
export class DocumentTypesCreationComponent {
  form: FormGroup;
  classesOptions: { label: string; value: number }[] = [];
  modulesOptions: { label: string; value: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private service: DocumentTypesServiceService,
    private classesService: ClassesOfDocumentsServiceService
  ) {
    this.form = this.fb.group({
      prefix: ['', [Validators.required, Validators.maxLength(10), Validators.pattern('^[a-zA-Z0-9]+$')]],
      name: ['', [Validators.required]],
      documentClassId: [null, [Validators.required]],
      module: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';
    
    this.service.getAllModules().subscribe({
      next: (modules) => {
        this.modulesOptions = modules.map(m => ({ label: m.name, value: m.name }));
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudieron cargar los módulos disponibles' 
        });
      }
    });

    if (enterpriseId) {
      // Cargar todas las clases activas de una vez para dropdown (usar un size alto pero controlado)
      this.classesService.findAllActive(enterpriseId, 0, 200).subscribe((page: any) => {
        const content = page?.content || page || [];
        // Solo cargar clases activas (status = true) y no eliminadas (isDeleted = false)
        const activeClasses = content.filter((c: any) => c.status === true && c.isDeleted !== true);
        this.classesOptions = activeClasses.map((c: any) => ({ label: c.name, value: c.id }));
      });
    }
  }

  goBack() {
    this.router.navigate(['/gen-masters/document-types/list']);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const entData = localStorage.getItem('entData');
    const enterpriseId = entData ? JSON.parse(entData).id : '';
    const payload = {
      idEnterprise: enterpriseId,
      ...this.form.value
    };
    this.service.create(payload as any).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Registro exitoso', detail: 'Tipo de documento creado correctamente.' });
        setTimeout(() => {
          this.goBack();
        }, 1000);
      },
      error: (err) => {
        if (err?.status === 409) {
          const msg: string = err?.error?.message || err?.error?.detail || '';
          const prefixMatch = msg.match(/prefijo\s+'([^']+)'/i) || msg.match(/prefijo\s*[:=]\s*([A-Za-z0-9]+)/i);
          const nameMatch = msg.match(/nombre\s+'([^']+)'/i) || msg.match(/nombre\s*[:=]\s*([A-Za-zÀ-ÿ0-9\s]+)/i);
          if (prefixMatch) {
            const p = (prefixMatch[1] || prefixMatch[0])?.toString().replace(/^[^']*'|'/g,'');
            this.messageService.add({ severity: 'error', summary: 'Prefijo duplicado', detail: `El prefijo "${p}" ya existe.` });
            return;
          }
          if (nameMatch) {
            const n = (nameMatch[1] || nameMatch[0])?.toString().replace(/^[^']*'|'/g,'');
            this.messageService.add({ severity: 'error', summary: 'Nombre duplicado', detail: `El tipo de documento "${n}" ya existe.` });
            return;
          }
          this.messageService.add({ severity: 'error', summary: 'Duplicado', detail: 'Ya existe un tipo con el mismo prefijo o nombre.' });
          return;
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el tipo de documento' });
      }
    });
  }
}
