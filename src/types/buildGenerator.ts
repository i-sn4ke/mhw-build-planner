import type { ArmorPiece, ArmorSlot, WeaponType } from './armor'
import type { CalculatedSkills } from './calculatedSkill'
import type { SavedBuildData } from './savedBuild'

export interface SkillRequirement {
  skillId: string
  level: number
}

export interface BuildGeneratorRequest {
  weaponType: WeaponType
  rank: ArmorPiece['rank']
  skills: SkillRequirement[]
  fixedArmor?: Partial<Record<ArmorSlot, string>>
}

export interface FixedWeaponBuildGeneratorRequest {
  weaponId: string
  rank: ArmorPiece['rank']
  skills: SkillRequirement[]
  fixedArmor?: Partial<Record<ArmorSlot, string>>
}

export interface GeneratedBuild {
  build: SavedBuildData
  skills: CalculatedSkills
}

export interface BuildGeneratorResult {
  builds: GeneratedBuild[]
  status: 'found' | 'exhausted' | 'limit'
  visitedNodes: number
  elapsedMs: number
}

export type BuildGeneratorResponse =
  | { result: BuildGeneratorResult }
  | { error: string }
