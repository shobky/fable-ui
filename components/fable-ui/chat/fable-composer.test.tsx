import { fireEvent, render, screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import { FableComposer } from "./fable-composer"

it("associates each embedded composer's label with its own input", () => {
  const first = vi.fn()
  const second = vi.fn()
  const { container } = render(
    <>
      <FableComposer onSend={first} />
      <FableComposer onSend={second} />
    </>
  )
  const inputs = screen.getAllByRole("textbox", {
    name: "Message",
  }) as HTMLTextAreaElement[]
  expect(inputs).toHaveLength(2)
  expect(inputs[0].id).not.toBe(inputs[1].id)
  expect(
    [...container.querySelectorAll("label")].map((label) => label.control)
  ).toEqual(inputs)
  fireEvent.change(inputs[1], { target: { value: "Second chat" } })
  fireEvent.submit(inputs[1].closest("form")!)
  expect(first).not.toHaveBeenCalled()
  expect(second).toHaveBeenCalledWith("Second chat")
})

it("preserves a draft and prevents submission until provider setup is ready", () => {
  const onSend = vi.fn()
  const { container, rerender } = render(
    <FableComposer onSend={onSend} disabled />
  )
  const input = container.querySelector("textarea")!
  fireEvent.change(input, { target: { value: "Keep my draft" } })
  fireEvent.submit(input.closest("form")!)
  fireEvent.keyDown(input, { key: "Enter" })
  expect(onSend).not.toHaveBeenCalled()
  expect(input.value).toBe("Keep my draft")
  expect(
    container.querySelector<HTMLButtonElement>('button[type="submit"]')!
      .disabled
  ).toBe(true)
  rerender(<FableComposer onSend={onSend} />)
  fireEvent.submit(input.closest("form")!)
  expect(onSend).toHaveBeenCalledExactlyOnceWith("Keep my draft")
})
