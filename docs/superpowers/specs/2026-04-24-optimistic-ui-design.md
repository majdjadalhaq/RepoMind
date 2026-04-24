# Design Spec: Optimistic UI & High-Performance Streaming

**Date**: 2026-04-24
**Topic**: Chat Performance & UX Polish
**Status**: Draft

## 1. Problem Statement
Currently, the RepoMind chat implementation has two main UX issues:
1. **Perceived Latency**: There is a small but noticeable delay between clicking "Send" and the user message appearing in the chat list.
2. **Streaming Jank**: During LLM response generation, the entire messages array is mapped and re-rendered on every token. In long conversations, this causes CPU spikes, layout thrashing, and a sluggish UI.

## 2. Goals
- Implement **0ms perceived latency** for user message insertion using React 19 `useOptimistic`.
- Achieve **60fps streaming performance** by localizing updates to the active message only.
- Ensure robust rollback and error handling for failed message transitions.

## 3. Architecture

### 3.1. Store Refinement (`ChatStore`)
We will introduce a `streamingMessage` property to the `ChatState` to isolate high-frequency updates from the static message history.

```typescript
interface ChatState {
  messages: Message[];
  streamingMessage: Message | null; // NEW: High-frequency track
  // ... existing fields
  
  setStreamingMessage: (msg: Message | null) => void;
  updateStreamingMessage: (updates: Partial<Message>) => void;
  finalizeStreamingMessage: () => void; // Merges streaming into messages
}
```

### 3.2. Optimistic UI (`ChatArea`)
We will use React 19's `useOptimistic` to bridge the gap during the "Send" action.

```tsx
// Inside ChatArea.tsx
const [optimisticMessages, addOptimisticMessage] = useOptimistic(
  messages,
  (state, newMessage: Message) => [...state, newMessage]
);
```

## 4. Implementation Plan

### Phase 1: Store Infrastructure
1. Update `ChatState` interface in `src/application/store/chat-store.ts`.
2. Implement `setStreamingMessage`, `updateStreamingMessage`, and `finalizeStreamingMessage`.

### Phase 2: Hook Refactoring
1. Update `useSendMessage.ts` to use the new streaming actions.
2. Ensure the `for await` loop only updates the `streamingMessage`.
3. Call `finalizeStreamingMessage` only once when the stream completes or is aborted.

### Phase 3: Component Integration
1. Update `ChatArea.tsx` to use `useOptimistic`.
2. Update the rendering logic to combine `optimisticMessages` and the `streamingMessage`.

## 5. Error Handling
- If the LLM stream fails, `finalizeStreamingMessage` will not be called, and the `streamingMessage` will be cleared.
- `useOptimistic` will handle the rollback of the user message if the initial `sendMessage` promise rejects.

## 6. Self-Review
- **Placeholder scan**: None.
- **Consistency**: The architecture aligns with the hybrid approach (Optimistic + Localized Streaming).
- **Scope**: Focused strictly on chat performance and UX.
- **Ambiguity**: Explicitly defined the "Dual-Track" state.
