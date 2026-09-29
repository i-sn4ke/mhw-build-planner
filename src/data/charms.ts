import type { Charm } from '../types/charm'
import generatedCharms from './generated/charms.json'

export const charms: Charm[] =
  generatedCharms as Charm[]