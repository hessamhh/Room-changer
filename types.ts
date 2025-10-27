export interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
