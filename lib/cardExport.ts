import type { Entry } from '@/types'

const SIZE = 1080
const PAD = 80

// ─── Utilities ───────────────────────────────────────────────────────────────

export function htmlToPlainText(html: string): string {
  if (!html || !html.startsWith('<')) return html
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent ?? div.innerText ?? '').trim()
}

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: 'cors', credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('FileReader failed'))
    reader.readAsDataURL(blob)
  })
}

function loadImgElement(src: string, useCors: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (useCors) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Image load failed: ${src.slice(0, 60)}`))
    img.src = src
  })
}

/**
 * Loads a remote image into an HTMLImageElement.
 * Strategy:
 *   1. fetch → blob → data URL  (avoids canvas CORS taint)
 *   2. direct load with crossOrigin=anonymous (fallback)
 * Returns null on complete failure.
 */
export async function loadImage(url: string): Promise<HTMLImageElement | null> {
  // Strategy 1: fetch → data URL
  try {
    const dataUrl = await fetchAsDataUrl(url)
    console.debug('[cardExport] photo fetched as data URL, bytes:', dataUrl.length)
    const img = await loadImgElement(dataUrl, false)
    console.debug('[cardExport] photo loaded:', img.naturalWidth, 'x', img.naturalHeight)
    return img
  } catch (e1) {
    console.warn('[cardExport] fetch→dataURL failed:', e1)
  }

  // Strategy 2: direct crossOrigin
  try {
    const img = await loadImgElement(url, true)
    console.debug('[cardExport] photo loaded direct:', img.naturalWidth, 'x', img.naturalHeight)
    return img
  } catch (e2) {
    console.error('[cardExport] photo load completely failed:', e2, 'url:', url)
    return null
  }
}

/** Load the first photo from an entry (returns null if none). */
export async function loadEntryPhoto(entry: Entry): Promise<HTMLImageElement | null> {
  const url = (entry.photos ?? [])[0]
  if (!url) {
    console.debug('[cardExport] entry has no photos')
    return null
  }
  console.debug('[cardExport] loading photo from:', url)
  return loadImage(url)
}

// ─── Canvas Helpers ───────────────────────────────────────────────────────────

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const ir = img.naturalWidth / img.naturalHeight
  const ar = w / h
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
  if (ir > ar) { sw = sh * ar; sx = (img.naturalWidth - sw) / 2 }
  else          { sh = sw / ar; sy = (img.naturalHeight - sh) / 2 }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function drawLavenderGradient(ctx: CanvasRenderingContext2D, x = 0, y = 0, w = SIZE, h = SIZE) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h)
  g.addColorStop(0, '#ede9ff')
  g.addColorStop(0.5, '#ddd6f9')
  g.addColorStop(1, '#c4b5fd')
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)
}

function drawWatermark(ctx: CanvasRenderingContext2D, color = 'rgba(255,255,255,0.75)') {
  ctx.save()
  ctx.font = '400 28px "Nanum Myeongjo", serif'
  ctx.fillStyle = color
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('memymemo', SIZE - PAD, SIZE - 36)
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  align: CanvasTextAlign = 'left'
): number {
  ctx.textAlign = align
  const chars = Array.from(text)
  const lines: string[] = []
  let cur = ''

  for (const ch of chars) {
    if (ch === '\n') {
      lines.push(cur); cur = ''
      if (lines.length >= maxLines) break
    } else {
      const test = cur + ch
      if (ctx.measureText(test).width > maxWidth && cur.length > 0) {
        lines.push(cur); cur = ch
        if (lines.length >= maxLines) break
      } else { cur = test }
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur)

  const fullLen = text.replace(/\n/g, '').length
  const drawnLen = lines.join('').length
  if (drawnLen < fullLen && lines.length > 0) {
    let last = lines[lines.length - 1]
    while (last.length > 0 && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1)
    lines[lines.length - 1] = last + '…'
  }

  let y = startY
  for (const line of lines) { ctx.fillText(line, x, y); y += lineHeight }
  return y
}

// ─── Template Functions (all operate at SIZE = 1080, drawn via ctx.scale) ────

function drawTemplate1(ctx: CanvasRenderingContext2D, q: string, a: string, date: string, photo: HTMLImageElement | null) {
  if (photo) drawImageCover(ctx, photo, 0, 0, SIZE, SIZE)
  else drawLavenderGradient(ctx)
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '300 26px "Noto Sans KR",sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(date.toLowerCase(), PAD, 120)
  const mid = SIZE / 2
  ctx.fillStyle = '#ffffff'; ctx.font = '400 46px "Nanum Myeongjo",serif'
  wrapText(ctx, q, mid, 400, SIZE - PAD * 2, 66, 4, 'center')
  ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.font = '300 30px "Noto Sans KR",sans-serif'
  wrapText(ctx, a, mid, 590, SIZE - PAD * 2, 48, 5, 'center')
  drawWatermark(ctx, 'rgba(255,255,255,0.6)')
}

function drawTemplate2(ctx: CanvasRenderingContext2D, q: string, a: string, date: string, photo: HTMLImageElement | null) {
  const splitY = SIZE * 0.6
  if (photo) drawImageCover(ctx, photo, 0, 0, SIZE, splitY)
  else drawLavenderGradient(ctx, 0, 0, SIZE, splitY)
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, splitY, SIZE, SIZE - splitY)
  ctx.font = '400 22px "Noto Sans KR",sans-serif'
  const badgeW = ctx.measureText(date).width + 40
  const badgeX = PAD, badgeY = splitY - 22
  ctx.fillStyle = '#7c3aed'; roundRect(ctx, badgeX, badgeY, badgeW, 44, 22); ctx.fill()
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText(date, badgeX + 20, badgeY + 22)
  const barX = PAD, barY = splitY + 60
  ctx.fillStyle = '#7c3aed'; ctx.fillRect(barX, barY, 6, 220)
  ctx.fillStyle = '#1e1b2e'; ctx.font = '400 40px "Nanum Myeongjo",serif'; ctx.textBaseline = 'alphabetic'
  wrapText(ctx, q, PAD + 30, barY + 50, SIZE - PAD * 2 - 30, 58, 3, 'left')
  ctx.fillStyle = '#5b4f85'; ctx.font = '300 28px "Noto Sans KR",sans-serif'
  wrapText(ctx, a, PAD + 30, barY + 190, SIZE - PAD * 2 - 30, 42, 3, 'left')
  drawWatermark(ctx, 'rgba(30,27,46,0.4)')
}

function drawTemplate3(ctx: CanvasRenderingContext2D, q: string, a: string, date: string, photo: HTMLImageElement | null) {
  if (photo) drawImageCover(ctx, photo, 0, 0, SIZE, SIZE)
  else drawLavenderGradient(ctx)
  const g = ctx.createLinearGradient(0, SIZE * 0.45, 0, SIZE)
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(124,58,237,0.85)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = '300 24px "Noto Sans KR",sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(date, PAD, SIZE - 260)
  ctx.fillStyle = '#ffffff'; ctx.font = '400 46px "Nanum Myeongjo",serif'
  wrapText(ctx, q, PAD, SIZE - 220, SIZE - PAD * 2, 62, 3, 'left')
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '300 28px "Noto Sans KR",sans-serif'
  wrapText(ctx, a, PAD, SIZE - 70, SIZE - PAD * 2, 44, 2, 'left')
  drawWatermark(ctx, 'rgba(255,255,255,0.7)')
}

function drawTemplate4(ctx: CanvasRenderingContext2D, q: string, a: string, date: string, photo: HTMLImageElement | null) {
  ctx.fillStyle = '#f5f0e8'; ctx.fillRect(0, 0, SIZE, SIZE)
  const pW = 720, pH = 840, pX = (SIZE - pW) / 2, pY = 60, border = 28
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10
  ctx.fillStyle = '#ffffff'; roundRect(ctx, pX, pY, pW, pH, 6); ctx.fill()
  ctx.restore()
  ctx.save()
  roundRect(ctx, pX + border, pY + border, pW - border * 2, pH - border * 2 - 160, 4)
  ctx.clip()
  if (photo) drawImageCover(ctx, photo, pX + border, pY + border, pW - border * 2, pH - border * 2 - 160)
  else drawLavenderGradient(ctx, pX + border, pY + border, pW - border * 2, pH - border * 2 - 160)
  ctx.restore()
  const captionY = pY + pH - 160
  ctx.fillStyle = '#3d3028'; ctx.font = '400 32px "Gowun Batang",serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(date, SIZE / 2, captionY + 40)
  ctx.fillStyle = '#5b4f85'; ctx.font = '400 36px "Gowun Batang",serif'
  wrapText(ctx, q, SIZE / 2, pY + pH + 44, pW, 52, 2, 'center')
  ctx.fillStyle = '#7c6fa0'; ctx.font = '400 28px "Gowun Dodum",sans-serif'
  wrapText(ctx, a, SIZE / 2, pY + pH + 150, pW, 42, 2, 'center')
  drawWatermark(ctx, 'rgba(30,27,46,0.35)')
}

function drawTemplate5(ctx: CanvasRenderingContext2D, q: string, a: string, date: string, category: string, photo: HTMLImageElement | null) {
  if (photo) drawImageCover(ctx, photo, 0, 0, SIZE, SIZE)
  else drawLavenderGradient(ctx)
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = '#ffffff'; ctx.font = '700 80px "Noto Sans KR",sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('MEMYMEMO', PAD, 148)
  ctx.fillStyle = '#7c3aed'; ctx.fillRect(PAD, 158, SIZE - PAD * 2, 4)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '300 22px "Noto Sans KR",sans-serif'
  ctx.fillText(category, PAD, 220); ctx.fillText(date, PAD, 250)
  ctx.fillStyle = '#c4b5fd'; ctx.font = '700 160px "Nanum Myeongjo",serif'; ctx.fillText('"', PAD - 8, SIZE - 260)
  ctx.fillStyle = '#ffffff'; ctx.font = '400 52px "Nanum Myeongjo",serif'
  wrapText(ctx, q, PAD, SIZE - 200, SIZE - PAD * 2, 70, 3, 'left')
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '300 26px "Noto Sans KR",sans-serif'
  wrapText(ctx, a, PAD, SIZE - 50, SIZE - PAD * 2, 40, 1, 'left')
  drawWatermark(ctx, 'rgba(255,255,255,0.6)')
}

function drawTemplate6(ctx: CanvasRenderingContext2D, q: string, a: string, date: string, photo: HTMLImageElement | null) {
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, SIZE, SIZE)
  const cr = 220, cx = SIZE - PAD - cr, cy = PAD + cr
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.clip()
  if (photo) drawImageCover(ctx, photo, cx - cr, cy - cr, cr * 2, cr * 2)
  else drawLavenderGradient(ctx, cx - cr, cy - cr, cr * 2, cr * 2)
  ctx.restore()
  ctx.save(); ctx.strokeStyle = '#ddd6f9'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
  ctx.fillStyle = '#c4b5fd'; ctx.font = '700 180px "Nanum Myeongjo",serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('"', PAD - 12, 320)
  ctx.fillStyle = '#5b4f85'; ctx.font = '400 44px "Nanum Myeongjo",serif'
  const qEndY = wrapText(ctx, q, PAD, 360, SIZE - PAD * 3 - cr, 64, 4, 'left')
  ctx.strokeStyle = '#ddd6f9'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(PAD, qEndY + 20); ctx.lineTo(SIZE - PAD, qEndY + 20); ctx.stroke()
  ctx.fillStyle = '#3d3b4e'; ctx.font = '300 30px "Noto Sans KR",sans-serif'
  wrapText(ctx, a, PAD, qEndY + 58, SIZE - PAD * 2, 46, 5, 'left')
  ctx.fillStyle = '#9585c2'; ctx.font = '300 24px "Noto Sans KR",sans-serif'
  ctx.textAlign = 'left'; ctx.fillText(date, PAD, SIZE - 38)
  drawWatermark(ctx, 'rgba(149,133,194,0.7)')
}

function drawTemplate7(ctx: CanvasRenderingContext2D, q: string, a: string, date: string, photo: HTMLImageElement | null) {
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, SIZE, SIZE)
  const filmH = Math.round(SIZE * 9 / 16), filmY = Math.round((SIZE - filmH) / 2)
  if (photo) drawImageCover(ctx, photo, 0, filmY, SIZE, filmH)
  else drawLavenderGradient(ctx, 0, filmY, SIZE, filmH)
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, SIZE, filmY); ctx.fillRect(0, filmY + filmH, SIZE, SIZE - filmY - filmH)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '300 28px "Noto Sans KR",sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(date, SIZE / 2, filmY / 2)
  ctx.fillStyle = '#ffffff'; ctx.font = '400 42px "Nanum Myeongjo",serif'
  const bottomStart = filmY + filmH + 30; ctx.textBaseline = 'alphabetic'
  wrapText(ctx, q, SIZE / 2, bottomStart, SIZE - PAD * 2, 58, 2, 'center')
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '300 26px "Noto Sans KR",sans-serif'
  wrapText(ctx, a, SIZE / 2, bottomStart + 140, SIZE - PAD * 2, 40, 2, 'center')
  drawWatermark(ctx, 'rgba(255,255,255,0.45)')
}

function drawTemplate8(ctx: CanvasRenderingContext2D, q: string, a: string, date: string, category: string, photo: HTMLImageElement | null) {
  if (photo) {
    ctx.save(); ctx.globalAlpha = 0.3; drawImageCover(ctx, photo, 0, 0, SIZE, SIZE); ctx.restore()
    ctx.fillStyle = 'rgba(237,233,255,0.5)'; ctx.fillRect(0, 0, SIZE, SIZE)
  } else {
    const g = ctx.createLinearGradient(0, 0, SIZE, SIZE)
    g.addColorStop(0, '#f0e6ff'); g.addColorStop(0.4, '#fce4ec'); g.addColorStop(1, '#ffffff')
    ctx.fillStyle = g; ctx.fillRect(0, 0, SIZE, SIZE)
  }
  const cX = 80, cY = 180, cW = SIZE - 160, cH = 720
  ctx.save(); ctx.shadowColor = 'rgba(124,58,237,0.12)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 8
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; roundRect(ctx, cX, cY, cW, cH, 24); ctx.fill(); ctx.restore()
  const iX = cX + 60, iW = cW - 120
  ctx.font = '400 22px "Noto Sans KR",sans-serif'
  const bW = ctx.measureText(category).width + 36
  ctx.fillStyle = '#ede9ff'; roundRect(ctx, iX, cY + 60, bW, 40, 20); ctx.fill()
  ctx.fillStyle = '#7c3aed'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(category, iX + 18, cY + 80)
  ctx.fillStyle = '#5b4f85'; ctx.font = '400 42px "Nanum Myeongjo",serif'; ctx.textBaseline = 'alphabetic'
  const qEndY = wrapText(ctx, q, iX, cY + 160, iW, 60, 3, 'left')
  ctx.strokeStyle = '#ddd6f9'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(iX, qEndY + 16); ctx.lineTo(iX + iW, qEndY + 16); ctx.stroke()
  ctx.fillStyle = '#3d3b4e'; ctx.font = '300 28px "Noto Sans KR",sans-serif'
  wrapText(ctx, a, iX, qEndY + 54, iW, 44, 5, 'left')
  ctx.fillStyle = '#9585c2'; ctx.font = '300 22px "Noto Sans KR",sans-serif'
  ctx.textAlign = 'right'; ctx.fillText(date, cX + cW - 60, cY + cH - 40)
  drawWatermark(ctx, 'rgba(149,133,194,0.65)')
}

function drawTemplate9(ctx: CanvasRenderingContext2D, q: string, a: string, date: string, photo: HTMLImageElement | null) {
  const half = SIZE / 2
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, half, SIZE); ctx.clip()
  if (photo) drawImageCover(ctx, photo, 0, 0, half, SIZE)
  else drawLavenderGradient(ctx, 0, 0, half, SIZE)
  ctx.restore()
  ctx.fillStyle = '#7c3aed'; ctx.fillRect(half, 0, half, SIZE)
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(half, 0); ctx.lineTo(half, SIZE); ctx.stroke()
  const rPad = 60, rX = half + rPad
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '300 24px "Noto Sans KR",sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(date, rX, 200)
  ctx.fillStyle = '#c4b5fd'; ctx.font = '700 100px "Nanum Myeongjo",serif'; ctx.fillText('"', rX - 8, 330)
  ctx.fillStyle = '#ffffff'; ctx.font = '400 44px "Nanum Myeongjo",serif'
  const qEndY = wrapText(ctx, q, rX, 370, half - rPad * 2, 62, 4, 'left')
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(rX, qEndY + 20); ctx.lineTo(SIZE - rPad, qEndY + 20); ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '300 28px "Noto Sans KR",sans-serif'
  wrapText(ctx, a, rX, qEndY + 60, half - rPad * 2, 44, 4, 'left')
  drawWatermark(ctx, 'rgba(255,255,255,0.65)')
}

function drawTemplate10(ctx: CanvasRenderingContext2D, q: string, a: string, date: string, photo: HTMLImageElement | null) {
  if (photo) {
    ctx.save(); ctx.globalAlpha = 0.15; drawImageCover(ctx, photo, 0, 0, SIZE, SIZE); ctx.restore()
  }
  const g = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  g.addColorStop(0, photo ? 'rgba(245,243,255,0.9)' : '#f5f3ff')
  g.addColorStop(1, photo ? 'rgba(237,233,255,0.88)' : '#ede9ff')
  ctx.fillStyle = g; ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = '#c4b5fd'; ctx.font = '700 220px "Nanum Myeongjo",serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('"', PAD - 16, 320)
  ctx.fillStyle = '#1e1b2e'; ctx.font = '400 68px "Nanum Myeongjo",serif'
  const qEndY = wrapText(ctx, q, PAD, 340, SIZE - PAD * 2, 90, 4, 'left')
  ctx.fillStyle = '#7c3aed'; ctx.fillRect(PAD, qEndY + 20, 200, 5)
  ctx.fillStyle = '#4b4480'; ctx.font = '300 32px "Noto Sans KR",sans-serif'
  wrapText(ctx, a, PAD, qEndY + 60, SIZE - PAD * 2, 50, 5, 'left')
  ctx.fillStyle = '#c4b5fd'; ctx.font = '700 180px "Nanum Myeongjo",serif'
  ctx.textAlign = 'right'; ctx.fillText('"', SIZE - PAD + 16, SIZE - 60)
  ctx.fillStyle = '#9585c2'; ctx.font = '300 24px "Noto Sans KR",sans-serif'
  ctx.textAlign = 'left'; ctx.fillText(date, PAD, SIZE - 40)
  drawWatermark(ctx, 'rgba(124,58,237,0.55)')
}

// ─── Core Draw (with pre-loaded photo) ───────────────────────────────────────

export async function drawCardWithPhoto(
  canvas: HTMLCanvasElement,
  entry: Entry,
  templateId: number,
  size: number,
  photo: HTMLImageElement | null
): Promise<void> {
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size)

  const scale = size / SIZE
  ctx.scale(scale, scale)

  await document.fonts.ready

  const q = entry.question
  const a = htmlToPlainText(entry.answer)
  const date = new Date(entry.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const category = entry.category

  switch (templateId) {
    case 1:  drawTemplate1(ctx, q, a, date, photo);          break
    case 2:  drawTemplate2(ctx, q, a, date, photo);          break
    case 3:  drawTemplate3(ctx, q, a, date, photo);          break
    case 4:  drawTemplate4(ctx, q, a, date, photo);          break
    case 5:  drawTemplate5(ctx, q, a, date, category, photo); break
    case 6:  drawTemplate6(ctx, q, a, date, photo);          break
    case 7:  drawTemplate7(ctx, q, a, date, photo);          break
    case 8:  drawTemplate8(ctx, q, a, date, category, photo); break
    case 9:  drawTemplate9(ctx, q, a, date, photo);          break
    case 10: drawTemplate10(ctx, q, a, date, photo);         break
  }
}

/** Generate all 10 thumbnails in parallel using a single preloaded photo. */
export async function generateAllThumbnails(
  entry: Entry,
  photo: HTMLImageElement | null,
  thumbSize = 200
): Promise<string[]> {
  return Promise.all(
    Array.from({ length: 10 }, async (_, i) => {
      const canvas = document.createElement('canvas')
      await drawCardWithPhoto(canvas, entry, i + 1, thumbSize, photo)
      return canvas.toDataURL('image/jpeg', 0.85)
    })
  )
}

/** Convenience: loads photo then draws. */
export async function drawCard(
  canvas: HTMLCanvasElement,
  entry: Entry,
  templateId: number,
  size = SIZE
): Promise<void> {
  const photo = await loadEntryPhoto(entry)
  await drawCardWithPhoto(canvas, entry, templateId, size, photo)
}

/** Download full-res PNG using a preloaded photo (or load fresh if not provided). */
export async function downloadCardPng(
  entry: Entry,
  templateId: number,
  photo?: HTMLImageElement | null
): Promise<void> {
  const resolvedPhoto = photo !== undefined ? photo : await loadEntryPhoto(entry)
  const canvas = document.createElement('canvas')
  await drawCardWithPhoto(canvas, entry, templateId, SIZE, resolvedPhoto)
  const dateStr = new Date(entry.created_at).toISOString().slice(0, 10)
  canvas.toBlob((blob) => {
    if (!blob) { console.error('[cardExport] toBlob returned null'); return }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memymemo_card_t${templateId}_${dateStr}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
