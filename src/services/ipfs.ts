import { create } from 'kubo-rpc-client';

const client = create({ url: process.env.IPFS_API_URL! });

export async function pinFile(buffer: Buffer, filename: string): Promise<string> {
  const result = await client.add({ path: filename, content: buffer });
  await client.pin.add(result.cid);
  return result.cid.toString();
}

export async function resolveUrl(cid: string): Promise<string> {
  return `${process.env.IPFS_GATEWAY}/${cid}`;
}
