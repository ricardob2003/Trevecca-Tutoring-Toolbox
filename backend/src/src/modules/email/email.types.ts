export interface SendEmailInput {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface SendEmailResult {
  id: string;
  provider: string;
}

export interface EmailProvider {
  readonly providerName: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
