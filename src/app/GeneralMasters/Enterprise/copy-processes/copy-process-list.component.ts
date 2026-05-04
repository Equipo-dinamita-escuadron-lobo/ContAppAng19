import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { EnterpriseService } from '../services/enterprise.service';
import { CopyProcess } from '../models/CopyProcess';

@Component({
  selector: 'app-copy-process-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    InputTextModule,
    ProgressSpinnerModule,
    FormsModule,
  ],
  providers: [MessageService],
  templateUrl: './copy-process-list.component.html',
  styleUrls: ['./copy-process-list.component.css'],
})
export class CopyProcessListComponent implements OnInit {

  processes: CopyProcess[] = [];
  loading = false;
  restoreDialogVisible = false;
  selectedProcess: CopyProcess | null = null;
  empresaDestinoInput = '';

  constructor(
    private enterpriseService: EnterpriseService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadProcesses();
  }

  loadProcesses(): void {
    this.loading = true;
    this.enterpriseService.getCopyProcesses().subscribe({
      next: (data) => {
        this.processes = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los procesos de copia',
        });
      },
    });
  }

  downloadBackup(process: CopyProcess): void {
    this.enterpriseService.downloadCopyProcessBackup(process.idProceso).subscribe({
      next: (response) => {
        const blob = response.body as Blob;
        const cd = response.headers.get('Content-Disposition');
        let filename = `backup_${process.idProceso}.zip`;
        if (cd) {
          const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match?.[1]) filename = match[1].replace(/['"]/g, '').trim();
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo descargar el backup',
        });
      },
    });
  }

  openRestoreDialog(process: CopyProcess): void {
    this.selectedProcess = process;
    this.empresaDestinoInput = '';
    this.restoreDialogVisible = true;
  }

  confirmRestore(): void {
    if (!this.selectedProcess || !this.empresaDestinoInput.trim()) return;
    this.enterpriseService
      .restoreFromBackup(this.selectedProcess.backupRef!, this.empresaDestinoInput.trim())
      .subscribe({
        next: () => {
          this.restoreDialogVisible = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Restauración iniciada',
            detail: 'El proceso de restauración fue iniciado correctamente',
          });
          this.loadProcesses();
        },
        error: (err) => {
          const status = err?.status;
          let detail = 'No se pudo iniciar la restauración';
          if (status === 404) detail = 'Backup no encontrado';
          if (status === 422) detail = 'El backup está corrupto o es inválido';
          if (status === 400) detail = 'Datos de restauración inválidos';
          this.messageService.add({ severity: 'error', summary: 'Error', detail });
        },
      });
  }

  cancelRestore(): void {
    this.restoreDialogVisible = false;
    this.selectedProcess = null;
    this.empresaDestinoInput = '';
  }
}
