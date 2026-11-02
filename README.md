# licenseforge.io

Source of the [licenseforge.io](https://licenseforge.io) landing page.

It also serves the Go vanity import path `licenseforge.io/licenseforge` (see `licenseforge/index.html`). Every path under `/licenseforge/` must return that page, which `_redirects` does on Cloudflare Pages or Netlify.

Verify after deploying:
```
curl -s "https://licenseforge.io/licenseforge/sdk/go?go-get=1" | grep go-import
```

The hosted app lives at `app.licenseforge.io`, the API at `api.licenseforge.io`; neither is served from here.

## License
[Apache License 2.0](LICENSE)
