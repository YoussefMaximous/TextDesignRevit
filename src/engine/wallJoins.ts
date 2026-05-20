import type { Point2D, ProjectModel, Wall } from './types'
import { distance } from './geometry'

const JOIN_TOL = 80

function endpointsMeet(a: Point2D, b: Point2D): boolean {
  return distance(a, b) < JOIN_TOL
}

export function getJoinedEndIndices(wall: Wall, model: ProjectModel): {
  startJoined: boolean
  endJoined: boolean
} {
  let startJoined = false
  let endJoined = false
  for (const other of model.walls) {
    if (other.id === wall.id) continue
    if (endpointsMeet(wall.start, other.start) || endpointsMeet(wall.start, other.end)) {
      startJoined = true
    }
    if (endpointsMeet(wall.end, other.start) || endpointsMeet(wall.end, other.end)) {
      endJoined = true
    }
  }
  return { startJoined, endJoined }
}

export function autoJoinWalls(model: ProjectModel, _newWall: Wall): ProjectModel {
  return model
}
