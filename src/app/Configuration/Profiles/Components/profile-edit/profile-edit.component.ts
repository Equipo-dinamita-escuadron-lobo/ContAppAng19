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

  // Regex solo letras (con acentos), ñ/Ñ y espacios
  private static readonly ONLY_LETTERS_REGEX = /^[a-zA-ZÀ-ÿ\u00f1\u00d1 ]+$/;

  constructor() {
    this.editProfileForm = this.formBuilder.group({
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(ProfileEditComponent.ONLY_LETTERS_REGEX),
        ],
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.pattern(ProfileEditComponent.ONLY_LETTERS_REGEX),
        ],
      ],
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
      this.profileData = profileData;
    }

    this.loadProfile();
  }

  loadProfile(): void {
    if (this.profileData) {
      this.setFormValues(this.profileData);
      return;
    }

    if (this.profileId) {
      this.profileService.getProfileById(this.profileId).subscribe({
        next: (profile) => {
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
    this.editProfileForm.patchValue({
      name: profile.name,
      description: profile.description,
    });

    this.initialFormValues = {
      name: profile.name,
      description: profile.description,
    };

    this.hasChanges = false;
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

      if (formValue.name !== this.initialFormValues.name) {
        this.profileService.findByName(formValue.name).subscribe({
          next: (existingProfiles) => {
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
        this.updateProfile(formValue);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

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
      if (field.errors['pattern']) {
        return `El campo ${fieldName} solo debe contener letras y espacios`;
      }
    }
    return '';
  }
}
