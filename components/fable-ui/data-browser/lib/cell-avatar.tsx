"use client"

import { useState } from "react"

import {
  getDataValue,
  normalizeDataValue,
  type DataRow,
} from "@/lib/fable-ui/core"
import { cn } from "@/lib/utils"

const avatarFieldNames = new Set([
  "avatar",
  "avatarurl",
  "image",
  "imageurl",
  "picture",
  "pictureurl",
  "photo",
  "photourl",
])

const labelFieldNames = [
  "name",
  "fullname",
  "displayname",
  "title",
  "label",
  "customer",
  "username",
  "email",
]

function normalizeKey(key: string) {
  return key.replace(/[^a-z0-9]/gi, "").toLowerCase()
}

export function isAvatarFieldKey(key: string) {
  return avatarFieldNames.has(normalizeKey(key))
}

function getRowKeys(row: DataRow) {
  const keys = new Set(Object.keys(row))
  const cells = row.cells

  if (cells && typeof cells === "object" && !Array.isArray(cells)) {
    Object.keys(cells as Record<string, unknown>).forEach((key) =>
      keys.add(key)
    )
  }

  return Array.from(keys)
}

function getFirstMatchingValue(row: DataRow, keys: string[]) {
  const rowKeys = getRowKeys(row)

  for (const expectedKey of keys) {
    const key = rowKeys.find(
      (candidate) => normalizeKey(candidate) === expectedKey
    )
    const value = key ? getDataValue(row, key) : undefined

    if (value != null && normalizeDataValue(value).trim() !== "") {
      return value
    }
  }

  return undefined
}

function getImageUrl(value: unknown) {
  const text = normalizeDataValue(value).trim()

  if (!text) {
    return undefined
  }

  if (/^data:image\/[a-z0-9.+-]+[,;]/i.test(text)) {
    return text
  }

  try {
    const url = new URL(text)
    return url.protocol === "http:" || url.protocol === "https:"
      ? text
      : undefined
  } catch {
    return undefined
  }
}

function getInitials(value: unknown) {
  const text = normalizeDataValue(value).trim()

  if (!text) {
    return undefined
  }

  const initials = text
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || text.slice(0, 2).toUpperCase()
}

export function getAvatarPresentation(row: DataRow) {
  const avatarValue = getFirstMatchingValue(row, Array.from(avatarFieldNames))
  const labelValue = getFirstMatchingValue(row, labelFieldNames)
  const src = getImageUrl(avatarValue)
  const initials = getInitials(labelValue)
  const label = normalizeDataValue(labelValue).trim() || "Row"

  if (!src && !initials) {
    return null
  }

  return { src, initials: initials ?? "?", label }
}

export function CellAvatar({
  row,
  className,
}: {
  row: DataRow
  className?: string
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const avatar = getAvatarPresentation(row)

  if (!avatar) {
    return null
  }

  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground",
        className
      )}
      aria-hidden="true"
    >
      {avatar.src && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar.src}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        avatar.initials
      )}
    </span>
  )
}
