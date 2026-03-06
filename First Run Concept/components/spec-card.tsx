interface SpecCardProps {
  fabric?: string
  weight?: string
  construction?: string
  pockets?: string
  finish?: string
  made?: string
  condensed?: boolean
}

export function SpecCard({ fabric, weight, construction, pockets, finish, made, condensed = false }: SpecCardProps) {
  const specs = [
    { label: "FABRIC", value: fabric },
    { label: "WEIGHT", value: weight },
    { label: "CONSTRUCTION", value: construction },
    { label: "POCKETS", value: pockets },
    { label: "FINISH", value: finish },
    { label: "MADE", value: made },
  ].filter((s) => s.value)

  if (specs.length === 0) return null

  // Condensed version shows only first 3 specs
  const displaySpecs = condensed ? specs.slice(0, 3) : specs

  return (
    <div className="border border-border">
      <table className="w-full text-sm">
        <tbody>
          {displaySpecs.map((spec, index) => (
            <tr key={spec.label} className={index !== displaySpecs.length - 1 ? "border-b border-border" : ""}>
              <td className="py-3 px-4 text-muted-foreground font-medium w-1/3">{spec.label}</td>
              <td className="py-3 px-4">{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
