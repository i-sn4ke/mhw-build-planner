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
  excludeFatalis?: boolean
}

export interface FixedWeaponBuildGeneratorRequest {
  weaponId: string | null
  rank: ArmorPiece['rank']
  skills: SkillRequirement[]
  fixedArmor?: Partial<Record<ArmorSlot, string>>
  excludeFatalis?: boolean
}

export interface GeneratedBuild {
  build: SavedBuildData
  skills: CalculatedSkills
  requiredSkillSources?: Record<string, { armor: number; charm: number; setBonus: number; decorations: number; weapon: number }>
}

export interface BuildGeneratorResult {
  builds: GeneratedBuild[]
  status: 'found' | 'exhausted' | 'limit'
  visitedNodes: number
  elapsedMs: number
  /** False when limits or candidate sampling prevent a proof of optimality. */
  optimizationComplete?: boolean
}

export type BuildGeneratorResponse =
  | { result: BuildGeneratorResult }
  | { error: string }
