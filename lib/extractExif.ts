import exifr from 'exifr'

export interface PhotoMeta {
  date?: string      // "2026.01.15"
  time?: string      // "14:32"
  location?: string  // "서울특별시 강남구"
}

export async function extractPhotoMeta(file: File): Promise<PhotoMeta> {
  const meta: PhotoMeta = {}

  try {
    const exif = await exifr.parse(file, {
      pick: ['DateTimeOriginal'],
    }).catch(() => null)

    if (exif?.DateTimeOriginal) {
      const d = new Date(exif.DateTimeOriginal)
      if (!isNaN(d.getTime())) {
        const yy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        const hh = String(d.getHours()).padStart(2, '0')
        const min = String(d.getMinutes()).padStart(2, '0')
        meta.date = `${yy}.${mm}.${dd}`
        meta.time = `${hh}:${min}`
      }
    }

    const gps = await exifr.gps(file).catch(() => null)
    if (gps?.latitude !== undefined && gps?.longitude !== undefined) {
      const loc = await reverseGeocode(gps.latitude, gps.longitude)
      if (loc) meta.location = loc
    }
  } catch {
    // EXIF 없는 파일이나 파싱 오류는 조용히 무시
  }

  return meta
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ko`,
      { headers: { 'User-Agent': 'memymemo-journal-app' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const addr = data.address
    if (!addr) return null

    // 한국: 시/도 + 구/군/동
    const parts: string[] = []
    if (addr.state) parts.push(addr.state)
    const district = addr.county ?? addr.city_district ?? addr.suburb
    if (district) parts.push(district)

    return parts.length > 0 ? parts.join(' ') : (data.display_name?.split(',')[0]?.trim() ?? null)
  } catch {
    return null
  }
}
