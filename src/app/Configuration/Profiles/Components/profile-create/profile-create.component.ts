import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';

@Component({
  selector: 'app-profile-create',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    InputNumberModule,
    CalendarModule,
  ],
  templateUrl: './profile-create.component.html',
  styleUrl: './profile-create.component.css',
})
export class ProfileCreateComponent implements OnInit {
  profileForm: FormGroup;

  constructor(private FormBuilder: FormBuilder, private router: Router) {
    this.profileForm = this.FormBuilder.group({
      profileName: ['', Validators.required],
      description: ['', Validators.required],
      status: [true, Validators.required],
    });
  }

  ngOnInit(): void { }

  onSubmit(): void{}

  goBack(): void {
    this.router.navigate(['/configuration/profiles/list']);
  }
}
