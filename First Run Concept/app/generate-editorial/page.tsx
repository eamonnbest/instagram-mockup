"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

interface EditorialImage {
  id: string
  name: string
  category: "hero" | "category" | "journal" | "about" | "material" | "process"
  prompt: string
  fileName: string
  imageUrl?: string
  journalId?: string
}

const editorialImages: EditorialImage[] = [
  {
    id: "hero-main",
    name: "Hero — Studio Shot",
    category: "hero",
    prompt:
      "Technical athletic garments laid flat on concrete surface, overhead view, harsh directional studio lighting, deep shadows, raw material documentation style, neutral gray tones, no props, no decoration, industrial aesthetic, high contrast, product photography for engineering specification sheet",
    fileName: "hero-studio.jpg",
  },
  {
    id: "hero-process",
    name: "Hero — Pattern Table",
    category: "hero",
    prompt:
      "Garment pattern pieces laid out on industrial cutting table, technical drawing style, overhead view, flat lay, rulers and measurement tools visible, harsh fluorescent lighting, engineering documentation aesthetic, neutral tones, no people, factory workshop atmosphere",
    fileName: "hero-pattern.jpg",
  },

  {
    id: "category-tennis",
    name: "Category — Tennis",
    category: "category",
    prompt:
      "Empty tennis court at dawn, no people, minimal composition, single ball on baseline, hard court surface texture detail, clinical aesthetic, muted colors, architectural photography style, clean geometric lines, documentation of space not lifestyle",
    fileName: "category-tennis.jpg",
  },
  {
    id: "category-running",
    name: "Category — Running",
    category: "category",
    prompt:
      "Running track surface close-up, overhead view, lane markings as geometric pattern, no people, worn texture detail, clinical documentation style, muted red and gray tones, abstract composition, material study aesthetic",
    fileName: "category-running.jpg",
  },
  {
    id: "category-golf",
    name: "Category — Golf",
    category: "category",
    prompt:
      "Golf green close-up, grass texture detail, single flag pole shadow, no people, early morning dew, clinical landscape photography, muted green tones, minimal composition, topographic aesthetic, documentation not lifestyle",
    fileName: "category-golf.jpg",
  },

  {
    id: "about-founders",
    name: "About — Workshop",
    category: "about",
    prompt:
      "Small garment workshop interior, industrial sewing machines, fabric rolls on metal shelving, harsh overhead lighting, concrete floor, no people, documentary style, honest working space not styled showroom, London industrial unit aesthetic",
    fileName: "about-workshop.jpg",
  },
  {
    id: "about-materials",
    name: "About — Fabric Archive",
    category: "about",
    prompt:
      "Technical fabric swatches pinned to corkboard, handwritten labels, material testing notes visible, harsh directional light, shadow detail, documentation aesthetic, engineering mood board, honest development process not polished presentation",
    fileName: "about-fabric-archive.jpg",
  },

  {
    id: "process-cutting",
    name: "Process — Pattern Cutting",
    category: "process",
    prompt:
      "Garment pattern being cut from technical fabric, hands with industrial scissors, cutting mat with measurement grid, overhead view, documentary photography style, focus on craft process, no faces, honest workshop lighting",
    fileName: "process-cutting.jpg",
  },
  {
    id: "process-sewing",
    name: "Process — Construction",
    category: "process",
    prompt:
      "Industrial sewing machine stitching technical fabric seam, close-up detail of needle and presser foot, thread tension visible, documentary style, harsh task lighting, focus on mechanical precision, no decoration",
    fileName: "process-sewing.jpg",
  },
  {
    id: "process-testing",
    name: "Process — Material Testing",
    category: "process",
    prompt:
      "Fabric stretch test being performed, hands pulling technical textile sample, measurement ruler in frame, laboratory aesthetic, clinical documentation, harsh overhead lighting, testing methodology visible",
    fileName: "process-testing.jpg",
  },

  {
    id: "material-knit",
    name: "Material — Performance Knit",
    category: "material",
    prompt:
      "Extreme macro of performance knit textile, showing yarn construction and weave pattern, technical fabric photography, neutral lighting, material science aesthetic, loop structure visible, no styling, pure documentation",
    fileName: "material-knit.jpg",
  },
  {
    id: "material-woven",
    name: "Material — Stretch Woven",
    category: "material",
    prompt:
      "Macro photography of stretch woven nylon fabric, showing weave structure and fiber detail, clinical lighting, textile engineering documentation style, cross-section suggestion, material science aesthetic",
    fileName: "material-woven.jpg",
  },

  {
    id: "journal-threshold",
    name: "Journal — Why Made to Order",
    category: "journal",
    prompt:
      "Stack of fabric cut pieces ready for assembly, bundled with paper production ticket, industrial aesthetic, workshop documentation, honest process photography, no styling, waiting for threshold",
    fileName: "journal-threshold.jpg",
  },
  {
    id: "journal-suppliers",
    name: "Journal — Our Suppliers",
    category: "journal",
    prompt:
      "Fabric roll end with manufacturer label visible, showing origin and composition data, documentary close-up, industrial warehouse setting, supply chain honesty, no decoration, Toray or Italian mill aesthetic",
    fileName: "journal-suppliers.jpg",
  },
]

