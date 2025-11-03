import { AccountingEntryView } from "../../CashReceipts/Model/view";

// Interfaz unificada para mostrar en la tabla principal
export interface SourceDocumentView {
  uniqueId: string; // Identificador único para la tabla
  id: number;
  code: string; // Código del recibo o del castigo
  date: Date;
  description: string;
  totalAmount: number;
  type: 'RECEIPT' | 'PORTFOLIO_WRITEOFF'; // Tipo de documento
  typeName: 'Recibo de Caja' | 'Castigo de Cartera'; // Nombre para mostrar
  accountingEntry?: AccountingEntryView | null;
  isDetailLoading?: boolean;
}