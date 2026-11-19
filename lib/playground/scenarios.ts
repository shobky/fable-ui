import type { FableSpec } from "@/components/fable-ui/schema"

/**
 * Scripted answers for the demo agent. They stream through the real AI SDK
 * pipeline, so the playground exercises the same parsing and rendering a
 * live model does. Figures are illustrative.
 */

const unsplash = (id: string, width = 1400) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`

export const DEMO_IMAGE_HOSTS = ["images.unsplash.com"]

export interface Scenario {
  id: string
  group: "Writing" | "Data" | "Media" | "Forms & drafts" | "Layouts"
  label: string
  prompt: string
  match: RegExp
  /** Plain text streamed before the UI, when the answer needs a lead-in. */
  text?: string
  spec?: FableSpec
}

const article: Scenario = {
  id: "article",
  group: "Writing",
  label: "Long-form article",
  prompt: "Write an article on what we learned from a year of four-day weeks",
  match: /article|four.day|essay|blog/i,
  spec: {
    title: "A year of four-day weeks",
    blocks: [
      {
        type: "article",
        title: "What a year of four-day weeks taught us about focus",
        subtitle:
          "Less time did not mean less work. It meant fewer meetings, sharper priorities, and a calendar that finally matched how we say we work.",
        byline: "Operations team",
        readingTime: "6 min read",
        cover: {
          src: unsplash("1522071820081-009f0129c71c"),
          alt: "A team working together around a table with laptops",
          caption: "Wednesday became our only all-hands day.",
          credit: "Photo: Unsplash",
        },
        sections: [
          {
            heading: "Why we tried it",
            body:
              "Our engagement survey kept returning the same note: people felt **busy but not productive**. Calendars were full by Tuesday, deep work happened after 6 pm, and the best engineers were the most interrupted.\n\nWe ran a six-month pilot with three rules: Fridays off, no meeting longer than 30 minutes, and a written agenda for anything with more than four people.",
          },
          {
            heading: "What changed in the numbers",
            body:
              "Throughput held steady while the hours dropped. Cycle time for product work fell from **9.4 to 7.1 days**, mostly because work stopped waiting on meetings. Voluntary attrition fell by half.\n\nThe surprise was support: response times got *faster*, because we staggered the off day and wrote down the answers people kept asking for.",
          },
          {
            heading: "What was hard",
            body:
              "- **Customer-facing teams** needed a rota, not a blanket rule.\n- **Thursday crunch** crept in for the first two months.\n- **Hiring managers** had to rethink interview loops that assumed five days.\n\nWe treated each as a process bug rather than proof the idea failed.",
          },
          {
            heading: "What we would do again",
            body:
              "Start with meetings, not days. Most of the gain came from removing recurring meetings nobody would miss. The day off was the forcing function that made us do it.\n\n> The four-day week is a deadline for your calendar.",
          },
        ],
      },
      {
        type: "sources",
        items: [
          {
            title: "4 Day Week Global — pilot program results",
            url: "https://www.4dayweek.com/",
            publisher: "4 Day Week Global",
            snippet: "Reports and data from coordinated four-day week trials.",
          },
          {
            title: "Microsoft Work Trend Index",
            url: "https://www.microsoft.com/en-us/worklab/work-trend-index",
            publisher: "Microsoft WorkLab",
            snippet: "Research on meetings, focus time and hybrid work patterns.",
          },
        ],
      },
      {
        type: "actions",
        items: [
          { type: "reply", label: "Shorten to a LinkedIn post", message: "Turn this article into a short LinkedIn post", icon: "edit" },
          { type: "reply", label: "Add a rollout plan", message: "Add a step-by-step rollout plan for another team", icon: "plus" },
        ],
      },
    ],
  },
}

const table: Scenario = {
  id: "table",
  group: "Data",
  label: "Comparison table",
  prompt: "Compare the project management tools we shortlisted",
  match: /compare|comparison|table|tools|shortlist/i,
  spec: {
    title: "Project management tools",
    blocks: [
      {
        type: "markdown",
        text: "**Linear is the best fit for a 40-person product team** that lives in issues and sprints. Asana wins if marketing and ops share the same workspace. Here is the full comparison.",
      },
      {
        type: "table",
        title: "Shortlist",
        description: "Pricing per seat, billed annually. Scores from our two-week trial.",
        sortable: true,
        downloadable: true,
        columns: [
          { key: "tool", label: "Tool" },
          { key: "price", label: "Price / seat", type: "currency", currency: "USD" },
          { key: "score", label: "Trial score", type: "number" },
          { key: "adoption", label: "Adoption", type: "percent" },
          { key: "status", label: "Status", type: "badge" },
          { key: "renewal", label: "Decision by", type: "date" },
        ],
        rows: [
          { tool: "Linear", price: 10, score: 8.9, adoption: 92, status: "Approved", renewal: "2026-12-01" },
          { tool: "Asana", price: 13.49, score: 8.1, adoption: 81, status: "In review", renewal: "2026-12-05" },
          { tool: "Jira", price: 8.6, score: 7.2, adoption: 64, status: "Pending", renewal: "2026-12-10" },
          { tool: "Notion Projects", price: 12, score: 7.6, adoption: 77, status: "In review", renewal: "2026-12-05" },
          { tool: "ClickUp", price: 12, score: 6.8, adoption: 58, status: "Declined", renewal: "2026-11-20" },
          { tool: "Monday", price: 12, score: 7, adoption: 61, status: "Declined", renewal: "2026-11-20" },
        ],
      },
      {
        type: "columns",
        ratio: "equal",
        columns: [
          {
            blocks: [
              {
                type: "list",
                title: "Why Linear",
                style: "check",
                items: [
                  { title: "Fastest triage in the trial", description: "Keyboard-first, median 4 s per issue." },
                  { title: "Cycles match our sprint rhythm" },
                  { title: "Git integration engineers already use" },
                ],
              },
            ],
          },
          {
            blocks: [
              {
                type: "callout",
                tone: "warning",
                title: "Watch out",
                text: "Linear's roadmap views are thinner than Asana's portfolios. Leadership reporting may need a separate dashboard.",
              },
            ],
          },
        ],
      },
      {
        type: "actions",
        items: [
          { type: "reply", label: "Draft the rollout email", message: "Draft an email announcing that we're moving to Linear", icon: "mail" },
          { type: "reply", label: "Estimate yearly cost", message: "Estimate the yearly cost for 40 seats on each tool" },
        ],
      },
    ],
  },
}

const dashboard: Scenario = {
  id: "dashboard",
  group: "Data",
  label: "Metrics dashboard",
  prompt: "Summarize Q3 revenue performance",
  match: /revenue|dashboard|q3|metrics|kpi|sales/i,
  spec: {
    title: "Q3 revenue",
    blocks: [
      {
        type: "heading",
        eyebrow: "Q3 2026 · July – September",
        text: "Revenue grew 18% on the back of annual plans",
        description: "Self-serve carried the quarter; enterprise slipped two deals into October.",
      },
      {
        type: "metrics",
        items: [
          { label: "Revenue", value: 4820000, format: "currency", currency: "USD", delta: 18.2, deltaLabel: "vs Q2" },
          { label: "Net revenue retention", value: 112, format: "percent", delta: 3.1 },
          { label: "New customers", value: 1284, delta: 9.6 },
          { label: "Churn", value: 2.4, format: "percent", delta: -0.6, invertDelta: true, deltaLabel: "lower is better" },
        ],
      },
      {
        type: "columns",
        ratio: "wide-left",
        columns: [
          {
            blocks: [
              {
                type: "chart",
                kind: "area",
                title: "Monthly revenue by segment",
                format: "currency",
                currency: "USD",
                stacked: true,
                xKey: "month",
                series: [
                  { key: "selfServe", label: "Self-serve" },
                  { key: "enterprise", label: "Enterprise" },
                ],
                data: [
                  { month: "Apr", selfServe: 610000, enterprise: 690000 },
                  { month: "May", selfServe: 655000, enterprise: 700000 },
                  { month: "Jun", selfServe: 702000, enterprise: 712000 },
                  { month: "Jul", selfServe: 768000, enterprise: 760000 },
                  { month: "Aug", selfServe: 812000, enterprise: 745000 },
                  { month: "Sep", selfServe: 905000, enterprise: 830000 },
                ],
              },
            ],
          },
          {
            blocks: [
              {
                type: "chart",
                kind: "donut",
                title: "Revenue mix",
                format: "currency",
                currency: "USD",
                xKey: "plan",
                series: [{ key: "revenue", label: "Revenue" }],
                data: [
                  { plan: "Annual", revenue: 2650000 },
                  { plan: "Monthly", revenue: 1180000 },
                  { plan: "Enterprise", revenue: 860000 },
                  { plan: "Services", revenue: 130000 },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "table",
        title: "Top accounts",
        sortable: true,
        columns: [
          { key: "account", label: "Account" },
          { key: "segment", label: "Segment", type: "badge" },
          { key: "arr", label: "ARR", type: "currency", currency: "USD" },
          { key: "growth", label: "Growth", type: "percent" },
          { key: "owner", label: "Owner" },
        ],
        rows: [
          { account: "Northwind Health", segment: "Enterprise", arr: 420000, growth: 34, owner: "Maya Chen" },
          { account: "Atlas Freight", segment: "Enterprise", arr: 310000, growth: 12, owner: "Jonas Weber" },
          { account: "Kite Studio", segment: "Self-serve", arr: 96000, growth: 58, owner: "Priya Nair" },
          { account: "Harbor Labs", segment: "Enterprise", arr: 288000, growth: -4, owner: "Maya Chen" },
          { account: "Plume Retail", segment: "Self-serve", arr: 74000, growth: 41, owner: "Leo Santos" },
        ],
        footer: { account: "Total", arr: 1188000 },
      },
      {
        type: "callout",
        tone: "tip",
        title: "Next quarter",
        text: "Two enterprise renewals (Harbor Labs, Atlas Freight) land in October. Closing both keeps Q4 on the 15% growth plan.",
      },
    ],
  },
}

const trip: Scenario = {
  id: "trip",
  group: "Layouts",
  label: "Trip plan",
  prompt: "Plan three relaxed days in Lisbon",
  match: /lisbon|trip|travel|itinerary|days in/i,
  spec: {
    title: "Three days in Lisbon",
    blocks: [
      {
        type: "hero",
        variant: "cover",
        eyebrow: "Itinerary · 3 days",
        title: "Three slow days in Lisbon",
        description: "Tiled streets, river light and long lunches. Each day stays in one or two neighborhoods so you walk more and commute less.",
        image: { src: unsplash("1536663815808-535e2280d2c2"), alt: "Terracotta rooftops of Lisbon's old town above the river" },
        stats: [
          { label: "Walking per day", value: "≈ 8 km" },
          { label: "Budget per day", value: "€95" },
          { label: "Best months", value: "Apr – Jun" },
        ],
      },
      {
        type: "tabs",
        tabs: [
          {
            label: "Day 1 · Alfama",
            blocks: [
              {
                type: "list",
                style: "timeline",
                items: [
                  { meta: "09:00", title: "Tram 28 from Martim Moniz", description: "Board at the first stop to get a seat." },
                  { meta: "10:30", title: "Castelo de São Jorge", description: "Views over the whole city; go early before the tour groups." },
                  { meta: "13:00", title: "Lunch in Alfama", description: "Grilled sardines and vinho verde in a family tasca." },
                  { meta: "18:30", title: "Sunset at Miradouro da Senhora do Monte" },
                ],
              },
            ],
          },
          {
            label: "Day 2 · Belém",
            blocks: [
              {
                type: "list",
                style: "timeline",
                items: [
                  { meta: "10:00", title: "Jerónimos Monastery", description: "Book a timed ticket online." },
                  { meta: "12:00", title: "Pastéis de Belém", description: "Eat them warm with cinnamon." },
                  { meta: "15:00", title: "MAAT and the riverside walk" },
                  { meta: "20:00", title: "Dinner in Cais do Sodré" },
                ],
              },
            ],
          },
          {
            label: "Day 3 · Chiado",
            blocks: [
              {
                type: "list",
                style: "timeline",
                items: [
                  { meta: "10:00", title: "Bookshops and cafés in Chiado" },
                  { meta: "13:00", title: "Time Out Market", description: "Busy at noon; go at 13:30." },
                  { meta: "16:00", title: "Elevador de Santa Justa", description: "Or walk up for free via the Carmo ruins." },
                  { meta: "21:00", title: "Fado in Bairro Alto" },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "gallery",
        title: "What it looks like",
        layout: "featured",
        images: [
          { src: unsplash("1585208798174-6cedd86e019a"), alt: "A yellow tram on a steep cobbled street", caption: "Tram 28 climbing toward Graça" },
          { src: unsplash("1513735492246-483525079686"), alt: "A riverside city at sunset", caption: "Golden hour from a miradouro" },
          { src: unsplash("1558370781-d6196949e317"), alt: "A narrow street lined with old buildings", caption: "Side streets in the old town" },
          { src: unsplash("1555881400-74d7acaacd8b"), alt: "Colorful houses along a river with boats", caption: "Optional day trip north" },
        ],
      },
      {
        type: "actions",
        items: [
          {
            type: "download",
            label: "Add to calendar",
            icon: "calendar",
            filename: "lisbon-itinerary.ics",
            mimeType: "text/calendar",
            content:
              "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Fable UI//Demo//EN\nBEGIN:VEVENT\nUID:lisbon-day-1@fable-ui\nDTSTART;VALUE=DATE:20270415\nDTEND;VALUE=DATE:20270416\nSUMMARY:Lisbon day 1 — Alfama\nEND:VEVENT\nBEGIN:VEVENT\nUID:lisbon-day-2@fable-ui\nDTSTART;VALUE=DATE:20270416\nDTEND;VALUE=DATE:20270417\nSUMMARY:Lisbon day 2 — Belém\nEND:VEVENT\nBEGIN:VEVENT\nUID:lisbon-day-3@fable-ui\nDTSTART;VALUE=DATE:20270417\nDTEND;VALUE=DATE:20270418\nSUMMARY:Lisbon day 3 — Chiado\nEND:VEVENT\nEND:VCALENDAR",
          },
          { type: "reply", label: "Add a day trip to Sintra", message: "Add a fourth day with a trip to Sintra" },
          { type: "reply", label: "Find places to stay", message: "Suggest three places to stay in Lisbon for this trip" },
        ],
      },
    ],
  },
}

const gallery: Scenario = {
  id: "gallery",
  group: "Media",
  label: "Image gallery",
  prompt: "Show me warm minimal living room ideas",
  match: /living room|interior|inspiration|gallery|moodboard|images|photos/i,
  spec: {
    title: "Warm minimal living rooms",
    blocks: [
      {
        type: "heading",
        eyebrow: "Moodboard",
        text: "Warm minimalism: fewer things, softer materials",
        description: "Low furniture, one saturated accent, natural textures, and daylight doing most of the work.",
      },
      {
        type: "gallery",
        layout: "masonry",
        images: [
          { src: unsplash("1586023492125-27b2c045efd7"), alt: "Living room with a yellow armchair and wall art", caption: "One saturated accent" },
          { src: unsplash("1618221195710-dd6b41faaea6"), alt: "Long living room with low sofa and wood details", caption: "Low, long furniture" },
          { src: unsplash("1567016432779-094069958ea5"), alt: "Orange sofa with a pink cushion", caption: "Color through textiles" },
          { src: unsplash("1616486338812-3dadae4b4ace"), alt: "Bright living room in white and beige", caption: "Layered neutrals" },
          { src: unsplash("1600210492486-724fe5c67fb0"), alt: "Living room with plants and natural light", caption: "Plants as structure" },
          { src: unsplash("1556228453-efd6c1ff04f6"), alt: "Living room with lilac chairs and a round table", caption: "Soft curves" },
          { src: unsplash("1502672260266-1c1ef2d93688"), alt: "Sunlit living room with shelves and plants", caption: "Daylight first" },
        ],
      },
      {
        type: "cards",
        title: "Pieces that set the tone",
        columns: 3,
        items: [
          {
            title: "Bouclé lounge chair",
            description: "Texture without pattern. Works in cream or oat.",
            meta: "€420 – €900",
            badge: "Anchor",
            action: { type: "reply", label: "Show options", message: "Show me five bouclé lounge chairs under €900" },
          },
          {
            title: "Linen curtains",
            description: "Floor-to-ceiling, mounted high, to soften light and add height.",
            meta: "€60 – €180 per panel",
            action: { type: "reply", label: "Show options", message: "Recommend linen curtains for a bright living room" },
          },
          {
            title: "Paper floor lamp",
            description: "Warm, diffuse evening light at eye level.",
            meta: "€90 – €350",
            badge: "Mood",
            action: { type: "reply", label: "Show options", message: "Find paper floor lamps in different sizes" },
          },
        ],
      },
    ],
  },
}

const dinnerForm: Scenario = {
  id: "dinner",
  group: "Forms & drafts",
  label: "Clarifying form",
  prompt: "Help me plan a dinner party",
  match: /dinner|party|host|menu/i,
  spec: {
    title: "Dinner party",
    blocks: [
      {
        type: "markdown",
        text: "A safe default for eight people is **a make-ahead main, one showpiece starter, and a dessert you can plate in two minutes**, so you spend the evening at the table rather than the stove.\n\nTell me a bit more and I'll build the menu, a shopping list and a cooking timeline.",
      },
      {
        type: "form",
        title: "Dinner details",
        description: "Takes 20 seconds. Everything is optional except the guest count.",
        submitLabel: "Plan my dinner",
        fields: [
          { name: "guests", label: "Guests", type: "number", required: true, defaultValue: 8 },
          { name: "date", label: "Date", type: "date" },
          { name: "style", label: "Style", type: "radio", options: ["Casual", "Family style", "Plated"], defaultValue: "Family style" },
          { name: "diet", label: "Dietary needs", type: "select", options: ["None", "Vegetarian", "Vegan", "Gluten-free", "Mixed"] },
          { name: "budget", label: "Budget per person", type: "select", options: ["Under €15", "€15 – €30", "€30 +"] },
          { name: "notes", label: "Anything else?", type: "textarea", placeholder: "Allergies, a cuisine you love, kitchen limits…" },
          { name: "wine", label: "Suggest wine pairings", type: "toggle", defaultValue: true },
        ],
      },
    ],
  },
}

const dinnerPlan: Scenario = {
  id: "dinner-plan",
  group: "Forms & drafts",
  label: "Dinner plan",
  prompt: "Dinner details:",
  match: /^(dinner details|here are my answers)/i,
  spec: {
    title: "Dinner plan",
    blocks: [
      {
        type: "hero",
        variant: "split",
        eyebrow: "Menu · family style",
        title: "Slow-roasted salmon, herbs and citrus",
        description: "Everything but the salmon can be done the day before. Serve on two big platters and let people help themselves.",
        image: { src: unsplash("1504674900247-0877df9cc836"), alt: "Plates of colorful food on a dark table" },
        stats: [
          { label: "Hands-on", value: "1 h 40" },
          { label: "Per person", value: "€24" },
        ],
      },
      {
        type: "columns",
        ratio: "equal",
        columns: [
          {
            blocks: [
              {
                type: "checklist",
                title: "Shopping list",
                items: [
                  { label: "Side of salmon, 1.6 kg", note: "Ask for pin bones removed" },
                  { label: "Lemons ×4, oranges ×2" },
                  { label: "Dill, parsley, chives" },
                  { label: "New potatoes, 2 kg" },
                  { label: "Fennel ×3" },
                  { label: "Greek yogurt, 500 g" },
                  { label: "Dark chocolate 70%, 300 g" },
                ],
              },
            ],
          },
          {
            blocks: [
              {
                type: "list",
                title: "Cooking timeline",
                style: "steps",
                items: [
                  { title: "Make the chocolate pots", meta: "Day before", status: "done" },
                  { title: "Shave fennel, make herb yogurt", meta: "Day before", status: "done" },
                  { title: "Roast the potatoes", meta: "6:30 pm", status: "current" },
                  { title: "Salmon in at 120 °C", meta: "7:15 pm", description: "25–30 minutes, until it just flakes." },
                  { title: "Dress the salad and serve", meta: "7:50 pm" },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "file",
        filename: "dinner-shopping-list.csv",
        mimeType: "text/csv",
        description: "Shopping list with quantities",
        content: "item,quantity,note\nSalmon side,1.6 kg,pin bones removed\nLemons,4,\nOranges,2,\nDill,1 bunch,\nParsley,1 bunch,\nChives,1 bunch,\nNew potatoes,2 kg,\nFennel,3,\nGreek yogurt,500 g,\nDark chocolate 70%,300 g,",
      },
      {
        type: "actions",
        items: [
          { type: "reply", label: "Make it vegetarian", message: "Swap the main for a vegetarian option" },
          { type: "reply", label: "Write the invitation", message: "Write a short, warm invitation message for this dinner" },
        ],
      },
    ],
  },
}

const email: Scenario = {
  id: "email",
  group: "Forms & drafts",
  label: "Email draft",
  prompt: "Draft an email to the team about the launch moving a week",
  match: /email|mail|announce.*team|launch.*(delay|moving)/i,
  spec: {
    title: "Launch delay email",
    blocks: [
      {
        type: "markdown",
        text: "Here's a draft that leads with the new date, owns the reason, and tells people exactly what changes for them. Edit anything before sending.",
      },
      {
        type: "email",
        to: ["product-team@example.com"],
        cc: ["leadership@example.com"],
        subject: "Launch moves to Tuesday, 18 November",
        sendAction: "email.send",
        body:
          "Hi all,\n\nWe're moving the launch by one week, to Tuesday 18 November.\n\nWhy: load testing on Friday showed checkout slowing down above 2,000 concurrent users. We can fix it, but not safely by Tuesday.\n\nWhat changes for you:\n• Engineering: the fix and a second load test land by Thursday.\n• Marketing: the announcement and email campaign shift by one week; no copy changes needed.\n• Support: the help-center articles go live on the 17th instead.\n\nWhat doesn't change: scope, pricing, and the beta customers' early access on the 14th.\n\nThanks for flagging this early — it's the reason we're delaying by a week rather than a month.\n\nAna",
      },
      {
        type: "actions",
        items: [
          { type: "reply", label: "Make it shorter", message: "Make this email shorter and more direct" },
          { type: "reply", label: "Write the customer version", message: "Write a version of this for beta customers" },
        ],
      },
    ],
  },
}

const template: Scenario = {
  id: "template",
  group: "Forms & drafts",
  label: "Editable template",
  prompt: "Give me a reusable template for warm intro requests",
  match: /template|intro request|outreach|reusable/i,
  spec: {
    title: "Intro request template",
    blocks: [
      {
        type: "template",
        title: "Warm intro request",
        description: "Fill the blanks, or switch to edit mode to change the wording.",
        filename: "intro-request.txt",
        variables: [
          { name: "friend", label: "Friend's first name" },
          { name: "contact", label: "Who you want to meet" },
          { name: "company", label: "Their company" },
          { name: "reason", label: "Why them, specifically" },
          { name: "ask", label: "Your ask", value: "a 20-minute call" },
        ],
        body:
          "Hi {{friend}},\n\nWould you be open to introducing me to {{contact}} at {{company}}?\n\nI'm reaching out because {{reason}}. I'd love {{ask}} — no pitch, just to learn from how they approached it.\n\nI've written a short blurb below you can forward as-is, so this takes you one minute. And no worries at all if it's not a good time.\n\nThanks!\n\n—\nForwardable blurb:\n{{contact}}, I'd like to introduce you to a friend who is working on something close to what you did at {{company}}. They're hoping for {{ask}}.",
      },
      {
        type: "callout",
        tone: "tip",
        text: "Intros convert better when the forwardable blurb is under 60 words and names one specific reason.",
      },
    ],
  },
}

const launch: Scenario = {
  id: "launch",
  group: "Layouts",
  label: "Editorial layout (no image)",
  prompt: "Write the launch announcement for our new sync engine",
  match: /launch|announce|announcement|release|sync engine/i,
  spec: {
    title: "Sync engine launch",
    blocks: [
      {
        type: "hero",
        variant: "editorial",
        eyebrow: "Launch · November 2026",
        title: "Offline first. Conflict free. Finally boring.",
        description:
          "The new sync engine keeps every device usable without a connection and merges changes without asking you to pick a winner.",
        stats: [
          { label: "Faster initial sync", value: "6.4×" },
          { label: "Conflicts resolved automatically", value: "99.7%" },
        ],
        actions: [
          { type: "link", label: "Read the docs", url: "https://example.com/docs/sync" },
          { type: "reply", label: "Write the changelog entry", message: "Write a short changelog entry for this launch" },
        ],
      },
      {
        type: "quote",
        text: "We stopped thinking about sync. That is the highest compliment I can give infrastructure.",
        author: "Rhea Okafor",
        source: "Staff engineer, early access customer",
      },
      {
        type: "faq",
        title: "Questions we expect",
        items: [
          { question: "Do I need to migrate anything?", answer: "No. Existing workspaces upgrade in place over the next two weeks. You'll see a banner when yours is done." },
          { question: "What happens to conflicting edits?", answer: "Text merges character by character. For fields like status or assignee, the **latest edit wins** and the previous value stays in history." },
          { question: "Is offline mode available on mobile?", answer: "Yes, on iOS and Android from version 5.2." },
        ],
      },
    ],
  },
}

const howTo: Scenario = {
  id: "how-to",
  group: "Writing",
  label: "Technical how-to",
  prompt: "How do I add rate limiting to a Next.js route handler?",
  match: /rate limit|next\.?js|route handler|code|how do i/i,
  spec: {
    title: "Rate limiting a route handler",
    blocks: [
      {
        type: "markdown",
        text: "Use a **sliding-window limiter keyed by IP (or user id)** in a shared store, and check it at the top of the handler. In-memory counters don't work on serverless, because each instance has its own memory.",
      },
      {
        type: "list",
        style: "steps",
        items: [
          { title: "Pick a shared store", description: "Redis, Upstash, or your database. Anything all instances can reach." },
          { title: "Write a limiter helper", description: "Increment a key per window and read the count atomically." },
          { title: "Call it first in the handler", description: "Return 429 with a Retry-After header when the limit is hit." },
        ],
      },
      {
        type: "code",
        language: "ts",
        filename: "app/api/chat/route.ts",
        code:
          'import { ratelimit } from "@/lib/ratelimit"\n\nexport async function POST(request: Request) {\n  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous"\n  const { success, reset } = await ratelimit.limit(ip)\n\n  if (!success) {\n    return new Response("Too many requests", {\n      status: 429,\n      headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },\n    })\n  }\n\n  // …handle the request\n}',
      },
      {
        type: "callout",
        tone: "warning",
        title: "Behind a proxy",
        text: "Only trust `x-forwarded-for` when your platform sets it. Otherwise clients can spoof it and get a fresh limit per request.",
      },
      {
        type: "details",
        title: "Sensible defaults",
        columns: 2,
        items: [
          { label: "Anonymous", value: "20 requests / minute" },
          { label: "Signed in", value: "60 requests / minute" },
          { label: "Window", value: "Sliding, 60 s" },
          { label: "Response", value: "429 + Retry-After" },
        ],
      },
    ],
  },
}

const help: Scenario = {
  id: "help",
  group: "Layouts",
  label: "What can you do?",
  prompt: "What can you show me?",
  match: /.*/,
  spec: {
    title: "What I can show",
    blocks: [
      {
        type: "hero",
        variant: "spotlight",
        eyebrow: "Demo agent",
        title: "Answers you can read, edit, and act on",
        description: "I'm a scripted demo that streams real Fable specs. Pick one to see how a reply can be shaped. Switch to Live mode to use a real model.",
      },
      {
        type: "cards",
        columns: 3,
        items: [
          { title: "Article", description: "Long-form with contents, export and sources.", badge: "Writing", action: { type: "reply", label: "Show me", message: article.prompt } },
          { title: "Dashboard", description: "Metrics, charts and a sortable table.", badge: "Data", action: { type: "reply", label: "Show me", message: dashboard.prompt } },
          { title: "Trip plan", description: "Cover hero, tabs per day, a gallery and a calendar file.", badge: "Layout", action: { type: "reply", label: "Show me", message: trip.prompt } },
          { title: "Gallery", description: "Masonry moodboard with a lightbox.", badge: "Media", action: { type: "reply", label: "Show me", message: gallery.prompt } },
          { title: "Form", description: "A clarifying question you answer in place.", badge: "Forms", action: { type: "reply", label: "Show me", message: dinnerForm.prompt } },
          { title: "Email draft", description: "Edit, copy, open in your mail app, or send.", badge: "Drafts", action: { type: "reply", label: "Show me", message: email.prompt } },
        ],
      },
    ],
  },
}

/** Order matters: the first match wins, and `help` matches everything. */
export const SCENARIOS: Scenario[] = [dinnerPlan, dinnerForm, email, template, table, dashboard, trip, gallery, launch, article, howTo, help]

export const SUGGESTED = [article, table, dashboard, trip, gallery, dinnerForm, email, template, launch, howTo]

export function pickScenario(text: string) {
  return SCENARIOS.find((scenario) => scenario.match.test(text.trim())) ?? help
}
