export declare const SERVE_ORIGIN: string;

export type ExtensionPlatform = 'chrome' | 'edge' | 'firefox';

export interface AdOptions {
  /** Placement tag key (tk_…). */
  tag: string;
  /** Fixed slot size "WxH", e.g. "300x250". Omit to fill the container and auto-size to the creative. */
  size?: string;
  /** Personalized ads; only with the user's consent. Default false (contextual, no identifier). */
  personalized?: boolean;
  /** Defaults to (browser|chrome).runtime.id. */
  extensionId?: string;
  /** Defaults to detectPlatform(). */
  platform?: ExtensionPlatform;
  /** Override the serving origin (staging / tests). */
  origin?: string;
  onFill?: (ad: { format: string; width: number; height: number }) => void;
  onNoFill?: () => void;
}

export declare function detectPlatform(ua?: string): ExtensionPlatform;
export declare function frameUrl(o: AdOptions): string;
export declare function mountAd(el: HTMLElement, o: AdOptions): { destroy(): void };
