'use client'

import { useEffect, useState } from 'react'

export default function PizzaAssistant() {
  const [vapi, setVapi] = useState(null)
  const [status, setStatus] = useState('Ready')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [isApiKeyValid, setIsApiKeyValid] = useState(true)
  const [questions, setQuestions] = useState([])

  const assistantOptions = {
    name: 'Survey Assistant',
    firstMessage:
      'Hello there, I am from Dflow customer service! Want me to kick off the quick survey?',
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en-US',
    },
    voice: {
      provider: 'playht',
      voiceId: 'jennifer',
    },
    model: {
      provider: 'openai',
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `
You are a witty, professional voice assistant guiding a user through a short onboarding or survey process.

Instructions:
- Ask **one** question at a time from the following list: ${questions.map((question) => question?.text).join(', ')}.
- Wait for a response before asking the next question.
- When you've gone through all of them, end with something casual like: "Sweet, that's all I got. You're awesome, talk soon!"

Tone:
- Keep it short, professional, and easygoing.
- Use conversational phrases like: “Alright,” “Sounds good,” “Let’s keep going,” etc.
- Avoid explaining or repeating unless the user asks.
- If the user goes off-topic, gently bring them back: “That’s interesting — let’s finish this first.”

Important:
- Ask only **one** question at a time.
- After asking, stop and wait for the user’s answer.
- Once the users answers, before going to next question just reply back someting with  a proper human touch based on the user's response
- After all the question do a quick summary and end the call
`,
        },
      ],
    },
  }

  // Initialize Vapi on client-side only
  useEffect(() => {
    const getQuestions = async () => {
      const res = await fetch('/api/questions')
      const questions = await res.json()

      setQuestions(questions.docs.reverse())
    }

    getQuestions()

    if (typeof window !== 'undefined') {
      import('@vapi-ai/web').then((module) => {
        const Vapi = module.default

        // Get API key from environment variables - only check once
        const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY || ''

        if (!apiKey) {
          setErrorMessage('API key is missing. Please check your environment variables.')
          setStatus('Error')
          setIsApiKeyValid(false)
          return
        }

        // Initialize Vapi
        const vapiInstance = new Vapi(apiKey)
        setVapi(vapiInstance)
        setIsApiKeyValid(true)

        // Set up event listeners
        vapiInstance.on('call-start', () => {
          setIsConnecting(false)
          setIsConnected(true)
          setErrorMessage('')
          setStatus('Connected')
        })

        vapiInstance.on('call-end', () => {
          setIsConnecting(false)
          setIsConnected(false)
          setStatus('Call ended')
        })

        vapiInstance.on('speech-start', () => {
          setIsSpeaking(true)
        })

        vapiInstance.on('speech-end', () => {
          setIsSpeaking(false)
        })

        vapiInstance.on('volume-level', (level) => {
          setVolumeLevel(level)
        })

        vapiInstance.on('error', (error) => {
          console.error('Vapi error:', error)
          setIsConnecting(false)

          // Handle different types of errors
          if (error?.error?.message?.includes('card details')) {
            setErrorMessage(
              'Payment required. Visit the Vapi dashboard to set up your payment method.',
            )
          } else if (error?.error?.statusCode === 401 || error?.error?.statusCode === 403) {
            // API key is invalid - update state
            setErrorMessage('API key is invalid. Please check your environment variables.')
            setIsApiKeyValid(false)
          } else {
            setErrorMessage(error?.error?.message || 'An error occurred')
          }

          setStatus('Error')
        })
      })
    }

    // Cleanup function
    return () => {
      if (vapi) {
        vapi.stop()
      }
    }
  }, [])

  // Start call function - no need to recheck API key
  const startCall = () => {
    if (!isApiKeyValid) {
      setErrorMessage('Cannot start call: API key is invalid or missing.')
      return
    }

    setIsConnecting(true)
    setStatus('Connecting...')
    setErrorMessage('')
    console.log(assistantOptions)

    if (questions.length > 0) {
      vapi.start(assistantOptions)
    }
  }

  // End call function
  const endCall = () => {
    if (vapi) {
      vapi.stop()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        color: 'white',
      }}
    >
      <h1 style={{ marginBottom: '30px' }}>dFlow Customer Survey</h1>

      <div style={{ marginBottom: '20px' }}>
        <p>Status: {status}</p>

        {isConnected && (
          <div style={{ marginTop: '10px' }}>
            <p>{isSpeaking ? 'Assistant is speaking' : 'Assistant is listening'}</p>

            {/* Simple volume indicator */}
            <div
              style={{
                display: 'flex',
                marginTop: '10px',
                marginBottom: '10px',
                gap: '3px',
              }}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: '15px',
                    height: '15px',
                    backgroundColor: i / 10 < volumeLevel ? '#3ef07c' : '#444',
                    borderRadius: '2px',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div
          style={{
            backgroundColor: '#f03e3e',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          <p>{errorMessage}</p>

          {errorMessage.includes('payment') && (
            <a
              href="https://dashboard.vapi.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '10px',
                color: 'white',
                textDecoration: 'underline',
              }}
            >
              Go to Vapi Dashboard
            </a>
          )}
        </div>
      )}

      <button
        onClick={isConnected ? endCall : startCall}
        disabled={isConnecting || !isApiKeyValid}
        style={{
          backgroundColor: isConnected ? '#f03e3e' : 'white',
          color: isConnected ? 'white' : 'black',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: isConnecting || !isApiKeyValid ? 'not-allowed' : 'pointer',
          opacity: isConnecting || !isApiKeyValid ? 0.7 : 1,
        }}
      >
        {isConnecting ? 'Connecting...' : isConnected ? 'End Call' : 'Call dFlow team'}
      </button>

      <a
        href="https://docs.vapi.ai"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          top: '25px',
          right: '25px',
          padding: '5px 10px',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        }}
      >
        return to docs
      </a>
    </div>
  )
}

// Pizza assistant configuration
