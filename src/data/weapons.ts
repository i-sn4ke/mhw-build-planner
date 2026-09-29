import type { Weapon } from '../types/armor'
import generatedWeapons from './generated/weapons.json'

export const weapons: Weapon[] =
  generatedWeapons as Weapon[]