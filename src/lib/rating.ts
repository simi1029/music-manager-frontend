export const SCALE = [0,1,2,3,4,5,7,10] as const
export type ScaleValue = typeof SCALE[number]
export const LABEL: Record<ScaleValue, string> = {
  0:'Poor',1:'Fair',2:'Quite good',3:'Good',4:'More than good',5:'Very good',7:'Excellent',10:'Masterpiece'
}
export function quantizeRank(mean: number): ScaleValue {
  // separate declarations so the type annotation applies only to `best`
  let best: ScaleValue = SCALE[0] as ScaleValue
  let bestDiff = Infinity
  for (const s of SCALE) {
    const d = Math.abs(mean - s)
    if (d < bestDiff || (d === bestDiff && s > best)) {
      best = s as ScaleValue
      bestDiff = d
    }
  }
  return best
}