export default function GenerateEditorialPage() {
  const [images, setImages] = useState<EditorialImage[]>(editorialImages)
  const [generatedUrls, setGeneratedUrls] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState<Record<string, boolean>>({})
  const [editingPrompt, setEditingPrompt] = useState<Record<string, string>>({})
  const [showPromptEditor, setShowPromptEditor] = useState<Record<string, boolean>>({})
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`])
  }

  const generateImage = async (image: EditorialImage) => {
    setGenerating((prev) => ({ ...prev, [image.id]: true }))
    addLog(`Generating ${image.name}...`)

    try {
      const prompt = editingPrompt[image.id] || image.prompt
      const response = await fetch("/api/generate-editorial-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          fileName: image.fileName,
          category: image.category,
          updateJournalId: image.journalId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedUrls((prev) => ({ ...prev, [image.id]: data.imageUrl }))
        addLog(`Success! ${image.name}`)
      } else {
        addLog(`Error: ${data.error}`)
      }
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setGenerating((prev) => ({ ...prev, [image.id]: false }))
    }
  }

  const generateAll = async () => {
    addLog("Starting batch generation...")
    for (const image of images) {
      if (!generatedUrls[image.id]) {
        await generateImage(image)
      }
    }
    addLog("Batch complete.")
  }

  const groupedImages = images.reduce(
    (acc, img) => {
      if (!acc[img.category]) acc[img.category] = []
      acc[img.category].push(img)
      return acc
    },
    {} as Record<string, EditorialImage[]>,
  )

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Generate Editorial Images</h1>
            <p className="text-[#6B6B6B] text-sm mt-1">Engineering documentation aesthetic. No lifestyle.</p>
          </div>
          <Link href="/" className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]">
            ← Back
          </Link>
        </div>

        <button
          onClick={generateAll}
          className="w-full bg-[#1A1A1A] text-white py-4 text-sm tracking-wide mb-8 hover:bg-[#2A2A2A] transition-colors"
        >
          GENERATE ALL MISSING
        </button>

        {logs.length > 0 && (
          <div className="bg-[#F0F0EE] p-4 mb-8 font-mono text-xs max-h-48 overflow-y-auto border border-[#E0E0DE]">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}

        {Object.entries(groupedImages).map(([category, imgs]) => (
          <div key={category} className="mb-12">
            <h2 className="text-xs font-medium uppercase tracking-widest mb-6 text-[#6B6B6B]">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {imgs.map((image) => (
                <div key={image.id} className="border border-[#E0E0DE] p-4 bg-white">
                  <div className="aspect-video bg-[#F5F5F3] mb-4 overflow-hidden">
                    {generatedUrls[image.id] ? (
                      <Image
                        src={generatedUrls[image.id] || "/placeholder.svg"}
                        alt={image.name}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#9B9B9B] text-xs font-mono">
                        NOT GENERATED
                      </div>
                    )}
                  </div>

                  <h3 className="font-medium text-sm mb-2">{image.name}</h3>

                  <button
                    onClick={() => setShowPromptEditor((prev) => ({ ...prev, [image.id]: !prev[image.id] }))}
                    className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] mb-2 underline"
                  >
                    {showPromptEditor[image.id] ? "hide prompt" : "edit prompt"}
                  </button>

                  {showPromptEditor[image.id] && (
                    <textarea
                      value={editingPrompt[image.id] ?? image.prompt}
                      onChange={(e) => setEditingPrompt((prev) => ({ ...prev, [image.id]: e.target.value }))}
                      className="w-full bg-[#F5F5F3] border border-[#E0E0DE] p-2 text-xs mb-2 min-h-[80px] font-mono"
                    />
                  )}

                  <button
                    onClick={() => generateImage(image)}
                    disabled={generating[image.id]}
                    className="w-full bg-[#1A1A1A] text-white py-2 text-xs tracking-wide hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
                  >
                    {generating[image.id] ? "GENERATING..." : generatedUrls[image.id] ? "REGENERATE" : "GENERATE"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
