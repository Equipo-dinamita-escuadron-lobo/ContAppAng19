import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CostCenterNode } from '../../models/cost-center.model';

type LevelType = 'cuenta' | 'subcuenta' | 'auxiliar';

@Component({
  selector: 'app-cost-centers-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule],
  templateUrl: './cost-centers-form.component.html',
  styleUrl: './cost-centers-form.component.css'
})
export class CostCentersFormComponent implements OnChanges {
  @Input() currentLevel: LevelType = 'cuenta';
  @Input() parent?: CostCenterNode | null;

  @Output() submitted = new EventEmitter<{ codeSegment: string; name: string }>();
  @Output() cancelar = new EventEmitter<void>();

  form: FormGroup;
  messageLength = 'dos dígitos';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      code: ['', []],
      // Evitar error "Range out of order in character class" moviendo el guión al final
      name: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\u00f1\u00d1,.()\/ +&%-]+$')]]
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
    if (this.currentLevel === 'auxiliar') {
      control.setValidators([Validators.required, Validators.maxLength(28), Validators.pattern('^[a-zA-Z0-9]+$')]);
    } else {
      control.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(2), Validators.pattern('^[0-9]{2}$')]);
    }
    control.updateValueAndValidity();
  }

  get codeControl() { return this.form.get('code'); }
  get nameControl() { return this.form.get('name'); }

  onCodeKeyDown(event: KeyboardEvent) {
    if (this.currentLevel === 'auxiliar') return; // sin restricción para auxiliar
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
    if (this.currentLevel === 'auxiliar') {
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

  onNameKeyDown(event: KeyboardEvent) {
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', ' ',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'
    ];
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (allowed.includes(event.key)) return;
    const pattern = /^[a-zA-ZÀ-ÿ\u00f1\u00d1,.()\/\-+&%]$/;
    if (!pattern.test(event.key)) event.preventDefault();
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
