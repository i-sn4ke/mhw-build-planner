import type { SavedBuildData } from '../types/savedBuild'

export function canonicalizeBuild(
  build: SavedBuildData,
): string {
  const decorations = [...build.decorations]
    .sort((a, b) => {
      const locationA = getLocationKey(a.location)
      const locationB = getLocationKey(b.location)

      const locationComparison =
        locationA.localeCompare(locationB)

      if (locationComparison !== 0) {
        return locationComparison
      }

      return a.decorationId.localeCompare(
        b.decorationId,
      )
    })

  const canonicalBuild = {
    version: build.version,
    weaponId: build.weaponId,
    armor: {
      head: build.armor.head ?? null,
      chest: build.armor.chest ?? null,
      arms: build.armor.arms ?? null,
      waist: build.armor.waist ?? null,
      legs: build.armor.legs ?? null,
    },
    charmId: build.charmId,
    decorations,
  }

  return JSON.stringify(canonicalBuild)
}

function getLocationKey(
  location: SavedBuildData['decorations'][number]['location'],
): string {
  if (location.type === 'weapon') {
    return `weapon:${location.slotIndex}`
  }

  return `armor:${location.slot}:${location.slotIndex}`
}

export async function generateBuildFingerprint(
  build: SavedBuildData,
): Promise<string> {
  const canonicalBuild = canonicalizeBuild(build)

  const data = new TextEncoder().encode(canonicalBuild)

  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    data,
  )

  const hashArray = Array.from(
    new Uint8Array(hashBuffer),
  )

  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return hashHex
}