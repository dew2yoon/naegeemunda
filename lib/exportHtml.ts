import { Entry, InterviewSession } from '@/types'

const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&family=Gowun+Dodum&family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@300;400;500&family=Noto+Serif+KR:wght@300;400;500&display=swap`

const HTML_STYLE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #f5f3ff;
    color: #1e1b2e;
    font-family: 'Noto Sans KR', sans-serif;
    padding: 40px 20px;
    line-height: 1.6;
  }
  .container { max-width: 720px; margin: 0 auto; }
  h1 {
    font-family: 'Nanum Myeongjo', serif;
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 32px;
    color: #1e1b2e;
  }
  .card {
    background: #fff;
    border: 1px solid #ddd6f9;
    border-radius: 12px;
    padding: 28px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.05);
  }
  .badge {
    display: inline-block;
    background: #ede9ff;
    color: #7c3aed;
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 20px;
    margin-bottom: 10px;
  }
  .date { font-size: 12px; color: #9585c2; margin-bottom: 14px; }
  .question {
    font-family: 'Nanum Myeongjo', serif;
    font-size: 18px;
    line-height: 1.5;
    margin-bottom: 16px;
    color: #1e1b2e;
  }
  .answer {
    font-size: 15px;
    line-height: 1.8;
    color: #1e1b2e;
    white-space: pre-wrap;
  }
  .photos { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .photos img { width: 120px; height: 120px; object-fit: cover; border-radius: 8px; }
  @media (max-width: 600px) {
    body { padding: 20px 12px; }
    .card { padding: 20px; }
  }
`

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function exportSingleEntryHtml(entry: Entry): void {
  const dateStr = new Date(entry.created_at).toISOString().slice(0, 10)
  const photosHtml =
    entry.photos.length > 0
      ? `<div class="photos">${entry.photos.map((url) => `<img src="${url}" alt="첨부 사진" />`).join('')}</div>`
      : ''

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>memymemo — ${dateStr}</title>
  <link href="${GOOGLE_FONTS_URL}" rel="stylesheet" />
  <style>${HTML_STYLE}</style>
</head>
<body>
  <div class="container">
    <h1>memymemo</h1>
    <div class="card">
      <div class="badge">${entry.category}</div>
      <div class="date">${formatDate(entry.created_at)}</div>
      <div class="question">${entry.question}</div>
      <div class="answer" style="font-family: '${entry.font_family}', sans-serif; font-size: ${entry.font_size};">${entry.answer}</div>
      ${photosHtml}
    </div>
  </div>
</body>
</html>`

  downloadHtml(html, `memymemo_${dateStr}.html`)
}

export function exportAllEntriesHtml(entries: Entry[]): void {
  const dateStr = new Date().toISOString().slice(0, 10)

  const cardsHtml = entries
    .map((entry) => {
      const photosHtml =
        entry.photos.length > 0
          ? `<div class="photos">${entry.photos.map((url) => `<img src="${url}" alt="첨부 사진" />`).join('')}</div>`
          : ''
      return `<div class="card">
      <div class="badge">${entry.category}</div>
      <div class="date">${formatDate(entry.created_at)}</div>
      <div class="question">${entry.question}</div>
      <div class="answer" style="font-family: '${entry.font_family}', sans-serif; font-size: ${entry.font_size};">${entry.answer}</div>
      ${photosHtml}
    </div>`
    })
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>memymemo — 전체 기록</title>
  <link href="${GOOGLE_FONTS_URL}" rel="stylesheet" />
  <style>${HTML_STYLE}</style>
</head>
<body>
  <div class="container">
    <h1>memymemo — 전체 기록 (${entries.length}개)</h1>
    ${cardsHtml}
  </div>
</body>
</html>`

  downloadHtml(html, `memymemo_전체기록_${dateStr}.html`)
}

