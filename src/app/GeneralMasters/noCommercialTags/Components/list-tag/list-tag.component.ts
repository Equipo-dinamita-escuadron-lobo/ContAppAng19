import { NoCommercialTagService } from './../../Services/no-commercial-tag.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { NoCommercialTag } from '../../Models/NoCommercialTag';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { Router } from '@angular/router';


@Component({
  selector: 'app-list-tag',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule
  ],
  providers:[MessageService,ConfirmationService],
  templateUrl: './list-tag.component.html',
  styleUrl: './list-tag.component.css'
})
export class ListTagComponent implements OnInit {

  tags:NoCommercialTag[]=[];
  filteredTags:NoCommercialTag[]=[];
  loading: boolean = false;
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  entData: any | null = null;

  constructor(private router:Router,
      private noCommercialTagService:NoCommercialTagService,
      private messageService:MessageService,
      private confirmationService:ConfirmationService
    ){

  }


  ngOnInit():void{
    this.entData=this.localStorageMethods.loadEnterpriseData();
    this.loadTags(); // Agregar esta línea para cargar los tags
  }

  loadTags():void{
    if(this.entData?.id){
      this.loading=true;
      //cargar tags primero
      this.noCommercialTagService.getAllTags(this.entData.id).subscribe({
        next:(tags) =>{
          this.tags=tags.map((tag:any)=>({
            id: tag.id,
            title: tag.title,
            description: tag.description
          }));
          this.filteredTags=[...this.tags]
          this.loading = false;
        },
        error:(error)=>{
          console.error('Error al cargar los tags:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:'No se pudieron cargar las etiquetas'
          });
          this.loading = false;
        }
      });

    }
  }


  /**
   * Navega al componente de creación de etiquetas
   */
  createTag(): void {
    console.log('Navegando a crear etiqueta...');
    console.log('Ruta actual:', this.router.url);
    this.router.navigate(['/gen-masters/no-commercial-tags/create']).then(() => {
      console.log('Navegación completada');
    }).catch(error => {
      console.error('Error en navegación:', error);
    });
  }

  /**
   * Navega al componente de edición de etiquetas
   */
  editTag(tag:NoCommercialTag):void{
    console.log('=== editTag() llamado ===');
    console.log('Tag a editar:', tag);
    console.log('Navegando a editar etiqueta:', tag);
    this.router.navigate(['/gen-masters/no-commercial-tags/edit', tag.id],{state:{tagData:tag}}).then(() => {
      console.log('Navegación a edición completada');
    }).catch(error => {
      console.error('Error en navegación a edición:', error);
    });
  }


  /**
   * Confirma y elimina una etiqueta
   */

  deleteTag(tag:NoCommercialTag):void{
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar la etiqueta "${tag.description}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.noCommercialTagService.deleteTag(tag.id).subscribe({
          next:()=>{
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Etiqueta eliminada exitosamente'
            });
            this.loadTags(); 
          },
          error:(error)=>{
            console.error('Error al eliminar la etiqueta:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la etiqueta'
            });
          }
        });
      }
    });
  }





}
