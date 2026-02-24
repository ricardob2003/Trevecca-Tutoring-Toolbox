import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from "../email.types.js";

interface AzureCommunicationEmailProviderConfig {
  connectionString?: string;
  senderAddress?: string;
}

export class AzureCommunicationEmailProvider implements EmailProvider {
  readonly providerName = "azure-communication-services";

  constructor(
    private readonly config: AzureCommunicationEmailProviderConfig
  ) {}

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    if (!this.config.connectionString || !this.config.senderAddress) {
      throw new Error(
        "Azure Communication Services email provider is missing configuration."
      );
    }

    // Stubbed integration point. Replace with @azure/communication-email client calls.
    const id = `acs-${Date.now()}`;
    console.log("[email:azure-communication-services]", {
      id,
      from: this.config.senderAddress,
      to: input.to,
      subject: input.subject,
    });

    return {
      id,
      provider: this.providerName,
    };
  }
}
