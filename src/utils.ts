export class Packer {
  root: any;
  constructor(w: number, h: number) {
    this.root = { x: 0, y: 0, w: w, h: h, used: false };
  }
  fit(blocks: any[]) {
    for (let i = 0; i < blocks.length; i++) {
      let block = blocks[i];
      let node = this.findNode(this.root, block.w, block.h);
      if (node) {
        block.fit = this.splitNode(node, block.w, block.h);
      }
    }
  }
  findNode(root: any, w: number, h: number): any {
    if (root.used) {
      return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
    } else if (w <= root.w && h <= root.h) {
      return root;
    }
    return null;
  }
  splitNode(node: any, w: number, h: number) {
    node.used = true;
    node.down = { x: node.x, y: node.y + h, w: node.w, h: node.h - h, used: false };
    node.right = { x: node.x + w, y: node.y, w: node.w - w, h: h, used: false };
    return node;
  }
}

export function injectDpiIntoJpeg(base64Image: string, dpi: number) {
  const dataURI = base64Image;
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  
  if (mimeString !== 'image/jpeg') return base64Image;

  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  if (ia[0] === 0xFF && ia[1] === 0xD8) {
    let offset = 2;
    while (offset < ia.length) {
      if (ia[offset] === 0xFF && ia[offset + 1] === 0xE0) {
        ia[offset + 11] = 1;
        ia[offset + 12] = Math.floor(dpi / 256);
        ia[offset + 13] = dpi % 256;
        ia[offset + 14] = Math.floor(dpi / 256);
        ia[offset + 15] = dpi % 256;
        break;
      }
      offset += 2 + (ia[offset + 2] << 8) + ia[offset + 3];
    }
  }

  let binary = '';
  for (let i = 0; i < ia.byteLength; i++) {
    binary += String.fromCharCode(ia[i]);
  }
  return 'data:' + mimeString + ';base64,' + btoa(binary);
}

export const processCanvasImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, type: string, width: number, height: number, nameForPlate = "") => {
  const imgAspect = img.width / img.height;
  const targetAspect = width / height;
  let drawW, drawH, offsetLineX, offsetLineY;
  if (imgAspect > targetAspect) { 
    drawH = img.height; 
    drawW = img.height * targetAspect; 
    offsetLineX = (img.width - drawW) / 2; 
    offsetLineY = 0; 
  } else { 
    drawW = img.width; 
    drawH = img.width / targetAspect; 
    offsetLineX = 0; 
    offsetLineY = (img.height - drawH) / 2; 
  }
  ctx.drawImage(img, offsetLineX, offsetLineY, drawW, drawH, 0, 0, width, height);
  
  const isNameplate = type.includes('_name');
  if (isNameplate) {
    const barH = Math.floor(height * 0.12); 
    const barY = height - barH;
    ctx.fillStyle = '#FFFFFF'; 
    ctx.fillRect(0, barY, width, barH);
    const text = nameForPlate.toUpperCase().trim();
    if (text) {
      const marginX = width * 0.05; 
      const availW = width - (marginX * 2);
      const fontSize = Math.floor(barH * 0.65); 
      ctx.font = `900 ${fontSize}px Arial, sans-serif`;
      const m = ctx.measureText(text);
      let scaleX = m.width > 0 ? availW / m.width : 1;
      if (scaleX > 2.5) scaleX = 2.5; 
      ctx.save(); 
      ctx.fillStyle = '#000000'; 
      ctx.textAlign = 'center'; 
      ctx.textBaseline = 'middle';
      ctx.translate(width / 2, barY + (barH / 2)); 
      ctx.scale(scaleX, 1); 
      ctx.fillText(text, 0, 0); 
      ctx.restore();
    }
  }
};
