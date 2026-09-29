import type { SkillDefinition } from '../types/skillDefinition'
import generatedSkills from './generated/skills.json'

export const skills: SkillDefinition[] =
  generatedSkills as SkillDefinition[]