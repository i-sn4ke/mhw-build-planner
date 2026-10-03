import type { Weapon } from '../types/armor'

const huntingHornNotes: Record<string, { name: string; color: string }> = {
  W: { name: 'White', color: '#e7e4da' },
  P: { name: 'Purple', color: '#b68ce3' },
  R: { name: 'Red', color: '#d87878' },
  C: { name: 'Cyan', color: '#75d5df' },
  B: { name: 'Blue', color: '#7da7e8' },
  G: { name: 'Green', color: '#8fcf7a' },
  O: { name: 'Orange', color: '#e5a465' },
  Y: { name: 'Yellow', color: '#e2ce70' },
}

function formatElementType(type: string) {
  return type
    .split(/[-\s]+/)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')
}

function WeaponDetails({ weapon }: { weapon: Weapon }) {
  return (
    <div className="space-y-4">
      {weapon.type === 'gunlance' && weapon.shelling && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-hunter-muted">
            Shelling
          </span>

          <span className="text-right font-semibold text-hunter-text">
            {formatElementType(weapon.shelling)}
            {weapon.shellingLevel !== undefined && (
              <> · Lv {weapon.shellingLevel}</>
            )}
          </span>
        </div>
      )}

      {(weapon.type === 'switch-axe' ||
        weapon.type === 'charge-blade') && weapon.phial && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-hunter-muted">
            Phial
          </span>

          <span className="text-right font-semibold text-hunter-text">
            {formatElementType(weapon.phial)}
            {weapon.phialPower !== undefined && (
              <> ({weapon.phialPower})</>
            )}
          </span>
        </div>
      )}

      {weapon.type === 'insect-glaive' && weapon.kinsectBonus && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-hunter-muted">
            Kinsect Bonus
          </span>

          <span className="text-right font-semibold text-hunter-text">
            {formatElementType(
              weapon.kinsectBonus.replace(/_/g, ' / '),
            )}
          </span>
        </div>
      )}

      {weapon.type === 'hunting-horn' && weapon.notes && (
        <div>
          <p className="mb-2 text-sm text-hunter-muted">
            Notes
          </p>

          <div className="flex flex-wrap gap-2">
            {Array.from(weapon.notes).map((code, index) => {
              const note = huntingHornNotes[code]

              return (
                <span
                  key={`${weapon.id}-note-${index}`}
                  className="inline-flex items-center gap-2 rounded bg-hunter-inset px-3 py-2 text-sm text-hunter-text"
                >
                  {note && (
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: note.color }}
                    />
                  )}
                  {note?.name ?? code}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {weapon.elements.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-hunter-muted">
            Element / Status
          </p>

          <div className="space-y-1">
            {weapon.elements.map((element, index) => (
              <div
                key={`${element.type}-${index}`}
                className="flex items-center justify-between rounded bg-hunter-inset px-3 py-2"
              >
                <span className="text-sm text-hunter-text">
                  {formatElementType(element.type)}
                  {element.hidden && (
                    <span className="ml-2 text-xs text-hunter-muted">
                      Hidden
                    </span>
                  )}
                </span>

                <span className="text-sm font-semibold text-hunter-text">
                  {element.damage}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default WeaponDetails
