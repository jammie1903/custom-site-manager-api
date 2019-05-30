export interface ISecretService {
  get(): string
  encrypt(text: string): string
  decrypt(text: string): string
}
