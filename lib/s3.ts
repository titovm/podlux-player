import { Track } from "@/types/track";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_WASABI_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_WASABI_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_WASABI_SECRET_ACCESS_KEY!
  },
  endpoint: `https://s3.${process.env.NEXT_PUBLIC_WASABI_REGION}.wasabisys.com`,
  forcePathStyle: true
});

interface S3Item {
  type: 'folder' | 'file';
  key: string;
  title: string;
  url?: string;
}

export async function listItems(prefix: string = ''): Promise<S3Item[]> {
  // Decode the incoming prefix (it might be encoded from the URL)
  const decodedPrefix = decodeURIComponent(prefix);
  
  const command = new ListObjectsV2Command({
    Bucket: process.env.NEXT_PUBLIC_WASABI_BUCKET!,
    Prefix: decodedPrefix,
    Delimiter: '/'
  });
  
  const response = await s3Client.send(command);
  const items: S3Item[] = [];

  // Add folders (CommonPrefixes)
  response.CommonPrefixes?.forEach(prefix => {
    const folderName = prefix.Prefix!.split('/').slice(-2)[0];
    items.push({
      type: 'folder',
      key: prefix.Prefix!,
      title: folderName
    });
  });

  // Add files with presigned URLs
  for (const item of response.Contents || []) {
    if (item.Key === decodedPrefix) continue;
    if (!item.Key!.toLowerCase().endsWith('.mp3')) continue;
    
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_WASABI_BUCKET!,
      Key: item.Key!,
    });
    
    // Generate presigned URL that expires in 1 hour
    const presignedUrl = await getSignedUrl(s3Client, getObjectCommand, {
      expiresIn: 3600
    });

    items.push({
      type: 'file',
      key: item.Key!,
      title: item.Key!.split('/').pop()!,
      url: presignedUrl
    });
  }

  return items;
}
