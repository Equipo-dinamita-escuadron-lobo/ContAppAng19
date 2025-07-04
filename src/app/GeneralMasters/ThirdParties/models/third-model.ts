export interface Third {
  id: number; // Suponiendo que cada tercero tiene un ID único
  tipoPersona: string; // 'Natural' o 'Jurídica'
  nombres: string; // Para persona natural
  apellidos?: string; // Para persona natural
  razonSocial?: string; // Para persona jurídica
  tipoIdentificacion: string; // Tipo de identificación, por ejemplo, 'Cedula'
  numeroIdentificacion: string; // El número de identificación
  digitoVerificacion?: string; // Dígito de verificación
  estado: boolean; // Activo o Inactivo
  pais: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  celular: string;
  correo: string;
}
