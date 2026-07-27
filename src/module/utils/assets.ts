import type {
  NitroConfig as LegacyNitroConfig,
  ServerAssetDir as LegacyServerAssetDir,
} from "nitropack/types";
import type { NitroConfig, ServerAssetDir } from "nitro/types";
import { consola } from "consola";

export function updateServerAssets(
  config: NitroConfig | LegacyNitroConfig,
  assets: readonly (ServerAssetDir | LegacyServerAssetDir)[],
) {
  consola.withTag("updateServerAssets").debug(assets);
  config.serverAssets ||= [];
  config.serverAssets = config.serverAssets
    .filter((_assets) => {
      const baseName = _assets?.baseName;
      if (!baseName) {
        return true;
      }
      return assets.some((assets) => baseName == assets.baseName);
    })
    .concat(assets);
}
