interface SpecBlockProps {
  specs: {
    fabric: string
    cut: string
    construction: string
    use: string
    care: string
  }
}

const specLabels: Record<string, string> = {
  fabric: "FABRIC",
  cut: "CUT",
  construction: "CONSTRUCTION",
  use: "USE",
  care: "CARE",
}

export function SpecBlock({ specs }: SpecBlockProps) {
  return (
    <div className="space-y-4">
      {Object.entries(specs).map(([key, value]) => (
        <div key={key}>
          <p className="text-xs text-muted-foreground mb-1">{specLabels[key]}</p>
          <p className="text-sm">{Array.isArray(value) ? value.join(" ") : value}</p>
        </div>
      ))}
    </div>
  )
}
