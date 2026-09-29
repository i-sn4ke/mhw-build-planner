import type { Decoration } from '../types/decoration'

interface DecorationSelectorProps {
  decorations: Decoration[]
  slotSize: number
  hasDecoration: boolean
  onSelect: (decoration: Decoration) => void
  onRemove: () => void
  onClose: () => void
}

function DecorationSelector({
  decorations,
  slotSize,
  hasDecoration,
  onSelect,
  onRemove,
  onClose,
}: DecorationSelectorProps) {
  const compatibleDecorations = decorations.filter(
    (decoration) => decoration.slotSize <= slotSize,
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[#30343a] bg-[#191b1f] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#30343a] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              Select Decoration
            </h2>

            <p className="mt-1 text-sm text-[#666a70]">
              Choose a decoration
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-[#9b9b95] transition hover:bg-[#25282d] hover:text-[#e7e4da]"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {hasDecoration && (
            <button
              type="button"
              onClick={onRemove}
              className="mb-3 w-full rounded-lg border border-[#30343a] bg-[#15171a] p-4 text-left text-sm text-[#9b9b95] transition hover:border-red-400 hover:text-red-400"
            >
              Remove decoration
            </button>
          )}

          {compatibleDecorations.length === 0 ? (
            <p className="p-4 text-center text-[#666a70]">
              No compatible decorations available.
            </p>
          ) : (
            <div className="space-y-2">
              {compatibleDecorations.map((decoration) => (
                <button
                  key={decoration.id}
                  type="button"
                  onClick={() => onSelect(decoration)}
                  className="w-full rounded-lg border border-[#30343a] bg-[#15171a] p-4 text-left transition hover:border-[#c99a45] hover:bg-[#1d2024]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#e7e4da]">
                        {decoration.name}
                      </p>

                      <p className="mt-1 text-xs text-[#666a70]">
                        Slot size {slotSize}
                      </p>
                    </div>

                    <span className="flex h-8 w-8 items-center justify-center rounded border border-[#454950] text-sm text-[#c99a45]">
                      {decoration.slotSize}
                    </span>
                  </div>

                  {decoration.skills.length > 0 && (
                    <div className="mt-3 flex gap-3">
                      {decoration.skills.map((skill) => (
                        <span
                          key={skill.skillId}
                          className="text-sm text-[#c99a45]"
                        >
                          {skill.skillId} +{skill.level}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DecorationSelector