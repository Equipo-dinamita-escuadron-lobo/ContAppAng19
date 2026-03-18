export interface ApiResponse<T> {
  data?: T;
  statusCode?: number;
  code?: number;
  message?: string;
}
