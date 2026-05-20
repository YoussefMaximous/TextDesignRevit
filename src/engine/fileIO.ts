import type { ProjectModel, ViewAnnotation } from './types'
import { createDefaultProject } from '../store/defaults'
import { createLandingViewAnnotations } from './datumGeometry'
import { revitAnnotationCrop } from './revitLandingLayout'

export interface TdxFile {
  version: string
  project: ProjectModel
}

const VERSION = '1.0'

export function serializeProject(model: ProjectModel): string {
  const file: TdxFile = { version: VERSION, project: model }
  return JSON.stringify(file, null, 2)
}

export function parseProject(json: string): ProjectModel {
  const data = JSON.parse(json) as TdxFile | ProjectModel
  if ('project' in data && data.project) {
    return validateModel(data.project)
  }
  return validateModel(data as ProjectModel)
}

function migrateViewAnnotations(model: ProjectModel): ViewAnnotation[] {
  if (model.viewAnnotations?.length) return model.viewAnnotations
  const def = createDefaultProject()
  const fp = model.views?.find((v) => v.type === 'floor-plan') ?? def.views[0]
  if (!fp) return def.viewAnnotations
  const scale = fp.scale ?? 100
  const anns = createLandingViewAnnotations(fp.id, scale)
  if (fp.northArrowPosition) {
    const north = anns.find((a) => a.kind === 'north-arrow')
    if (north) north.position = fp.northArrowPosition
  }
  return anns
}

function validateModel(model: ProjectModel): ProjectModel {
  const views = (model.views ?? createDefaultProject().views).map((v) => {
    if (v.type === 'floor-plan' && v.cropRegion && !v.annotationCropRegion) {
      return { ...v, annotationCropRegion: revitAnnotationCrop(v.cropRegion) }
    }
    return v
  })
  return {
    ...createDefaultProject(),
    ...model,
    views,
    walls: model.walls ?? [],
    doors: model.doors ?? [],
    windows: model.windows ?? [],
    rooms: model.rooms ?? [],
    grids: model.grids ?? [],
    levels: model.levels ?? createDefaultProject().levels,
    wallTypes: model.wallTypes ?? createDefaultProject().wallTypes,
    doorTypes: model.doorTypes ?? createDefaultProject().doorTypes,
    windowTypes: model.windowTypes ?? createDefaultProject().windowTypes,
    columns: model.columns ?? [],
    floors: model.floors ?? [],
    stairs: model.stairs ?? [],
    referencePlanes: model.referencePlanes ?? [],
    scopeBoxes: model.scopeBoxes ?? createDefaultProject().scopeBoxes,
    elevationMarkers: model.elevationMarkers ?? createDefaultProject().elevationMarkers,
    workingSections: model.workingSections ?? createDefaultProject().workingSections,
    viewAnnotations: migrateViewAnnotations(model),
    dimensions: model.dimensions ?? [],
    textNotes: model.textNotes ?? [],
  }
}

export function downloadTdx(model: ProjectModel, filename: string): void {
  const blob = new Blob([serializeProject(model)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.tdx') ? filename : `${filename}.tdx`
  a.click()
  URL.revokeObjectURL(url)
}

export async function openTdxFile(): Promise<ProjectModel | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.tdx,.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      try {
        const text = await file.text()
        resolve(parseProject(text))
      } catch {
        resolve(null)
      }
    }
    input.click()
  })
}
