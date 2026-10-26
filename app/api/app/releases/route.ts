import { NextRequest, NextResponse } from 'next/server';

const GITHUB_REPO = 'TECHTUNE-I-T-SOLUTIONS/eurekamobile';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

interface GitHubAsset {
  id: number;
  name: string;
  download_count: number;
  browser_download_url: string;
  size: number;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  body: string;
  assets: GitHubAsset[];
}

function extractReleaseNotes(body: string): string {
  if (!body) return '';
  let notes = body
    .replace(/##\s*Installation[\s\S]*?(?=##|$)/gi, '')
    .replace(/##\s*(?:Download|Assets)[\s\S]*?(?=##|$)/gi, '')
    .trim();
  if (notes.length > 400) return notes.substring(0, 400).trim() + '…';
  return notes;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10), 20);

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Eureka-App-Server',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(GITHUB_API_URL, { headers, next: { revalidate: 300 } });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch releases', status: res.status }, { status: 502 });
    }

    const raw: GitHubRelease[] = await res.json();

    const releases = raw
      .filter((r) => !r.draft)
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        version: r.tag_name.replace(/^v/, ''),
        tagName: r.tag_name,
        name: r.name || r.tag_name,
        isPrerelease: r.prerelease,
        publishedAt: r.published_at,
        releaseNotes: extractReleaseNotes(r.body),
        assets: r.assets.map((a) => ({
          id: a.id,
          name: a.name,
          size: a.size,
          downloadCount: a.download_count,
          downloadUrl: a.browser_download_url,
        })),
      }));

    return NextResponse.json(releases, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('[/api/app/releases]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
