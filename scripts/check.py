#!/usr/bin/env python3
"""Site checks, standard library only: python3 scripts/check.py (exit 1 on failure).

- Every page that serves the Go vanity import carries the same go-import and
  go-source tags, inside <head> (cmd/go stops reading at the body tag).
- The CSP in _headers allows exactly the inline scripts the pages have.
- Every local reference (src, href, poster, data-full) exists.
"""
import base64, hashlib, pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
fail = []
pages = sorted(p for p in root.rglob("*.html") if ".git" not in p.parts)

def head(text):
    return text.split("<body", 1)[0]

want = None
for name in ["licenseforge/index.html", "404.html"]:
    h = head((root / name).read_text())
    tags = re.findall(r'<meta name="go-(?:import|source)" content="[^"]+">', h)
    if len(tags) != 2:
        fail.append(f"{name}: go-import and go-source must both be in <head>")
    elif want is None:
        want = tags
    elif tags != want:
        fail.append(f"{name}: go tags differ from licenseforge/index.html")
if want and "licenseforge.io/licenseforge git https://github.com/licenseforge/licenseforge" not in want[0]:
    fail.append("go-import must map licenseforge.io/licenseforge to the GitHub repository")

csp = re.search(r"Content-Security-Policy: (.+)", (root / "_headers").read_text()).group(1)
allowed = set(re.findall(r"'(sha256-[A-Za-z0-9+/=]+)'", csp))
for p in pages:
    for body in re.findall(r"<script>(.*?)</script>", p.read_text(), re.S):
        h = "sha256-" + base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()
        if h not in allowed:
            fail.append(f"{p.relative_to(root)}: inline script not allowed by the CSP ({h})")
        allowed.discard(h)
if allowed:
    fail.append(f"_headers: CSP allows hashes no page uses: {sorted(allowed)}")

for p in pages:
    for ref in re.findall(r'(?:src|href|poster|data-full)="(/[^"#?]*)', p.read_text()):
        target = root / ref.lstrip("/")
        if ref.endswith("/"):
            target = target / "index.html"
        if not target.exists():
            fail.append(f"{p.relative_to(root)}: missing {ref}")

for f in fail:
    print("FAIL", f)
print("ok" if not fail else f"{len(fail)} problem(s)")
sys.exit(1 if fail else 0)
