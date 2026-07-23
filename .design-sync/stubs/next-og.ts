// next/og stand-in: ImageResponse is a server-only renderer (pulls node fs /
// zlib through Next internals). The OG card component ships in the bundle but
// cannot execute outside a server runtime.
export class ImageResponse {
  constructor() {
    throw new Error("ImageResponse is server-only and unavailable in the design-system bundle");
  }
}
