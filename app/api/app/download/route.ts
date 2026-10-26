import { NextRequest, NextResponse } from 'next/server';

const GITHUB_REPO = 'TECHTUNE-I-T-SOLUTIONS/eurekamobile';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  assets: GitHubAsset[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Eureka-App-Server',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    let release: GitHubRelease | null = null;

    if (version) {
      const tag = version.startsWith('v') ? version : `v${version}`;
      const res = await fetch(`${GITHUB_API_URL}/tags/${tag}`, { headers });
      if (!res.ok) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      release = await res.json();
    } else {
      const res = await fetch(`${GITHUB_API_URL}/latest`, { headers });
      if (!res.ok) {
        // Fallback: list and take first non-draft, non-prerelease
        const listRes = await fetch(GITHUB_API_URL, { headers });
        if (!listRes.ok) return NextResponse.json({ error: 'No releases found' }, { status: 404 });
        const list: GitHubRelease[] = await listRes.json();
        release = list.find((r) => !r.draft && !r.prerelease) ?? list[0] ?? null;
      } else {
        release = await res.json();
      }
    }

    if (!release) return NextResponse.json({ error: 'No release found' }, { status: 404 });

    const apk = release.assets.find((a) => a.name.endsWith('.apk'));
    if (!apk) return NextResponse.json({ error: 'No APK asset found in this release' }, { status: 404 });

    return NextResponse.redirect(apk.browser_download_url, 302);
  } catch (err) {
    console.error('[/api/app/download]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
