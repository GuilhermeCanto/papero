"use client";

import { MeshGradient } from "@paper-design/shaders-react";

export function PaperoAuthShader() {
  return (
    <div className="pointer-events-none absolute inset-0 h-full min-h-full overflow-hidden [&>*]:absolute [&>*]:inset-0 [&>*]:h-full [&>*]:min-h-full [&>*]:w-full">
      <MeshGradient
        className="absolute inset-0 h-full w-full"
        colors={["#ef8539", "#ff6a00", "#e3660d", "#ff6a00db"]}
        distortion={0.5}
        grainMixer={0}
        grainOverlay={0}
        height={720}
        speed={1}
        swirl={0.1}
        width={1280}
      />
    </div>
  );
}
