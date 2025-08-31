import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CostCenterNode } from '../../models/cost-center.model';

type LevelType = 'costo' | 'subcosto' | 'auxiliar costo';

@Component({
  selector: 'app-cost-centers-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule],
  templateUrl: './cost-centers-form.component.html',
  styleUrl: './cost-centers-form.component.css'
})
export class CostCentersFormComponent implements OnChanges {
  @Input() currentLevel: LevelType = 'costo';
  @Input() parent?: CostCenterNode | null;

  @Output() submitted = new EventEmitter<{ codeSegment: string; name: string }>();
  @Output() cancelar = new EventEmitter<void>();

  form: FormGroup;
  messageLength = 'dos dígitos';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      code: ['', []],
      name: ['', [Validators.required]]
    });
    this.setCodeValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentLevel']) {
      this.setCodeValidators();
    }
  }

  private setCodeValidators(): void {
    const control = this.codeControl;
    if (!control) return;
    if (this.currentLevel === 'auxiliar costo') {
      control.setValidators([Validators.required, Validators.maxLength(28), Validators.pattern('^[a-zA-Z0-9]+$')]);
    } else {
      control.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(2), Validators.pattern('^[0-9]{2}$')]);
    }
    control.updateValueAndValidity();
  }

  get codeControl() { return this.form.get('code'); }
  get nameControl() { return this.form.get('name'); }

  onCodeKeyDown(event: KeyboardEvent) {
    if (this.currentLevel === 'auxiliar costo') return; // sin restricción para auxiliar
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'
    ];
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (allowed.includes(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  }

  onCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let raw = input.value || '';
    if (this.currentLevel === 'auxiliar costo') {
      let value = raw.replace(/[^a-zA-Z0-9]/g, '');
      if (value.length > 28) value = value.slice(0, 28);
      input.value = value;
      this.codeControl?.setValue(value);
      return;
    }
    let value = raw.replace(/[^0-9]/g, '');
    if (value.length > 2) value = value.slice(0, 2);
    input.value = value;
    this.codeControl?.setValue(value);
  }



  send() {
    if (this.form.valid) {
      this.submitted.emit({
        codeSegment: this.codeControl?.value,
        name: this.nameControl?.value
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancel() {
    this.cancelar.emit();
  }
}
