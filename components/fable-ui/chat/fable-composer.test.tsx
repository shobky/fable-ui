import { fireEvent, render, screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import { FableComposer } from "./fable-composer"

it("associates each embedded composer's label with its own input", () => {
  const first = vi.fn()
  const second = vi.fn()
  const { container } = render(<><FableComposer onSend={first} /><FableComposer onSend={second} /></>)
  const inputs = screen.getAllByRole("textbox", { name: "Message" }) as HTMLTextAreaElement[]
  expect(inputs).toHaveLength(2)
  expect(inputs[0].id).not.toBe(inputs[1].id)
  expect([...container.querySelectorAll("label")].map((label) => label.control)).toEqual(inputs)
  fireEvent.change(inputs[1], { target: { value: "Second chat" } })
  fireEvent.submit(inputs[1].closest("form")!)
  expect(first).not.toHaveBeenCalled()
  expect(second).toHaveBeenCalledWith("Second chat")
})
