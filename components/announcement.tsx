import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { Badge } from "./ui/badge"


export function Announcement() {
  return (
    <Badge asChild variant="secondary" className="bg-muted">
      <Link href="/chat">
        Try for yourself in the playground <ArrowRightIcon />
      </Link>
    </Badge>
  )
}
