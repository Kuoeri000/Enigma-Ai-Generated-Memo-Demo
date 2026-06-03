import { useState } from 'react'
import './App.css'

const INITIAL_FORM = {
  companyName: '',
  estimatedRevenue: '',
  numberOfEmployees: '',
  foundedYear: '',
  industry: '',
  naicsCode: '',
  location: '',
  businessStatus: '',
}

const SAMPLE_DATA = {
  companyName: 'Meridian Precision Manufacturing LLC',
  estimatedRevenue: '$12.4M',
  numberOfEmployees: '87',
  foundedYear: '2008',
  industry: 'Industrial Machinery & Equipment',
  naicsCode: '333249',
  location: 'Austin, TX',
  businessStatus: 'Active',
}

const BUSINESS_STATUS_OPTIONS = [
  'Active',
  'Inactive',
  'Startup',
  'Growing',
  'Stable',
  'Declining',
  'Restructuring',
]

function App() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [generatedBrief, setGeneratedBrief] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const loadSampleData = () => {
    setForm(SAMPLE_DATA)
  }

  const generateBrief = async () => {
    if (!form.companyName.trim()) {
      setGeneratedBrief('Please enter a company name before generating a brief.')
      return
    }

    setIsGenerating(true)
    setGeneratedBrief('')

    try {
      const response = await fetch('/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate brief.')
      }

      setGeneratedBrief(data.brief)
    } catch (err) {
      setGeneratedBrief(
        err.message || 'Something went wrong while generating the brief.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const canExportMemo =
    Boolean(generatedBrief) &&
    !isGenerating &&
    !generatedBrief.startsWith('Please enter a company name')

  const exportMemo = () => {
    if (!canExportMemo) return

    const date = new Date().toISOString().slice(0, 10)
    const slug =
      form.companyName
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 60) || 'business-brief'

    const content = [
      'BUSINESS INTELLIGENCE MEMO',
      `Generated: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      `Company: ${form.companyName}`,
      form.industry ? `Industry: ${form.industry}` : null,
      form.location ? `Location: ${form.location}` : null,
      '',
      '─'.repeat(48),
      '',
      generatedBrief,
    ]
      .filter(Boolean)
      .join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${slug}-memo-${date}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__badge">Enigma</div>
        <h1>AI Business Brief Generator</h1>
        <p className="app-header__subtitle">
          Enter company details below to generate a professional business intelligence
          memo.
        </p>
      </header>

      <form
        className="brief-form"
        onSubmit={(e) => {
          e.preventDefault()
          generateBrief()
        }}
      >
        <div className="brief-form__grid">
          <div className="form-field form-field--full">
            <label htmlFor="companyName">Company Name</label>
            <input
              id="companyName"
              type="text"
              value={form.companyName}
              onChange={handleChange('companyName')}
              placeholder="e.g. Meridian Precision Manufacturing LLC"
            />
          </div>

          <div className="form-field">
            <label htmlFor="estimatedRevenue">Estimated Revenue</label>
            <input
              id="estimatedRevenue"
              type="text"
              value={form.estimatedRevenue}
              onChange={handleChange('estimatedRevenue')}
              placeholder="e.g. $12.4M"
            />
          </div>

          <div className="form-field">
            <label htmlFor="numberOfEmployees">Number of Employees</label>
            <input
              id="numberOfEmployees"
              type="text"
              inputMode="numeric"
              value={form.numberOfEmployees}
              onChange={handleChange('numberOfEmployees')}
              placeholder="e.g. 87"
            />
          </div>

          <div className="form-field">
            <label htmlFor="foundedYear">Founded Year</label>
            <input
              id="foundedYear"
              type="text"
              inputMode="numeric"
              value={form.foundedYear}
              onChange={handleChange('foundedYear')}
              placeholder="e.g. 2008"
            />
          </div>

          <div className="form-field">
            <label htmlFor="industry">Industry</label>
            <input
              id="industry"
              type="text"
              value={form.industry}
              onChange={handleChange('industry')}
              placeholder="e.g. Industrial Machinery & Equipment"
            />
          </div>

          <div className="form-field">
            <label htmlFor="naicsCode">NAICS Code</label>
            <input
              id="naicsCode"
              type="text"
              value={form.naicsCode}
              onChange={handleChange('naicsCode')}
              placeholder="e.g. 333249"
            />
          </div>

          <div className="form-field">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              value={form.location}
              onChange={handleChange('location')}
              placeholder="e.g. Austin, TX"
            />
          </div>

          <div className="form-field">
            <label htmlFor="businessStatus">Business Status</label>
            <select
              id="businessStatus"
              value={form.businessStatus}
              onChange={handleChange('businessStatus')}
            >
              <option value="">Select status…</option>
              {BUSINESS_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="brief-form__actions">
          <button type="button" className="btn btn--secondary" onClick={loadSampleData}>
            Load Sample Data
          </button>
          <button type="submit" className="btn btn--primary" disabled={isGenerating}>
            {isGenerating ? 'Generating…' : 'Generate Brief'}
          </button>
        </div>
      </form>

      <section className="brief-output" aria-live="polite">
        <div className="brief-output__header">
          <h2>Generated Brief</h2>
          <div className="brief-output__header-actions">
            {generatedBrief && !isGenerating && (
              <span className="brief-output__status">Ready</span>
            )}
            <button
              type="button"
              className="btn btn--secondary btn--export"
              onClick={exportMemo}
              disabled={!canExportMemo}
            >
              Export / Save Memo
            </button>
          </div>
        </div>
        <div className={`brief-output__content ${isGenerating ? 'brief-output__content--loading' : ''}`}>
          {isGenerating ? (
            <p className="brief-output__placeholder">Generating your business brief…</p>
          ) : generatedBrief ? (
            <pre className="brief-output__text">{generatedBrief}</pre>
          ) : (
            <p className="brief-output__placeholder">
              Your AI-generated business brief will appear here. Fill in the form above
              and click <strong>Generate Brief</strong>.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

export default App
