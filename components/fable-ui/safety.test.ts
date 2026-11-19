import { describe, expect, it } from "vitest"

import { decideImage, isHostAllowed, safeFilename, safeImageUrl, safeLinkUrl, toCsv } from "./safety"

describe("safeLinkUrl", () => {
  it("allows http(s) and mailto only", () => {
    expect(safeLinkUrl("https://example.com/a?b=1")).toBe("https://example.com/a?b=1")
    expect(safeLinkUrl("mailto:a@example.com")).toBe("mailto:a@example.com")
    expect(safeLinkUrl("javascript:alert(1)")).toBeNull()
    expect(safeLinkUrl("JaVaScRiPt:alert(1)")).toBeNull()
    expect(safeLinkUrl("data:text/html,<script>")).toBeNull()
    expect(safeLinkUrl("/relative")).toBeNull()
    expect(safeLinkUrl("https://user:pass@example.com")).toBeNull()
    expect(safeLinkUrl(undefined)).toBeNull()
  })
})

describe("images", () => {
  it("requires https without credentials", () => {
    expect(safeImageUrl("http://example.com/a.png")).toBeNull()
    expect(safeImageUrl("https://a:b@example.com/a.png")).toBeNull()
    expect(safeImageUrl("https://example.com/a.png")?.hostname).toBe("example.com")
  })

  it("matches exact hosts and wildcard subdomains", () => {
    expect(isHostAllowed("images.unsplash.com", ["images.unsplash.com"])).toBe(true)
    expect(isHostAllowed("cdn.example.com", ["*.example.com"])).toBe(true)
    expect(isHostAllowed("example.com", ["*.example.com"])).toBe(false)
    expect(isHostAllowed("evil-example.com", ["*.example.com"])).toBe(false)
    expect(isHostAllowed("example.com.evil.io", ["example.com"])).toBe(false)
  })

  it("asks before loading unknown hosts, and can block them", () => {
    expect(decideImage("https://cdn.example.com/a.png", { allowedHosts: ["cdn.example.com"] }).status).toBe("load")
    expect(decideImage("https://tracker.io/p.gif?secret=1", {})).toMatchObject({ status: "ask", host: "tracker.io" })
    expect(decideImage("https://tracker.io/p.gif", { otherHosts: "block" }).status).toBe("blocked")
    expect(decideImage("javascript:alert(1)").status).toBe("blocked")
  })
})

describe("safeFilename", () => {
  it("forces an extension from the allowlist", () => {
    expect(safeFilename("report.html")).toEqual({ filename: "report.txt", mimeType: "text/plain" })
    expect(safeFilename("../../etc/passwd")).toMatchObject({ filename: "etc-passwd.txt" })
    expect(safeFilename("data.csv")).toEqual({ filename: "data.csv", mimeType: "text/csv" })
    expect(safeFilename("trip", "text/calendar").filename).toBe("trip.ics")
    expect(safeFilename("payload.svg").filename).toBe("payload.txt")
    expect(safeFilename("").filename).toBe("download.txt")
  })
})

describe("toCsv", () => {
  it("quotes values and neutralizes formulas", () => {
    const csv = toCsv(
      [
        { key: "a", label: "A" },
        { key: "b", label: "B" },
      ],
      [{ a: '=HYPERLINK("http://x")', b: "hello, world" }]
    )
    expect(csv).toBe('A,B\n"\'=HYPERLINK(""http://x"")","hello, world"')
  })
})
