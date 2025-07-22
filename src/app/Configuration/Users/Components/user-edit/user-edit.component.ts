import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../Services/user.service';
import { User } from '../../Models/User'; // Asegúrate que el modelo esté en la ruta correcta

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css']
})
export class UserEditComponent implements OnInit {
  userForm!: FormGroup;
  userId!: string;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.initForm();

    this.userService.getUserById(this.userId).subscribe({
      next: (user: User) => {
        this.userForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: '', // preguntar edicion de password
          roles: user.roles,
          username: user.username
        });
      },
      error: () => alert('No se pudo cargar el usuario')
    });
  }

  initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      roles: [[], Validators.required],
      username: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.userService.updateUser(this.userId, this.userForm.value).subscribe({
        next: () => this.router.navigate(['/configuration/users/list']),
        error: () => alert('Error al actualizar usuario')
      });
    }
  }

  onRolesChange(value: string): void {
    const rolesArray = value.split(',').map(role => role.trim()).filter(role => role !== '');
    this.userForm.get('roles')?.setValue(rolesArray);
  }

}
