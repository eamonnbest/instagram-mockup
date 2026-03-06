"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

const STYLE_PRESETS = [
  {
    id: "condensed",
    name: "Condensed Bold",
    prompt: `Professional logo design, the exact text "FIRST RUN" spelled F-I-R-S-T space R-U-N, bold condensed black sans-serif typography like Bebas Neue, all uppercase, tight letter spacing, pure white background, high contrast black text, centered, vector style, clean sharp edges, no icons no symbols no decoration, minimalist brand identity, 4k crisp`,
  },
  {
    id: "modern",
    name: "Modern Sans",
    prompt: `Professional logo design, the exact text "FIRST RUN" spelled F-I-R-S-T space R-U-N, modern geometric sans-serif typography like Futura Bold, all uppercase, medium weight, pure white background, high contrast black text, centered, clean vector style, no icons no symbols, sophisticated minimal brand, sharp crisp 4k`,
  },
  {
    id: "athletic",
    name: "Athletic Block",
    prompt: `Professional logo design, the exact text "FIRST RUN" spelled F-I-R-S-T space R-U-N, bold athletic block letters, sporty uppercase sans-serif, slight italic angle, pure white background, high contrast black text, centered, sports brand aesthetic, vector style, no icons no graphics, sharp 4k`,
  },
  {
    id: "stacked",
    name: "Stacked",
    prompt: `Professional logo design, two words stacked vertically: "FIRST" on top line and "RUN" on bottom line, spelled F-I-R-S-T and R-U-N, bold condensed black sans-serif, tight vertical spacing, pure white background, high contrast, centered square composition, vector style, no icons, minimalist 4k`,
  },
  {
    id: "mono",
    name: "Mono Technical",
    prompt: `Professional logo design, the exact text "FIRST RUN" spelled F-I-R-S-T space R-U-N, monospace technical font like IBM Plex Mono Bold, all uppercase, pure white background, high contrast black text, centered, engineering precision aesthetic, vector clean, no icons, sharp 4k`,
  },
  {
    id: "custom",
    name: "Custom",
    prompt: ``,
  },
]

