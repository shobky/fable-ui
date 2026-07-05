import type { ShowDataBrowserInput } from "@/lib/fable-ui/tools/show-data-browser-tool"
import type { ShowTableInput } from "@/lib/fable-ui/tools/show-table-tool"

const names = [
  "Nadia Ali",
  "Mina Fahmy",
  "Sarah Adel",
  "Omar Saleh",
  "Lina Nasser",
  "Youssef Mansour",
]
const roles = ["Designer", "Engineer", "Analyst", "Operator"]
const teams = ["North", "South", "West"]
const statuses = ["active", "review", "paused"]

function createInitialsDataUrl(name: string) {
  return `https://api.dicebear.com/10.x/stripes/svg?seed=${encodeURIComponent(name)}`
}

const rows = Array.from({ length: 150 }, (_, index) => {
  const name = names[index % names.length]

  return {
    id: `person-${index + 1}`,
    name,
    avatarUrl: name &&  createInitialsDataUrl(name) ,
    role: roles[index % roles.length],
    team: teams[index % teams.length],
    status: statuses[index % statuses.length],
    score: 70 + (index % 30),
  }
})

export const tableExample: ShowTableInput = {
  title: "Team activity",
  columns: [
    { key: "name", label: "Name", sortable: true },
    { key: "role", label: "Role", filterable: true },
    { key: "team", label: "Team", filterable: true },
    { key: "status", label: "Status", type: "badge", filterable: true },
    {
      key: "score",
      label: "Score",
      type: "number",
      align: "right",
      sortable: true,
    },
  ],
  rows,
  pageSize: 8,
}

export const dataBrowserExample: ShowDataBrowserInput = {
  ...tableExample,
  entityLabel: "people",
  pageSize: 8,
}
