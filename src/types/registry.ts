/**
 * Metadata about a single behavior file
 */
export interface BehaviorFileMetadata {
  path: string;
}

/**
 * Metadata about a behavior in the registry
 */
export interface BehaviorMetadata {
  name: string;
  files: BehaviorFileMetadata[];
  dependencies?: string[];
}

/**
 * The complete behavior registry structure
 */
export type BehaviorRegistry = BehaviorMetadata[];