export default function GenerateLogoPage() {
  const [loading, setLoading] = useState(false)
  const [generatingStyle, setGeneratingStyle] = useState<string | null>(null)
  const [logos, setLogos] = useState<Array<{ url: string; savedUrl: string; style: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState(STYLE_PRESETS[0])
  const [customPrompt, setCustomPrompt] = useState("")
  const [presetPrompts, setPresetPrompts] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        const loadedPrompts: Record<string, string> = {}
        STYLE_PRESETS.forEach((preset) => {
          const savedKey = `logo_prompt_${preset.id}`
          if (data[savedKey]) {
            loadedPrompts[preset.id] = data[savedKey]
          }
        })
        if (Object.keys(loadedPrompts).length > 0) {
          setPresetPrompts(loadedPrompts)
        }
        if (data.logo_custom_prompt) {
          setCustomPrompt(data.logo_custom_prompt)
        }
      })
      .catch(() => {})
  }, [])

  const getPromptForPreset = (preset: (typeof STYLE_PRESETS)[0]) => {
    if (preset.id === "custom") return customPrompt
    return presetPrompts[preset.id] || preset.prompt
  }

  const generateLogo = async (style: (typeof STYLE_PRESETS)[0]) => {
    setLoading(true)
    setGeneratingStyle(style.name)
    setError(null)

    const prompt = getPromptForPreset(style)

    if (!prompt) {
      setError("Please enter a custom prompt")
      setLoading(false)
      setGeneratingStyle(null)
      return
    }

    try {
      // Save the prompt
      const settingKey = style.id === "custom" ? "logo_custom_prompt" : `logo_prompt_${style.id}`
      await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value: prompt }),
      })

      // Generate the logo
      const response = await fetch("/api/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else if (data.imageUrl) {
        setLogos((prev) => [
          { url: data.tempUrl || data.imageUrl, savedUrl: data.imageUrl, style: style.name },
          ...prev,
        ])
      } else {
        setError("No image returned from API")
      }
    } catch (err) {
      setError("Failed to generate logo")
      console.error(err)
    } finally {
      setLoading(false)
      setGeneratingStyle(null)
    }
  }

  const generateAll = async () => {
    setLoading(true)
    for (const preset of STYLE_PRESETS.filter((p) => p.id !== "custom")) {
      setGeneratingStyle(preset.name)
      await generateLogo(preset)
    }
    setLoading(false)
    setGeneratingStyle(null)
  }

  const setAsLogo = async (savedUrl: string) => {
    try {
      const response = await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "logo_url", value: savedUrl }),
      })

      if (response.ok) {
        alert("Logo saved! Refresh the site to see it.")
      }
    } catch (err) {
      setError("Failed to save logo setting")
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-8 border-b border-neutral-200">
          <div>
            <h1 className="text-xl font-medium tracking-tight">Logo Generator</h1>
            <p className="text-sm text-neutral-500 mt-1">Generate FIRST RUN logo images with AI</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/generate-products" className="text-sm text-neutral-500 hover:text-neutral-900">
              Products
            </Link>
            <Link href="/generate-hero" className="text-sm text-neutral-500 hover:text-neutral-900">
              Hero
            </Link>
            <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
              ← Back
            </Link>
          </div>
        </div>

        {/* Style presets */}
        <div className="mb-8">
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-4">Style Presets</p>
          <div className="flex flex-wrap gap-2">
            {STYLE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setSelectedPreset(preset)}
                className={`px-4 py-2 text-sm border transition-colors ${
                  selectedPreset.name === preset.name
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt editor */}
        <div className="mb-8">
          <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2 block">
            {selectedPreset.id === "custom" ? "Custom Prompt" : `${selectedPreset.name} Prompt (editable)`}
          </label>
          <textarea
            value={
              selectedPreset.id === "custom" ? customPrompt : presetPrompts[selectedPreset.id] || selectedPreset.prompt
            }
            onChange={(e) => {
              if (selectedPreset.id === "custom") {
                setCustomPrompt(e.target.value)
              } else {
                setPresetPrompts((prev) => ({ ...prev, [selectedPreset.id]: e.target.value }))
              }
            }}
            placeholder='Enter prompt... (include "FIRST RUN" in your prompt)'
            className="w-full h-24 p-4 text-sm border border-neutral-200 bg-white resize-none focus:outline-none focus:border-neutral-400 font-mono"
          />
          {selectedPreset.id !== "custom" && presetPrompts[selectedPreset.id] && (
            <button
              onClick={() => {
                setPresetPrompts((prev) => {
                  const newPrompts = { ...prev }
                  delete newPrompts[selectedPreset.id]
                  return newPrompts
                })
              }}
              className="mt-2 text-xs text-neutral-500 hover:text-neutral-900"
            >
              Reset to default
            </button>
          )}
        </div>

        {/* Generate buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => generateLogo(selectedPreset)}
            disabled={loading}
            className="bg-neutral-900 text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading && generatingStyle === selectedPreset.name
              ? `Generating ${selectedPreset.name}...`
              : `Generate ${selectedPreset.name}`}
          </button>
          <button
            onClick={generateAll}
            disabled={loading}
            className="border border-neutral-200 px-6 py-3 text-sm font-medium hover:bg-neutral-100 disabled:opacity-50"
          >
            {loading && generatingStyle ? `Generating ${generatingStyle}...` : "Generate All Presets"}
          </button>
        </div>

        {/* Error display */}
        {error && <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        {/* Loading indicator */}
        {loading && (
          <div className="mb-8 p-4 bg-neutral-100 border border-neutral-200 text-neutral-600 text-sm">
            Generating {generatingStyle} logo... This may take 10-20 seconds.
          </div>
        )}

        {/* Generated logos grid */}
        <div>
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-4">
            Generated Logos {logos.length > 0 && `(${logos.length})`}
          </p>

          {logos.length === 0 && !loading && (
            <div className="border border-dashed border-neutral-300 p-12 text-center text-neutral-400 text-sm">
              No logos generated yet. Select a style and click generate.
            </div>
          )}

          {logos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logos.map((logo, i) => (
                <div key={i} className="border border-neutral-200 bg-white">
                  <div className="p-2 border-b border-neutral-100 bg-neutral-50">
                    <span className="text-xs font-medium">{logo.style}</span>
                  </div>
                  <div className="p-8 flex items-center justify-center bg-white min-h-[200px]">
                    <Image
                      src={logo.url || "/placeholder.svg"}
                      alt={`FIRST RUN logo - ${logo.style}`}
                      width={400}
                      height={150}
                      className="max-w-full h-auto"
                      unoptimized
                    />
                  </div>
                  <div className="p-3 border-t border-neutral-100 flex gap-2">
                    <button
                      onClick={() => setAsLogo(logo.savedUrl)}
                      className="flex-1 bg-neutral-900 text-white py-2 text-xs font-medium hover:bg-neutral-800"
                    >
                      Use as Site Logo
                    </button>
                    <a
                      href={logo.savedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-neutral-200 text-xs hover:bg-neutral-50"
                    >
                      Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
