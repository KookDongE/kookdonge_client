export class ResponseDTO<T> {
  timestamp: string;
  status: string;
  message: string;
  data: T;

  constructor(timestamp: string, status: string, message: string, data: T) {
    this.timestamp = timestamp;
    this.status = status;
    this.message = message;
    this.data = data;
  }
}
