# licenseforge.io

Source of the [licenseforge.io](https://licenseforge.io) landing page and of the Go vanity import path `licenseforge.io/licenseforge`.

Plain static files, no build step: `index.html`, `assets/` (CSS, JS, images, the dashboard recording), `404.html`, `licenseforge/index.html`.

## Preview

```sh
python3 -m http.server 8000   # then http://localhost:8000
python3 scripts/check.py      # go-import tags, CSP hashes, local links
```

## Hosting

Any static host works. Point `licenseforge.io` at it and serve this directory as is:
- **Cloudflare Pages or Netlify:** `_headers` sets the CSP and security headers; `_redirects` answers every `/licenseforge/...` path with the go-import page (status 200).
- **GitHub Pages:** `.github/workflows/pages.yml` deploys `main`. Its deploy job fails until a maintainer sets up Pages (below). `_headers` and `_redirects` are ignored there. The go import still works through `404.html` (below). Set the security headers at a CDN in front if you need them.

### Setting up GitHub Pages (once)
1. **Verify the domain first:** organization Settings → Pages → Verified domains → add `licenseforge.io` and its TXT record. Otherwise, if the site is ever unpublished while DNS still points at GitHub, another account could claim the domain and serve its own `go-import` tag, so that `go get licenseforge.io/...` fetches its code.
2. Repository Settings → Pages → Source: **GitHub Actions**.
3. Custom domain `licenseforge.io`: the apex A/AAAA records from GitHub's docs, and `www` as a CNAME to `licenseforge.github.io` if wanted.
4. **Enforce HTTPS** once the certificate is issued, which can take up to a day.

## Go vanity import

`go get licenseforge.io/licenseforge/sdk/go` requests `https://licenseforge.io/licenseforge/sdk/go?go-get=1` (and the same for any package path) and reads the `go-import` meta tag, which maps the path to the GitHub repository; nested modules such as `sdk/go` are found by directory, with tags `sdk/go/vX.Y.Z`.
- `licenseforge/index.html` and `404.html` carry the same tags in `<head>` (`scripts/check.py` keeps them in step).
- `cmd/go` reads the tag whatever the HTTP status: it reports the status only when no tag is found. So a host's 404 page covers every package path without rewrite rules.

Verify after deploying:
```
curl -s "https://licenseforge.io/licenseforge/sdk/go?go-get=1" | grep go-import
GOPROXY=direct go list -m licenseforge.io/licenseforge/sdk/go@latest
```

The hosted app lives at `app.licenseforge.io`, the API at `api.licenseforge.io`; neither is served from here.

## The dashboard recording

`assets/media/demo.{webm,mp4}` and the `shot-*.webp` stills are a Playwright recording of the real dashboard (a fresh tenant on the local e2e environment of the main repository), sped up 1.35×. Re-record when the dashboard changes visibly; the chapter times in `index.html` follow the recording.

## License
[Apache License 2.0](LICENSE)
