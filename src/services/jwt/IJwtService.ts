export interface IJwtService {
  create<T extends object>(tokenBody: T): string
  unpack<T extends object>(token: string): T
}
