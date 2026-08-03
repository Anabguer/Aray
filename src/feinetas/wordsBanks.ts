/**
 * Carga bancos Palabras congelados.
 */
import morphJson from '@feinetas/palabras/morfologia.json'
import semanticJson from '@feinetas/palabras/relaciones-semanticas.json'
import clasificaJson from '@feinetas/palabras/clasifica.json'
import montaFraseJson from '@feinetas/palabras/monta-frase.json'
import variosParesJson from '@feinetas/palabras/varios-pares.json'
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
import {
  assertValidWordsClasificaPack,
  type WordsClasificaItem,
  type WordsClasificaPack,
} from '@/feinetas/wordsClasificaPack'
import {
  assertValidWordsMontaFrasePack,
  type WordsMontaFraseItem,
  type WordsMontaFrasePack,
} from '@/feinetas/wordsMontaFrasePack'
import {
  assertValidWordsVariosParesPack,
  type WordsVariosKind,
  type WordsVariosParItem,
  type WordsVariosParesPack,
} from '@/feinetas/wordsVariosParesPack'

let morphPack: WordsMorphPairPack | null = null
let semanticPack: WordsSemanticRelationPack | null = null
let clasificaPack: WordsClasificaPack | null = null
let montaFrasePack: WordsMontaFrasePack | null = null
let variosParesPack: WordsVariosParesPack | null = null

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

export function getWordsClasificaPack(): WordsClasificaPack {
  if (!clasificaPack) {
    assertValidWordsClasificaPack(clasificaJson)
    clasificaPack = clasificaJson as WordsClasificaPack
  }
  return clasificaPack
}

export function getWordsMontaFrasePack(): WordsMontaFrasePack {
  if (!montaFrasePack) {
    assertValidWordsMontaFrasePack(montaFraseJson)
    montaFrasePack = montaFraseJson as WordsMontaFrasePack
  }
  return montaFrasePack
}

export function getWordsVariosParesPack(): WordsVariosParesPack {
  if (!variosParesPack) {
    assertValidWordsVariosParesPack(variosParesJson)
    variosParesPack = variosParesJson as WordsVariosParesPack
  }
  return variosParesPack
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

export function listClasificaItems(): WordsClasificaItem[] {
  return getWordsClasificaPack().items.filter((i) => i.status !== 'deprecated')
}

export function listMontaFraseItems(): WordsMontaFraseItem[] {
  return getWordsMontaFrasePack().items.filter((i) => i.status !== 'deprecated')
}

export function listVariosParesItems(kind: WordsVariosKind): WordsVariosParItem[] {
  return getWordsVariosParesPack().items.filter(
    (i) => i.kind === kind && i.status !== 'deprecated',
  )
}
