import { TypeId } from './../../../ThirdParties/models/TypeId';
import { NoCommercialTagUpdateRequest } from './../../Models/NoCommercialTagUpdateRequest';
import { NoCommercialTag } from './../../Models/NoCommercialTag';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { NoCommercialTagService } from '../../Services/no-commercial-tag.service';
import { MessageService } from 'primeng/api';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { NoCommercialTagRequest } from '../../Models/NoCommercialTagRequest';

@Component({
  selector: 'app-edit-tag',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MessageModule,
    ToastModule
  ],
  providers:[MessageModule],
  templateUrl: './edit-tag.component.html',
  styleUrl: './edit-tag.component.css'
})
export class EditTagComponent implements OnInit {

  editForm: FormGroup;
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  tagId:number=0;
  entData: any | null = null;
  tagData: any = null;
  loading: boolean = false;
  initialFormValues: any = null;
  hasChanges: boolean = false;



  constructor(private router:Router,
    private route:ActivatedRoute,
    private formBuilder:FormBuilder,
    private NoCommercialTagService:NoCommercialTagService,
    private messageService:MessageService ){

    this.editForm=this.formBuilder.group({
      title:['',Validators.required],
      description:['',Validators.required]
    });

    //Suscribirse a cambios del formulario para detectar modificaciones
    this.editForm.valueChanges.subscribe(()=>{
      this.checkForChanges;
    });
  }

  ngOnInit():void{
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.tagId=Number(this.route.snapshot.paramMap.get('id'));

    // Intentar obtener los datos de la etiqueta del estado de navegacion
    const navigation=this.router.getCurrentNavigation();
    const tagData=navigation?.extras?.state?.['tagData'] || history.state?.tagData;

    if(tagData){
      console.log('Datos de etiuetas recibidos del estado: ',tagData);
      this.tagData=tagData;

    }

  }


  loadTax():void{
    if(this.tagData){
      console.log('Usando datos del estado de navega');
      this.setFormValues(this.tagData);
      return;

    }

    // Fallback: intentar cargar desde API (aunque puede no estar implementado)
    if(this.tagId){
      console.log('Intentando cargar desde API, ID:', this.tagId);
      this.NoCommercialTagService.getTagById(this.tagId).subscribe({
        next:(tag)=>{
          console.log('etiqueta cargada desde API:', tag);
          this.setFormValues(tag);
        },
        error:(error)=>{
          console.error('Error al cargar la etiqueta desde API:', error);
          this.messageService.add({
            severity:'error',
            summary:'Error',
            detail:'No se pudo cargar la etiqueta. por favor, regrese a la lista e intente nuevamente. '
          });
        }
      });

    }

  }

  /**
   * Verifica si hay cambios en el formulario comparando con los valores iniciales
  */
  private checkForChanges():void{
    if(!this.initialFormValues){
      this.hasChanges=false;
      return;
    }

    const currentValues=this.editForm.value;
    //comparar cada campo
    const titleChanged=currentValues.title !==this.initialFormValues.title;
    const descriptionChanged=currentValues.description !==this.initialFormValues.description;

    this.hasChanges=titleChanged || descriptionChanged;

  }

  /**
   * Establece los valores del formulario con los datos de la etiqueta
   */

  private setFormValues(tag:any):void{
    this.editForm.patchValue({
      title:tag.title,
      description:tag.description
    });

     // Guardar valores iniciales para comparar cambios
    this.initialFormValues={
      title:tag.title,
      description:tag.description
    };

    // Resetear estado de cambios
    this.hasChanges = false;

    console.log('Valores del formulario después de patchValue:', this.editForm.value);
    console.log('Valores iniciales guardados:', this.initialFormValues);

  }

  /**
   * Maneja el envío del formulario
   */

  onSubmit():void{
    if(this.editForm.valid){
      const formValue=this.editForm.value;

      const tagData:NoCommercialTag={
        id:this.tagId,
        title:formValue.Title,
        description:formValue.description
      };

      this.NoCommercialTagService.updateTag(this.tagData.id,this.tagData).subscribe({
        next:(response) =>{
          this.messageService.add({
            severity:'success',
            summary:'Éxito',
            detail: 'etiqueta actualizado exitosamente',
            life:3000
          });
          setTimeout(() => {
            this.goBack();
          }, 1500);
  
        },
        error:(error)=>{
          console.error('Error al actualizar la etiqueta'),error;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la etiqueta'
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
  private markFormGroupTouched(): void {
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
      control?.markAsTouched();
    });
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
    const field=this.editForm.get(fieldName);
    if(field?.errors && field.touched){
      if(field.errors['required']){
        return `El campo ${fieldName} es requerido`;
      }
    }
    return '';
  }




}
