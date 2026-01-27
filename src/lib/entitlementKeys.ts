export const featureKeys = ['ai_detection', 'export'] as const
export type FeatureKey = typeof featureKeys[number]

export const limitKeys = ['ai_detection_per_month'] as const
export type LimitKey = typeof limitKeys[number]
