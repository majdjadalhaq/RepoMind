# Optimistic UI & High-Performance Streaming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement React 19 `useOptimistic` for instant user feedback and a "streaming track" for 60fps chat performance.

**Architecture:** Introduce a `streamingMessage` state in the store to isolate high-frequency updates from the static message history. Use `useOptimistic` in the UI to bridge the gap during message insertion.

**Tech Stack:** React 19, Zustand, Framer Motion, Tailwind CSS.

---

### Task 1: Store Infrastructure (High-Frequency Track)

**Files:**
- Modify: `src/application/store/chat-store.ts`

- [ ] **Step 1: Update ChatState interface**
Add `streamingMessage` and related actions.
```typescript
interface ChatState {
  // ... existing
  streamingMessage: Message | null;
  setStreamingMessage: (message: Message | null) => void;
  updateStreamingMessage: (updates: Partial<Message>) => void;
  finalizeStreamingMessage: () => void;
}
```

- [ ] **Step 2: Implement actions in useChatStore**
```typescript
  streamingMessage: null,
  setStreamingMessage: (streamingMessage) => set({ streamingMessage }),
  updateStreamingMessage: (updates) => set((state) => ({
    streamingMessage: state.streamingMessage ? { ...state.streamingMessage, ...updates } : null
  })),
  finalizeStreamingMessage: () => set((state) => {
    if (!state.streamingMessage) return state;
    return {
      messages: [...state.messages, state.streamingMessage],
      streamingMessage: null
    };
  }),
```

- [ ] **Step 3: Commit**
```bash
git add src/application/store/chat-store.ts
git commit -m "feat: add streaming track to chat store"
```

### Task 2: High-Performance Streaming Hook

**Files:**
- Modify: `src/presentation/hooks/use-send-message.ts`

- [ ] **Step 1: Refactor sendMessage to use streaming track**
Update the loop to call `updateStreamingMessage` instead of mapping over all `messages`.
```typescript
      // Before loop
      setStreamingMessage(initialBotMessage);

      for await (const chunk of stream) {
        if (controller.signal.aborted || !abortControllerRef.current) break;
        
        // ... (chunk logic)
        updateStreamingMessage(updatedMsg);
      }

      // After loop
      finalizeStreamingMessage();
```

- [ ] **Step 2: Commit**
```bash
git add src/presentation/hooks/use-send-message.ts
git commit -m "perf: refactor streaming to use localized state track"
```

### Task 3: React 19 Optimistic UI

**Files:**
- Modify: `src/components/ChatArea.tsx`

- [ ] **Step 1: Integrate useOptimistic**
```tsx
  const { messages, streamingMessage, isLoading } = useChatStore();
  
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage]
  );
```

- [ ] **Step 2: Combine and render messages**
Combine `optimisticMessages` and `streamingMessage` for the final render list.
```tsx
  const allMessages = [...optimisticMessages];
  if (streamingMessage) {
    allMessages.push(streamingMessage);
  }
```

- [ ] **Step 3: Update onSendMessage prop**
The parent (`App.tsx`) should handle the `addOptimisticMessage` call or we do it in a wrapper.

- [ ] **Step 4: Commit**
```bash
git add src/components/ChatArea.tsx
git commit -m "feat: implement React 19 useOptimistic in ChatArea"
```
