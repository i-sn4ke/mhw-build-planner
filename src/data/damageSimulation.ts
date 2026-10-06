import generated from './generated/damageSimulation.json'
import type { DamageMonster, LongSwordAttack } from '../types/damageSimulation'

export const damageMonsters = generated.monsters as DamageMonster[]
export const longSwordAttacks = generated.attacks as LongSwordAttack[]
