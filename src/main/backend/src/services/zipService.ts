import archiver from "archiver";
import { PassThrough } from "stream";

export async function createManifestZip(manifests: Record<string, string>): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const output = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    output.on("data", (chunk: Buffer) => chunks.push(chunk));
    output.on("end", () => resolve(Buffer.concat(chunks)));
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);

    for (const [fileName, content] of Object.entries(manifests)) {
      archive.append(content, { name: fileName });
    }

    void archive.finalize();
  });
}
