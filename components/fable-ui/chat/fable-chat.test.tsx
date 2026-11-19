import { act, fireEvent, render } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"

const chat = vi.hoisted(() => ({
  messages: [],
  status: "ready",
  sendMessage: vi.fn(),
  setMessages: vi.fn(),
  stop: vi.fn(),
  regenerate: vi.fn(),
  clearError: vi.fn(),
  error: undefined,
}))
vi.mock("@ai-sdk/react", () => ({ useChat: () => chat }))

import { FableChat, type FableChatController } from "./fable-chat"
import { createRef } from "react"

afterEach(() => vi.unstubAllGlobals())

it("follows resized content only while the reader is pinned to the latest message", () => {
  const callbacks: ResizeObserverCallback[] = []
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        callbacks.push(callback)
      }
      observe() {}
      disconnect() {}
    }
  )
  const { container, unmount } = render(<FableChat />)
  const viewport = container.querySelector(
    '[data-slot="chat-viewport"]'
  ) as HTMLDivElement
  let contentHeight = 1000
  Object.defineProperties(viewport, {
    scrollHeight: { get: () => contentHeight },
    clientHeight: { get: () => 400 },
  })
  const resize = () =>
    act(() =>
      callbacks.forEach((callback) => callback([], {} as ResizeObserver))
    )

  viewport.scrollTop = 600
  fireEvent.scroll(viewport)
  contentHeight = 1200
  resize()
  expect(viewport.scrollTop).toBe(1200)

  // Reading earlier content must not jump when an image or composer resizes.
  viewport.scrollTop = 100
  fireEvent.scroll(viewport)
  contentHeight = 1400
  resize()
  expect(viewport.scrollTop).toBe(100)

  viewport.scrollTop = 1000
  fireEvent.scroll(viewport)
  contentHeight = 1600
  resize()
  expect(viewport.scrollTop).toBe(1600)
  unmount()
})

it("blocks controller requests while setup is incomplete and resumes with the latest model", () => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    }
  )
  chat.sendMessage.mockClear()
  const controller = createRef<FableChatController>()
  const { rerender, unmount } = render(
    <FableChat
      controllerRef={controller}
      disabled
      body={{ provider: "anthropic", model: "" }}
    />
  )
  act(() => controller.current!.send("Example prompt"))
  expect(chat.sendMessage).not.toHaveBeenCalled()
  rerender(
    <FableChat
      controllerRef={controller}
      body={{ provider: "anthropic", model: "claude-custom" }}
    />
  )
  act(() => controller.current!.send("Example prompt"))
  expect(chat.sendMessage).toHaveBeenCalledExactlyOnceWith(
    { text: "Example prompt" },
    { body: { provider: "anthropic", model: "claude-custom" } }
  )
  unmount()
})
