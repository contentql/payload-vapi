import { CollectionConfig } from 'payload'

const Responses: CollectionConfig = {
  slug: 'responses',
  fields: [
    {
      name: 'question',
      type: 'relationship',
      relationTo: 'questions',
      required: true,
    },
    {
      name: 'answer',
      type: 'text',
    },
    {
      name: 'sessionId',
      type: 'text',
    },
  ],
}

export default Responses
