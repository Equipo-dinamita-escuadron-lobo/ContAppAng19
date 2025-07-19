export interface ResponseDto<T> {
  data: T;
  status: number;
  message: string;
}
