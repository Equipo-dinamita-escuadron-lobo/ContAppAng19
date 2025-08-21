import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProfileService } from '../../Services/profile.service';
import { ProfileUpdateRequest } from '../../Models/Profile';

@Component({
  selector: 'app-profile-edit',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    MessageModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.css',
})
export class ProfileEditComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);

  editProfileForm: FormGroup;
  profileId: string = '';
  profileData: any = null;
  loading: boolean = false;
  initialFormValues: any = null;
  hasChanges: boolean = false;

  constructor() {
    this.editProfileForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
    });

    this.editProfileForm.valueChanges.subscribe(() => {
      this.checkForChanges();
    });
  }

  ngOnInit(): void {
    this.profileId = this.route.snapshot.paramMap.get('id')!;

    const navigation = this.router.getCurrentNavigation();
    const profileData =
      navigation?.extras?.state?.['profileData'] ||
      history.state['profileData'];

    if (profileData) {
      console.log('Datos del perfil recibidos del estado: ', profileData);
      this.profileData = profileData;
    }

    this.loadProfile();
  }

  loadProfile(): void {
    if (this.profileData) {
      console.log('Usando datos del estado de navegacion: ', this.profileData);
      this.setFormValues(this.profileData);
      return;
    }

    if (this.profileId) {
      console.log('Intentando cargar desde API, ID: ', this.profileId);
      this.profileService.getProfileById(this.profileId).subscribe({
        next: (profile) => {
          console.log('Perfil cargado desde API: ', profile);
          this.setFormValues(profile);
        },
        error: (error) => {
          console.error('Error al cargar el perfil desde API: ', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              'No se pudo cargar el perfil, regrese a la lista e intente nuevamente.',
          });
        },
      });
    }
  }

  private setFormValues(profile: any): void {
    console.log(
      'Estableciendo valores del formulario con los datos del perfil: ',
      profile
    );

    this.editProfileForm.patchValue({
      name: profile.name,
      description: profile.description,
    });

    this.initialFormValues = {
      name: profile.name,
      description: profile.description,
    };

    this.hasChanges = false;

    console.log(
      'Valores del formulario despues de patchValue: ',
      this.editProfileForm.value
    );
    console.log('Valores iniciales guardados: ', this.initialFormValues);
  }

  private checkForChanges(): void {
    if (!this.initialFormValues) {
      this.hasChanges = false;
      return;
    }

    const currentValues = this.editProfileForm.value;

    const nameChanged = currentValues.name !== this.initialFormValues.name;
    const descriptionChanged =
      currentValues.description !== this.initialFormValues.description;

    this.hasChanges = nameChanged || descriptionChanged;
  }

  onSubmit(): void {
    if (this.editProfileForm.valid) {
      const formValue = this.editProfileForm.value;

      // Verificar si el nombre cambió respecto al original
      if (formValue.name !== this.initialFormValues.name) {
        // Si el nombre fue cambiado, verificar si ya existe
        this.profileService.findByName(formValue.name).subscribe({
          next: (existingProfiles) => {
            // Si existe algún perfil y no es el actual, mostrar error
            if (
              existingProfiles &&
              existingProfiles.length > 0 &&
              existingProfiles[0].id !== this.profileId
            ) {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Ya existe un perfil con este nombre.',
              });
            } else {
              // No hay duplicado, se puede actualizar
              this.updateProfile(formValue);
            }
          },
          error: (error) => {
            console.error('Error verificando nombre de perfil:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo verificar el nombre del perfil.',
            });
          },
        });
      } else {
        // Si el nombre no cambió, simplemente actualizar
        this.updateProfile(formValue);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  // 🔹 Método auxiliar para actualizar
  private updateProfile(formValue: any): void {
    const profileData: ProfileUpdateRequest = {
      id: this.profileId,
      name: formValue.name,
      description: formValue.description,
    };

    this.profileService.updateProfile(profileData.id, profileData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Perfil actualizado exitosamente.',
          life: 3000,
        });

        setTimeout(() => {
          this.goBack();
        }, 1500);
      },
      error: (error) => {
        console.error('Error al actualizar el perfil: ', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el perfil, intente nuevamente.',
        });
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.editProfileForm.controls).forEach((key) => {
      const control = this.editProfileForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/profiles/list']);
  }

  getFieldError(fieldName: string): string {
    const field = this.editProfileForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `El campo ${fieldName} es requerido`;
      }
    }
    return '';
  }
}
