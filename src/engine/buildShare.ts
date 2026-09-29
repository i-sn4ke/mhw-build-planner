import type { SavedBuildData } from '../types/savedBuild'

export function encodeBuildForUrl(
  build: SavedBuildData,
): string {
  const json = JSON.stringify(build)

  const bytes = new TextEncoder().encode(json)

  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export function decodeBuildFromUrl(
  payload: string,
): SavedBuildData {
  const base64 = payload
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const paddingLength =
    (4 - (base64.length % 4)) % 4

  const paddedBase64 =
    base64 + '='.repeat(paddingLength)

  const binary = atob(paddedBase64)

  const bytes = Uint8Array.from(
    binary,
    (character) => character.charCodeAt(0),
  )

  const json = new TextDecoder().decode(bytes)

  const parsed: unknown = JSON.parse(json)

  if (!isSavedBuildData(parsed)) {
    throw new Error('Invalid build data')
  }

  return parsed
}

function isSavedBuildData(
  value: unknown,
): value is SavedBuildData {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const build = value as Partial<SavedBuildData>

  return (
    build.version === 1 &&
    (typeof build.weaponId === 'string' ||
      build.weaponId === null) &&
    typeof build.armor === 'object' &&
    build.armor !== null &&
    (typeof build.charmId === 'string' ||
      build.charmId === null) &&
    Array.isArray(build.decorations)
  )
}

export function createShareUrl(
  build: SavedBuildData,
): string {
  const payload = encodeBuildForUrl(build)

  const url = new URL(window.location.href)

  url.searchParams.set('b', payload)

  return url.toString()
}

export function getBuildFromShareUrl(): SavedBuildData | null {
  const url = new URL(window.location.href)

  const payload = url.searchParams.get('b')

  if (!payload) {
    return null
  }

  return decodeBuildFromUrl(payload)
}