import { CollectionConfig } from 'payload'

const Questions: CollectionConfig = {
  slug: 'questions',
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
  ],
  admin: {
    useAsTitle: 'text',
  },
  access: {
    read: () => true,
  },
}

export default Questions
