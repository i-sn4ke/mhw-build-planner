interface StatsPanelProps {
  defense: number
  resistances: {
    fire: number
    water: number
    thunder: number
    ice: number
    dragon: number
  }
}

const resistanceNames = {
  fire: 'Fire',
  water: 'Water',
  thunder: 'Thunder',
  ice: 'Ice',
  dragon: 'Dragon',
}

function StatsPanel({
  defense,
  resistances,
}: StatsPanelProps) {
  return (
    <div className="rounded-lg border border-[#30343a] bg-[#191b1f] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9b9b95]">
        Stats
      </h2>

      <div className="mt-4">
        <div className="flex items-center justify-between border-b border-[#30343a] pb-3">
          <span className="text-sm text-[#9b9b95]">
            Defense
          </span>

          <span className="text-lg font-semibold text-[#e7e4da]">
            {defense}
          </span>
        </div>

        <div className="mt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#666a70]">
            Resistances
          </h3>

          <div className="space-y-2">
            {Object.entries(resistances).map(
              ([element, value]) => (
                <div
                  key={element}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-[#9b9b95]">
                    {
                      resistanceNames[
                        element as keyof typeof resistanceNames
                      ]
                    }
                  </span>

                  <span
                    className={
                      value > 0
                        ? 'text-sm text-[#8fcf7a]'
                        : value < 0
                          ? 'text-sm text-[#d87878]'
                          : 'text-sm text-[#9b9b95]'
                    }
                  >
                    {value > 0 ? `+${value}` : value}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsPanel