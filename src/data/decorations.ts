import type { Decoration } from '../types/decoration'
import generatedDecorations from './generated/decorations.json'

export const decorations: Decoration[] =
  generatedDecorations as Decoration[]