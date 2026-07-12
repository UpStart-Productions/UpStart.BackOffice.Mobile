import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CapturedReceipt {
  blob: Blob;
  fileName: string;
  previewUrl: string;
}

/** Wraps @capacitor/camera for receipt photo capture — prompts the user to
 * choose camera or photo library, then resolves a Blob ready for upload. */
@Injectable({ providedIn: 'root' })
export class ReceiptCameraService {
  async capture(): Promise<CapturedReceipt | null> {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      promptLabelHeader: 'Receipt photo',
      promptLabelPhoto: 'Choose from library',
      promptLabelPicture: 'Take photo',
    });

    if (!photo.webPath) return null;

    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const ext = photo.format || 'jpg';
    const fileName = `receipt-${Date.now()}.${ext}`;

    return { blob, fileName, previewUrl: photo.webPath };
  }
}
