import { armors } from '../data/armor'
import { weapons } from '../data/weapons'
import { charms } from '../data/charms'
import { decorations } from '../data/decorations'
import { skills } from '../data/skills'
import { setBonuses } from '../data/setBonuses'
import { generateArmorBuilds } from '../engine/buildGenerator'
import type { BuildGeneratorRequest, BuildGeneratorResponse } from '../types/buildGenerator'

self.onmessage = (event: MessageEvent<Omit<BuildGeneratorRequest, 'weaponType'>>) => {
  let response: BuildGeneratorResponse
  try {
    response = { result: generateArmorBuilds(event.data, { armors, weapons, charms, decorations, skills, setBonuses }) }
  } catch (error) {
    response = { error: error instanceof Error ? error.message : 'Build generation failed.' }
  }
  self.postMessage(response)
}
