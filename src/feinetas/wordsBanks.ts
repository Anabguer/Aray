/**
 * Carga bancos Palabras congelados (morph + relaciones).
 */
import morphJson from '@feinetas/palabras/morfologia.json'
import semanticJson from '@feinetas/palabras/relaciones-semanticas.json'
import {
  assertValidWordsMorphPairPack,
  type WordsMorphAxis,
  type WordsMorphPairItem,
  type WordsMorphPairPack,
} from '@/feinetas/wordsMorphPairPack'
import {
  assertValidWordsSemanticRelationPack,
  type WordsSemanticRelationItem,
  type WordsSemanticRelationKind,
  type WordsSemanticRelationPack,
} from '@/feinetas/wordsSemanticRelationPack'

let morphPack: WordsMorphPairPack | null = null
let semanticPack: WordsSemanticRelationPack | null = null

export function getWordsMorphPack(): WordsMorphPairPack {
  if (!morphPack) {
    assertValidWordsMorphPairPack(morphJson)
    morphPack = morphJson as WordsMorphPairPack
  }
  return morphPack
}

export function getWordsSemanticPack(): WordsSemanticRelationPack {
  if (!semanticPack) {
    assertValidWordsSemanticRelationPack(semanticJson)
    semanticPack = semanticJson as WordsSemanticRelationPack
  }
  return semanticPack
}

export function listMorphItems(axis: WordsMorphAxis): WordsMorphPairItem[] {
  return getWordsMorphPack().items.filter(
    (i) => i.axis === axis && i.status !== 'deprecated',
  )
}

export function listSemanticItems(
  relation: WordsSemanticRelationKind,
): WordsSemanticRelationItem[] {
  return getWordsSemanticPack().items.filter(
    (i) => i.relation === relation && i.status !== 'deprecated',
  )
}
