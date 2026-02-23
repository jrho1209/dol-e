import { type SchemaTypeDefinition } from 'sanity'
import { place } from '../../../sanity/schemas/place'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [place as SchemaTypeDefinition],
}
