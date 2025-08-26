import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { NoCommercialTagRequest } from '../../Models/NoCommercialTagRequest';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { NoCommercialTagService } from '../../Services/no-commercial-tag.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-create-tag',
  imports: [
    ReactiveFormsModule,
    ButtonModule, 
    InputTextModule,
    SelectModule,
    InputNumberModule,
    MessageModule,
    ToastModule
   ],
  providers: [MessageService],
  templateUrl: './create-tag.component.html',
  styleUrl: './create-tag.component.css'
})
export class CreateTagComponent implements OnInit{
  addForm:FormGroup;
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  entData: any | null = null;


  constructor(private router:Router,private formBuilder:FormBuilder,private messageService:MessageService, private noCommercialTagService:NoCommercialTagService){ 
    this.addForm=formBuilder.group({
      title:['',Validators.required],
      description:['',Validators.required]
    }
    );
  }

  ngOnInit():void{
    console.log('Componente de creación inicializado');
    this.entData = this.localStorageMethods.loadEnterpriseData();
    console.log('Datos de empresa cargados:', this.entData);
  }

  onSubmit():void{
    if(this.addForm.valid){
      const formValue=this.addForm.value;

      const tagData:NoCommercialTagRequest={
        enterpriseId:this.entData?.id ||'',
        title:formValue.title,
        description:formValue.description
      };

      this.noCommercialTagService.createTag(tagData).subscribe({
        next:(response)=>{
          this.messageService.add({
            severity:'success',
            summary:'Éxito',
            detail:'Etiqueta creado exitosamente',
            life:3000
          })

          setTimeout(() => {
            this.goBack();
          }, 1500);
        },
        error:(error)=>{
          console.error('Error al crear etiqueta',error);
          this.messageService.add({
            severity:'error',
            summary:'Error',
            detail:'No se pudo crear la etiqueta'
          });
        }
      });
    }else{
      this.markFormGroupTouched();
    }
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched():void{
    Object.keys(this.addForm.controls).forEach(key=>{
      const control=this.addForm.get(key);
      control?.markAsTouched();
    })
  }


  /**
   * Navega de vuelta a la lista de impuestos
   */
  goBack(): void {
    this.router.navigate(['/gen-masters/no-commercial-tags/list']);
  }

   /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldError(fieldName:string):string{
    const field=this.addForm.get(fieldName);
    if(field?.errors && field.touched){
      if(field.errors['required']){
        return `El campo ${fieldName} es requerido`;
      }
    }
    return '';
  }

}
