import { PresignedUrlListReq, PresignedUrlListRes } from '@/types/api';

/**
 * 파일을 presigned URL을 통해 S3에 업로드하고 최종 URL을 반환합니다.
 */
export async function uploadFiles(
  files: File[],
  getPresignedUrls: (data: PresignedUrlListReq) => Promise<PresignedUrlListRes>
): Promise<string[]> {
  if (files.length === 0) return [];

  // 1. Presigned URL 요청
  const presignedReq: PresignedUrlListReq = {
    presignedUrlList: files.map((file) => ({
      fileName: file.name,
    })),
  };

  const presignedRes = await getPresignedUrls(presignedReq);

  // 2. 각 파일을 presigned URL로 업로드
  const uploadPromises = files.map(async (file, index) => {
    const presigned = presignedRes.presignedUrlList[index];
    if (!presigned) {
      throw new Error(`Presigned URL not found for file ${file.name}`);
    }

    // S3에 파일 업로드
    const uploadResponse = await fetch(presigned.presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file ${file.name}`);
    }

    // 최종 파일 URL 반환
    return presigned.fileUrl;
  });

  return Promise.all(uploadPromises);
}

/**
 * 단일 파일 업로드
 */
export async function uploadFile(
  file: File,
  getPresignedUrls: (data: PresignedUrlListReq) => Promise<PresignedUrlListRes>
): Promise<string> {
  const urls = await uploadFiles([file], getPresignedUrls);
  return urls[0];
}
