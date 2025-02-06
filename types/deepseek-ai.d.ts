declare module "deepseek-ai" {
  export interface CompletionResponse {
    data: {
      choices: Array<{
        text: string;
        confidence?: number;
      }>;
    };
  }

  export interface CompletionOptions {
    prompt: string;
    max_tokens: number;
    temperature: number;
  }

  export class Configuration {
    constructor(config: { apiKey: string });
    createCompletion(options: CompletionOptions): Promise<CompletionResponse>;
  }
}
