/** Erro padronizado da camada de acesso a dados. */
export class ApiError extends Error {
  constructor(message, { status = 0, cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.cause = cause;
  }

  /** Mensagem amigável para exibir na interface. */
  get userMessage() {
    if (this.status === 0) return 'Não foi possível falar com o servidor. Verifique se a API está rodando.';
    if (this.status === 404) return 'Não encontramos o que você procurava.';
    if (this.status === 422 || this.status === 400) return this.message;
    return 'Algo deu errado. Tente novamente.';
  }
}
