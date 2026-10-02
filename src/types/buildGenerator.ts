import type { ArmorPiece } from './armor'
import type { CalculatedSkills } from './calculatedSkill'
import type { SavedBuildData } from './savedBuild'

export interface SkillRequirement {
  skillId: string
  level: number
}

export interface BuildGeneratorRequest {
  weaponId: string
  rank: ArmorPiece['rank']
  skills: SkillRequirement[]
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
