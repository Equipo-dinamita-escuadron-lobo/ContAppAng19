import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { Client, DropdownOption, Invoice, ReceiptView } from '../Model/Models';
import { Receipt } from '../Model/Receipt';

@Injectable({
  providedIn: 'root'
})
export class CashReceiptService {

  // Base de datos simulada para los recibos.
  private mockReceiptsDB: ReceiptView[] = [
    { id: 1, receiptCode: 'RC-1-10000', issueDate: new Date('2025-06-20'), thirdPartyId: 101, clientName: 'Julian Ruano Majin', status: 'Activo', totalAmount: 60000 },
    { id: 2, receiptCode: 'RC-1-10001', issueDate: new Date('2025-06-19'), thirdPartyId: 105, clientName: 'Julian Piamba', status: 'Activo', totalAmount: 120000 },
    { id: 3, receiptCode: 'RC-1-10002', issueDate: new Date('2025-06-17'), thirdPartyId: 101, clientName: 'Julian Ruano Majin', status: 'Anulado', totalAmount: 85000 },
    { id: 4, receiptCode: 'RC-1-10003', issueDate: new Date('2025-06-17'), thirdPartyId: 103, clientName: 'Juliana Campo', status: 'Activo', totalAmount: 50000 },
    { id: 5, receiptCode: 'RC-1-10004', issueDate: new Date('2025-06-15'), thirdPartyId: 103, clientName: 'Juliana Campo', status: 'Anulado', totalAmount: 75000 },
    { id: 6, receiptCode: 'RC-1-10005', issueDate: new Date('2025-06-14'), thirdPartyId: 101, clientName: 'Julian Ruano Majin', status: 'Activo', totalAmount: 200000 },
    { id: 7, receiptCode: 'RC-1-10006', issueDate: new Date('2025-05-30'), thirdPartyId: 102, clientName: 'Maria Lopez', status: 'Activo', totalAmount: 95000 },
  ];

  // Base de datos simulada para los clientes, para poder buscar el nombre al crear un recibo.
  private mockClientsDB: Client[] = [
    { id: 101, name: 'Julian Ruano Majin' },
    { id: 102, name: 'Maria Lopez' },
    { id: 103, name: 'Pedro Gomez' },
    { id: 104, name: 'Ana Fernandez' },
    { id: 105, name: 'Julian Piamba' },
    { id: 106, name: 'Juliana Campo' }
  ];

  // TODO: Reemplazar con la URL base de tu API
  private apiUrl = 'api/cash-receipts'; 

  constructor(private http: HttpClient) { }

  // --- MÉTODOS PARA DATOS MAESTROS Y RELACIONADOS ---

  getReceiptTypes(): Observable<DropdownOption[]> {
    const data: DropdownOption[] = [
      { label: 'RC-1 - Recibo de Caja', value: 'RC-1' },
      { label: 'RC-2 - Recibo Bancario', value: 'RC-2' },
    ];
    // Simula una llamada HTTP
    return of(data).pipe(delay(200)); 
    // TODO: Cuando conectes al backend:
    // return this.http.get<DropdownOption[]>(`${this.apiUrl}/types`);
  }

  getAuxiliaryAccounts(): Observable<DropdownOption[]> {
    const data: DropdownOption[] = [
        { label: 'Cuenta Auxiliar 1', value: 'aux_1' },
        { label: 'Cuenta Auxiliar 2', value: 'aux_2' },
        { label: 'Cuenta Auxiliar 3', value: 'aux_3' },
    ];
    return of(data).pipe(delay(200));
    // TODO: Cuando conectes al backend:
    // return this.http.get<DropdownOption[]>(`${this.apiUrl}/auxiliary-accounts`);
  }

  getClients(query: string): Observable<Client[]> {
    const filteredClients = this.mockClientsDB.filter(client => 
        client.name.toLowerCase().includes(query.toLowerCase())
    );
    return of(filteredClients).pipe(delay(300));
  }

  getInvoicesByClient(clientId: number): Observable<Invoice[]> {
    let invoices: Invoice[] = [];
    if (clientId === 101) {
      invoices = [
        { id: 1, code: 'FV-2-10000', dueDate: new Date('2025-06-20'), pendingBalance: 1200000 },
        { id: 2, code: 'FV-2-10001', dueDate: new Date('2025-07-15'), pendingBalance: 500000 },
        { id: 3, code: 'FV-2-10002', dueDate: new Date('2025-08-10'), pendingBalance: 750000 },
      ];
    }
    // Podrías añadir más `else if` para simular otros clientes
    
    return of(invoices).pipe(delay(500));
     // TODO: Cuando conectes al backend:
    // return this.http.get<Invoice[]>(`api/invoices/by-client/${clientId}`);
  }

  // --- MÉTODOS PARA EL CRUD DE RECIBOS ---

  getAllReceipts(): Observable<ReceiptView[]> {
    return of([...this.mockReceiptsDB]);
    // TODO: Cuando conectes al backend (probablemente recibirá filtros):
    // return this.http.get<ReceiptView[]>(this.apiUrl, { params: filters });
  }

  createReceipt(receipt: Receipt): Observable<Receipt> {
    console.log('[SERVICE] Creando recibo:', receipt);
    
    // CAMBIO 3: Lógica para añadir el nuevo recibo a nuestra lista en memoria.
    
    // 1. Encontrar el nombre del cliente usando el ID.
    const client = this.mockClientsDB.find(c => c.id === receipt.thirdPartyId);
    const clientName = client ? client.name : 'Cliente Desconocido';

    // 2. Generar un nuevo ID para el recibo (mejor que uno aleatorio para evitar colisiones).
    const newId = this.mockReceiptsDB.length > 0 ? Math.max(...this.mockReceiptsDB.map(r => r.id)) + 1 : 1;

    // 3. Crear el objeto 'ReceiptView' que es el que se muestra en la lista.
    const newReceiptView: ReceiptView = {
      id: newId,
      receiptCode: receipt.receiptCode,
      issueDate: receipt.issueDate,
      thirdPartyId: receipt.thirdPartyId,
      clientName: clientName,
      status: 'Activo', // Asumimos que al crear queda 'Activo'
      totalAmount: receipt.totalAmount,
    };

    // 4. Añadir el nuevo recibo al principio de nuestra lista.
    this.mockReceiptsDB.unshift(newReceiptView);

    // 5. Simular la respuesta del backend: devolver el objeto original con el ID asignado.
    const createdReceipt = { ...receipt, id: newId };
    return of(createdReceipt).pipe(delay(1000));
    
    // TODO: Cuando conectes al backend:
    // return this.http.post<Receipt>(this.apiUrl, receipt);
  }
}
