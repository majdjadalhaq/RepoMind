import { AIConfig, ChatMessage, StreamChunk, AIProviderAdapter } from '../../core/types/ai';

export class MockAdapter implements AIProviderAdapter {
  async *streamResponse(_config: AIConfig, messages: ChatMessage[]): AsyncGenerator<StreamChunk> {
    const lastMessage = messages[messages.length - 1].content;
    
    // Simulate thinking
    yield { thinking: "I am analyzing your request and the provided repository context... (MOCK MODE)" };
    await new Promise(r => setTimeout(r, 800));
    yield { thinking: "\nSearching for patterns in the selected files..." };
    await new Promise(r => setTimeout(r, 600));

    const response = `This is a **RepoMind Mock Response**. 
I have received your message: "${lastMessage}".

In a real scenario with an API key, I would be analyzing your selected repository files using advanced LLMs. 
Currently, I am operating in **Zero-Cost Simulation Mode** to verify the UI and integration logic.

- **Status**: Operational
- **Context**: Received
- **UI State**: Verified

You can continue testing the Sidebar, File Explorer, and Gateway without an active API key.`;

    const words = response.split(' ');
    for (const word of words) {
      yield { text: word + ' ' };
      await new Promise(r => setTimeout(r, 40));
    }

    yield { isDone: true };
  }
}

export const mockAdapter = new MockAdapter();
