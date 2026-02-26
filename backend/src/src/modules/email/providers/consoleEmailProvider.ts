import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from "../email.types.js";

export class ConsoleEmailProvider implements EmailProvider {
  readonly providerName = "console";

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const id = `console-${Date.now()}`;

    // Stub provider for local development until a real provider is configured.
    console.log("[email:console]", {
      id,
      to: input.to,
      subject: input.subject,
    });

    return {
      id,
      provider: this.providerName,
    };
  }
}
