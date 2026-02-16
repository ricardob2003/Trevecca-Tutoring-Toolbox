import { env } from "../../config/env.js";
import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from "./email.types.js";
import { ConsoleEmailProvider } from "./providers/consoleEmailProvider.js";
import { AzureCommunicationEmailProvider } from "./providers/azureCommunicationEmailProvider.js";

export class EmailService {
  constructor(private readonly provider: EmailProvider) {}

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    return this.provider.send(input);
  }

  get providerName() {
    return this.provider.providerName;
  }
}

export function createEmailService() {
  if (env.EMAIL_PROVIDER === "azure-communication-services") {
    return new EmailService(
      new AzureCommunicationEmailProvider({
        connectionString: env.ACS_CONNECTION_STRING,
        senderAddress: env.ACS_SENDER_ADDRESS,
      })
    );
  }

  return new EmailService(new ConsoleEmailProvider());
}
