const extractAnswers = (conversations: any, questionsArray: any) => {
  function extractQAPairs(conversation) {
    const qaPairs = []

    for (let i = 0; i < conversation.length - 1; i++) {
      const current = conversation[i]
      const next = conversation[i + 1]

      // Look for assistant asking a question followed by user response
      if (current.role === 'assistant' && next.role === 'user') {
        // Skip initial greeting/confirmation exchanges
        if (
          current.content.toLowerCase().includes('survey') ||
          current.content.toLowerCase().includes('kick off') ||
          (next.content.toLowerCase().includes('yes') &&
            next.content.toLowerCase().includes('please'))
        ) {
          continue
        }

        qaPairs.push({
          question: current.content,
          answer: next.content,
        })
      }
    }

    return qaPairs
  }

  // Function to clean and normalize text for comparison
  function normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
  }

  // Function to calculate similarity between two strings
  function calculateSimilarity(str1, str2) {
    const norm1 = normalizeText(str1)
    const norm2 = normalizeText(str2)

    // Check for key words match
    const words1 = norm1.split(' ')
    const words2 = norm2.split(' ')

    let matchingWords = 0
    for (const word of words1) {
      if (words2.includes(word) && word.length > 2) {
        // Ignore short words
        matchingWords++
      }
    }

    // Calculate similarity score
    const totalWords = Math.min(words1.length, words2.length)
    return matchingWords / totalWords
  }

  // Function to find best matching question
  function findBestMatch(conversationQuestion, targetQuestions) {
    let bestMatch = null
    let bestScore = 0

    for (const targetQ of targetQuestions) {
      const score = calculateSimilarity(conversationQuestion, targetQ.text)
      if (score > bestScore) {
        bestScore = score
        bestMatch = targetQ
      }
    }

    // Return match only if similarity is above threshold
    return bestScore > 0.3 ? bestMatch : null
  }

  // Main function to process and match questions
  function matchQuestionsWithAnswers() {
    // Extract Q&A pairs from conversation
    const qaPairs = extractQAPairs(conversations)

    console.log('Extracted Q&A pairs:')
    console.log(qaPairs)

    // Create a copy of questionsArray to add answers
    const questionsWithAnswers = questionsArray.map((q) => ({ ...q, answer: null }))

    // Match each conversation question with target questions
    for (const qa of qaPairs) {
      const match = findBestMatch(qa.question, questionsArray)

      if (match) {
        const index = questionsWithAnswers.findIndex((q) => q.id === match.id)
        if (index !== -1) {
          questionsWithAnswers[index].answer = qa.answer
        }
      }
    }

    return questionsWithAnswers
  }

  // Execute the matching process
  const result = matchQuestionsWithAnswers()

  // Create final JSON output with questionId, question, and answer
  const finalOutput = result.map((item) => ({
    questionId: item.id,
    question: item.text,
    answer: item.answer || null,
  }))

  return finalOutput
}
