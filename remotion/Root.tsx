import { Composition } from "remotion";
import { MyComposition } from "./MyComposition";
import { VideoManifestSchema } from "../src/lib/types";
import { MOCK_MANIFEST } from "../src/lib/mock-data";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComposition"
        component={MyComposition}
        durationInFrames={MOCK_MANIFEST.durationInFrames}
        fps={MOCK_MANIFEST.fps}
        width={MOCK_MANIFEST.width}
        height={MOCK_MANIFEST.height}
        schema={VideoManifestSchema}
        defaultProps={MOCK_MANIFEST}
      />
      {/* Horizontal variant for desktop previews */}
      <Composition
        id="MyCompositionHorizontal"
        component={MyComposition}
        durationInFrames={MOCK_MANIFEST.durationInFrames}
        fps={MOCK_MANIFEST.fps}
        width={1920}
        height={1080}
        schema={VideoManifestSchema}
        defaultProps={{
          ...MOCK_MANIFEST,
          width: 1920,
          height: 1080,
        }}
      />
    </>
  );
};
