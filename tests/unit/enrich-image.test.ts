import { afterEach, describe, expect, it, vi } from "vitest";
import { rehostImage } from "@/lib/enrich-image";

afterEach(() => {
  vi.unstubAllGlobals();
});

function storageMock() {
  const upload = vi.fn().mockResolvedValue({ error: null });
  const bucket = {
    upload,
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://storage.test/photo.jpg" } }),
  };
  return {
    upload,
    client: {
      storage: {
        listBuckets: vi.fn().mockResolvedValue({ data: [{ name: "business-photos" }] }),
        createBucket: vi.fn(),
        from: vi.fn().mockReturnValue(bucket),
      },
    },
  };
}

describe("image enrichment rehosting", () => {
  it("rejects downloads whose declared size exceeds the image limit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", {
      headers: { "content-length": String(5 * 1024 * 1024 + 1) },
    })));
    const { client, upload } = storageMock();

    await expect(rehostImage(client as never, "listing", "https://example.com/photo.jpg")).resolves.toBeNull();
    expect(upload).not.toHaveBeenCalled();
  });

  it("stops chunked downloads that exceed the image limit", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(3 * 1024 * 1024));
        controller.enqueue(new Uint8Array(3 * 1024 * 1024));
      },
      cancel() { cancelled = true; },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body)));
    const { client, upload } = storageMock();

    await expect(rehostImage(client as never, "listing", "https://example.com/photo.jpg")).resolves.toBeNull();
    expect(cancelled).toBe(true);
    expect(upload).not.toHaveBeenCalled();
  });

  it("uses detected image bytes for the stored type and extension", async () => {
    const png = new Uint8Array(3000);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(png)));
    const { client, upload } = storageMock();

    await expect(rehostImage(client as never, "listing", "https://example.com/photo.jpg")).resolves.toBe("https://storage.test/photo.jpg");
    expect(upload).toHaveBeenCalledWith("listing-cand.png", expect.any(Buffer), {
      contentType: "image/png",
      upsert: true,
    });
  });

  it("rejects non-image response bodies", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("x".repeat(3000))));
    const { client, upload } = storageMock();

    await expect(rehostImage(client as never, "listing", "https://example.com/photo.jpg")).resolves.toBeNull();
    expect(upload).not.toHaveBeenCalled();
  });
});
