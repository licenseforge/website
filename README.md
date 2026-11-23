# licenseforge.io

Source of the [licenseforge.io](https://licenseforge.io) landing page and of the Go vanity import path `licenseforge.io/licenseforge`.

Plain static files, no build step: `index.html`, `assets/` (CSS, JS, images, the dashboard recording), `404.html`, `licenseforge/index.html`.

## Preview

```sh
python3 -m http.server 8000   # then http://localhost:8000
python3 scripts/check.py      # go-import tags, CSP hashes, local links
```

## Hosting

Cloudflare Pages serves the site from its Git integration: every push to `main` deploys, and every pull request gets a preview URL. Nothing deploys from GitHub Actions, and no Cloudflare token is stored in GitHub. `.github/workflows/pages.yml` only checks the site.
- `scripts/stage.sh` copies what is served into `_site/`, so the README, scripts and workflows stay unpublished.
- `_headers` sets the CSP and security headers.
- `_redirects` answers every `/licenseforge/...` path with the go-import page (status 200).

Preview the Pages behaviour locally: `scripts/stage.sh && npx wrangler pages dev _site`.

### Setting up Cloudflare Pages (once)
1. Add `licenseforge.io` to Cloudflare as a zone, and switch the domain's nameservers at the registrar to the two Cloudflare gives you. An apex custom domain on Pages needs the zone on Cloudflare.
2. Workers & Pages → Create → Pages → **Connect to Git** → install the Cloudflare GitHub app on the `licenseforge` organisation, for this repository only → pick `licenseforge/website`.
3. Build settings: framework preset **None**, build command `sh scripts/stage.sh`, build output directory `_site`, production branch `main`.
4. Project → Custom domains → add `licenseforge.io`, and `www.licenseforge.io` if wanted. Cloudflare creates the DNS records and the certificate.
5. Zone → SSL/TLS → Edge Certificates: turn on **Always Use HTTPS** and HSTS.

If the Pages project is ever deleted, delete its DNS records for `licenseforge.io` as well. A record left pointing at a freed `*.pages.dev` name could let another account serve its own `go-import` tag, and `go get licenseforge.io/...` would then fetch that account's code.

## Go vanity import

`go get licenseforge.io/licenseforge/sdk/go` requests `https://licenseforge.io/licenseforge/sdk/go?go-get=1` (and the same for any package path) and reads the `go-import` meta tag, which maps the path to the GitHub repository; nested modules such as `sdk/go` are found by directory, with tags `sdk/go/vX.Y.Z`.
- `licenseforge/index.html` and `404.html` carry the same tags in `<head>` (`scripts/check.py` keeps them in step).
- `cmd/go` reads the tag whatever the HTTP status: it reports the status only when no tag is found. So the 404 page still covers every package path if the rewrite in `_redirects` ever stops applying.

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