export function exportInterviewSessionHtml(session: InterviewSession): void {
  const dateStr = new Date(session.created_at).toISOString().slice(0, 10)
  const dateKo = formatDate(session.created_at)
  const keywordSlug = session.keyword.replace(/\s+/g, '')

  const qaHtml = session.questions
    .map((q, i) => {
      const answer = session.answers[i] ?? ''
      const photoEntry = session.photos.find((p) => p.question_index === i)
      const photosHtml =
        photoEntry && photoEntry.urls.length > 0
          ? `<div class="photos">${photoEntry.urls.map((url) => `<img src="${url}" alt="첨부 사진" />`).join('')}</div>`
          : ''
      return `<div class="qa-block">
      <div class="qa-question">Q. ${q}</div>
      <div class="answer">${answer || '<span style="color:#9585c2">— 답변 없음 —</span>'}</div>
      ${photosHtml}
    </div>`
    })
    .join('\n')

  const interviewStyle = `
  .divider { border: none; border-top: 1px solid #ddd6f9; margin: 32px 0; }
  .interview-header { text-align: center; margin-bottom: 40px; }
  .interview-title {
    font-family: 'Nanum Myeongjo', serif;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .interview-keyword {
    display: inline-block;
    background: #ede9ff;
    color: #7c3aed;
    font-size: 14px;
    padding: 4px 14px;
    border-radius: 20px;
    margin-bottom: 8px;
  }
  .interview-date { font-size: 13px; color: #9585c2; }
  .qa-block { margin-bottom: 36px; }
  .qa-question {
    font-family: 'Nanum Myeongjo', serif;
    font-size: 18px;
    line-height: 1.5;
    color: #7c3aed;
    margin-bottom: 14px;
  }
  `

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>memymemo 인터뷰 — ${session.keyword}</title>
  <link href="${GOOGLE_FONTS_URL}" rel="stylesheet" />
  <style>${HTML_STYLE}${interviewStyle}</style>
</head>
<body>
  <div class="container">
    <div class="interview-header">
      <div class="interview-title">🎙 memymemo</div>
      <div class="interview-keyword">${session.keyword} 인터뷰</div>
      <div class="interview-date">${dateKo}</div>
    </div>
    <hr class="divider" />
    ${qaHtml}
  </div>
</body>
</html>`

  downloadHtml(html, `memymemo_인터뷰_${keywordSlug}_${dateStr}.html`)
}

// ─── SNS 최적화 내보내기 ────────────────────────────────────────────────────

/** 인스타그램 카드 스타일 (정사각형 1080×1080 기반, 단일 엔트리) */
export function exportInstagramCardHtml(entry: Entry): void {
  const dateStr = new Date(entry.created_at).toISOString().slice(0, 10)
  const answerHtml = entry.answer.startsWith('<') ? entry.answer : `<p>${entry.answer}</p>`

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>memymemo card — ${dateStr}</title>
  <link href="${GOOGLE_FONTS_URL}" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #ede9ff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Noto Sans KR', sans-serif;
      padding: 20px;
    }
    .card {
      width: 100%;
      max-width: 540px;
      aspect-ratio: 1 / 1;
      background: #ffffff;
      border-radius: 24px;
      padding: 48px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 8px 40px rgba(124,58,237,.15);
      overflow: hidden;
    }
    .category {
      display: inline-block;
      background: #ede9ff;
      color: #7c3aed;
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 20px;
      width: fit-content;
    }
    .question {
      font-family: 'Nanum Myeongjo', serif;
      font-size: 20px;
      line-height: 1.6;
      color: #5b4f85;
      margin-bottom: 24px;
      flex-shrink: 0;
    }
    .answer {
      font-size: 15px;
      line-height: 1.9;
      color: #1e1b2e;
      flex: 1;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 6;
      -webkit-box-orient: vertical;
    }
    .footer {
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .brand {
      font-family: 'Nanum Myeongjo', serif;
      font-size: 13px;
      font-weight: 700;
      color: #7c3aed;
    }
    .date { font-size: 11px; color: #9585c2; }
  </style>
</head>
<body>
  <div class="card">
    <div>
      <div class="category">${entry.category}</div>
      <div class="question">${entry.question}</div>
      <div class="answer" style="font-family:'${entry.font_family}',sans-serif;font-size:${entry.font_size};">${answerHtml}</div>
    </div>
    <div class="footer">
      <span class="brand">memymemo</span>
      <span class="date">${formatDate(entry.created_at)}</span>
    </div>
  </div>
</body>
</html>`

  downloadHtml(html, `memymemo_card_${dateStr}.html`)
}

/** 블로그 포스트 스타일 (단일 엔트리, 긴 글 최적화) */
export function exportBlogPostHtml(entry: Entry): void {
  const dateStr = new Date(entry.created_at).toISOString().slice(0, 10)
  const answerHtml = entry.answer.startsWith('<') ? entry.answer : `<p>${entry.answer}</p>`
  const photosHtml = (entry.photos ?? []).length > 0
    ? `<div class="photos">${(entry.photos ?? []).map((url) => `<img src="${url}" alt="첨부 사진" />`).join('')}</div>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${entry.question} — memymemo</title>
  <link href="${GOOGLE_FONTS_URL}" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f5f3ff;
      color: #1e1b2e;
      font-family: 'Noto Sans KR', sans-serif;
      padding: 60px 20px;
      line-height: 1.7;
    }
    .container { max-width: 680px; margin: 0 auto; }
    .meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
    }
    .category {
      background: #ede9ff;
      color: #7c3aed;
      font-size: 12px;
      padding: 3px 12px;
      border-radius: 20px;
    }
    .date { font-size: 12px; color: #9585c2; }
    .brand { font-size: 12px; color: #9585c2; margin-left: auto; font-family: 'Nanum Myeongjo', serif; font-weight: 700; }
    h1 {
      font-family: 'Nanum Myeongjo', serif;
      font-size: 26px;
      font-weight: 700;
      line-height: 1.5;
      margin-bottom: 36px;
      color: #1e1b2e;
    }
    .divider {
      border: none;
      border-top: 1px solid #ddd6f9;
      margin-bottom: 36px;
    }
    .answer {
      font-size: 16px;
      line-height: 2;
      color: #1e1b2e;
      white-space: pre-wrap;
    }
    .answer p { margin-bottom: 1.2em; }
    .answer ul, .answer ol { padding-left: 1.5em; margin-bottom: 1.2em; }
    .answer li { margin-bottom: 0.4em; }
    .photos { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 32px; }
    .photos img { max-width: 320px; width: 100%; border-radius: 12px; }
    @media (max-width: 600px) { body { padding: 40px 16px; } h1 { font-size: 22px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="meta">
      <span class="category">${entry.category}</span>
      <span class="date">${formatDate(entry.created_at)}</span>
      <span class="brand">memymemo</span>
    </div>
    <h1>${entry.question}</h1>
    <hr class="divider" />
    <div class="answer" style="font-family:'${entry.font_family}',sans-serif;font-size:${entry.font_size};">${answerHtml}</div>
    ${photosHtml}
  </div>
</body>
</html>`

  downloadHtml(html, `memymemo_blog_${dateStr}.html`)
}

function downloadHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
