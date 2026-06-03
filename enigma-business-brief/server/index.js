import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import cors from 'cors'
import express from 'express'
import OpenAI from 'openai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')
dotenv.config({ path: envPath })

const app = express()
const PORT = process.env.PORT || 3001

const SYSTEM_PROMPT = `You are an analyst assistant helping financial services teams interpret structured business attributes.

Given the company data below, generate a concise business brief with:

1. Executive Summary
2. Key Business Signals
3. Potential Concerns
4. Suggested Follow-Up Questions
5. Analyst Notes

Do not invent facts. If information is missing, say it is unavailable.
Keep the tone professional and decision-oriented.`

const FIELD_LABELS = {
  companyName: 'Company Name',
  estimatedRevenue: 'Estimated Revenue',
  numberOfEmployees: 'Number of Employees',
  foundedYear: 'Founded Year',
  industry: 'Industry',
  naicsCode: 'NAICS Code',
  location: 'Location',
  businessStatus: 'Business Status',
}

function formatCompanyData(form) {
  return Object.entries(FIELD_LABELS)
    .map(([key, label]) => {
      const value = form[key]?.toString().trim()
      return `${label}: ${value || 'Unavailable'}`
    })
    .join('\n')
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

app.use(cors())
app.use(express.json())

app.post('/generate-brief', async (req, res) => {
  const form = req.body

  if (!form?.companyName?.trim()) {
    return res.status(400).json({ error: 'Company name is required.' })
  }

  const openai = getOpenAIClient()
  if (!openai) {
    return res.status(503).json({
      error: 'OpenAI API key is not configured. Set OPENAI_API_KEY in enigma-business-brief/.env',
    })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Company data:\n\n${formatCompanyData(form)}`,
        },
      ],
    })

    const brief = completion.choices[0]?.message?.content?.trim()

    if (!brief) {
      return res.status(502).json({ error: 'No brief was returned from the model.' })
    }

    res.json({ brief })
  } catch (err) {
    console.error('generate-brief error:', err)
    res.status(500).json({
      error: err.message || 'Failed to generate business brief.',
    })
  }
})

app.listen(PORT, () => {
  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim())
  console.log(`API server listening on http://localhost:${PORT}`)
  console.log(
    hasKey
      ? 'OpenAI API key loaded.'
      : `Warning: OPENAI_API_KEY missing. Add it to ${envPath}`,
  )
})
