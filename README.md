# licenseforge.io

Source of the [licenseforge.io](https://licenseforge.io) landing page and of the Go vanity import path `licenseforge.io/licenseforge`.

Plain static files; the only build step copies the served ones (`scripts/stage.sh`): `index.html`, `assets/` (CSS, JS, images, the dashboard recording), `404.html`, `licenseforge/index.html`.

## Preview

```sh
python3 -m http.server 8000   # then http://localhost:8000
python3 scripts/check.py      # go-import tags, CSP hashes, local links
```

## Hosting

Cloudflare Workers serves the site as static assets, from its Git integration (Workers Builds): every push to `main` deploys, and with builds for non-production branches enabled, every branch from this repository gets a preview version (pull requests from forks don't). The site is also reachable at `website.<account>.workers.dev`, which previews need. Nothing deploys from GitHub Actions, and no Cloudflare token is stored in GitHub. `.github/workflows/pages.yml` only checks the site.
- `wrangler.jsonc` configures it: the build runs `scripts/stage.sh`, and `_site/` is served, with `404.html` for unknown paths. There is no Worker script.
- `scripts/stage.sh` copies what is served into `_site/`, so the README, scripts and workflows stay unpublished.
- `_headers` sets the CSP and security headers.
- `_redirects` answers every `/licenseforge/...` path with the go-import page (status 200).

Preview locally: `npx -y wrangler@4 dev` (it runs the build first).

### Setting up Cloudflare (once)
1. Add `licenseforge.io` to Cloudflare as a zone, and switch the domain's nameservers at the registrar to the two Cloudflare gives you.
2. Workers & Pages → Create → **Import a repository** → install the Cloudflare GitHub app on the `licenseforge` organisation, for this repository only → pick `licenseforge/website`.
3. Build settings: leave the build command empty (`wrangler.jsonc` runs the stage script), deploy command `npx wrangler deploy`, root directory `/`. The project name must be `website`, matching `wrangler.jsonc`.
4. Worker → Settings → Domains & Routes → add the custom domain `licenseforge.io`, and `www.licenseforge.io` if wanted. Cloudflare creates the DNS records and the certificate.
5. Zone → SSL/TLS → Edge Certificates: turn on **Always Use HTTPS** and HSTS.

If the Worker or one of its custom domains is ever removed, check the zone's DNS records and delete any that are left, especially a `www` CNAME added by hand: another account could claim the name it points at.

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
