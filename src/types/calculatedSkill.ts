export interface CalculatedSkill {
  /**
   * Livello effettivamente attivo nella build,
   * già limitato dal cap corrente.
   */
  level: number

  /**
   * Livello massimo attualmente raggiungibile.
   *
   * Esempio:
   * Agitator senza Secret → 5
   * Agitator con Secret → 7
   */
  currentMaxLevel: number

  /**
   * Livello massimo assoluto definito dal gioco.
   *
   * Esempio:
   * Agitator → 7
   */
  absoluteMaxLevel: number

  /**
   * Indica se il cap Secret della skill
   * è attualmente sbloccato.
   *
   * Rimane false per le skill che non
   * possiedono livelli Secret.
   */
  secretUnlocked: boolean
}

export type CalculatedSkills =
  Record<string, CalculatedSkill>