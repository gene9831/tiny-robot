import type { ExtensionCardInstallAction, ExtensionCardPrimaryAction, ExtensionOperationStatus } from './index.type'

export type ExtensionCardPopoverPlacement = 'bottom-end' | 'top-end'

/**
 * Runtime-only action projection supplied by ExtensionList.
 * Operation state remains owned by ExtensionManagerRoot and is deliberately
 * excluded from the public Card action configuration.
 */
export type ExtensionCardRenderAction =
  | ExtensionCardPrimaryAction
  | (ExtensionCardInstallAction & {
      state?: ExtensionOperationStatus['status']
      progress?: number
    })
