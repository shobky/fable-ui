import { siteConfig } from "@/lib/config";
import Link from "next/link";

export function SiteFooter() {
    return (
        <footer className="max-w-xs sm:max-w-2xl  mx-auto">
            <p className="text-center text-sm text-muted-foreground py-12">Built by <Link className="underline" href={"https://shobky.vercel.app"} target="blank">@shobky</Link>. The source code is available on <Link className="underline" href={siteConfig.links.github} target="blank">
                github</Link></p>
        </footer>
    )
}
