/**
 * Configuration file structure for behavior.config.json
 * 
 * Following the Single Source of Truth principle:
 * - Uses PackageName type from validators registry (no manual duplication)
 * - Uses PackageManager type from detect utility (derived from data)
 */

import type { PackageName } from "../validators/index";
import type { PackageManager } from "../utils/detect";

/**
 * Configuration stored in behavior.config.json
 */
export interface InitConfig {
  /** Selected validator */
  validator: PackageName;
  /** TypeScript mode */
  typescript: boolean;
  /** Behaviors installation path */
  behaviorsPath: string;
  /** Detected/selected package manager */
  packageManager: PackageManager;
}
