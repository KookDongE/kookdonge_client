export class RequestDTO<T> {
  timestamp: string;
  data: T;

  constructor(data: T) {
    this.timestamp = new Date().toISOString();
    this.data = data;
  }
}
