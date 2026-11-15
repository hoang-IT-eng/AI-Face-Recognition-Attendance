from pathlib import Path
import re

src = Path(__file__).with_name("landing-desktop.html").read_text(encoding="utf-8")
m = re.search(r"(<header[\s\S]*</footer>)", src)
body = m.group(1)

body = re.sub(r"\bclass=", "className=", body)
for tag in ["img", "br", "hr", "input", "meta", "link"]:
    body = re.sub(rf"<{tag}([^>]*?)(?<!/)>", rf"<{tag}\1 />", body)
body = re.sub(r"<!--(.*?)-->", lambda mm: "{/*" + mm.group(1) + "*/}", body, flags=re.S)

body = re.sub(
    r'<a className="hidden sm:inline-flex text-\[14\.5px\] font-medium text-on-surface-variant hover:text-on-surface transition-colors" href="#">Đăng nhập</a>',
    '<Link className="hidden sm:inline-flex text-[14.5px] font-medium text-on-surface-variant hover:text-on-surface transition-colors" to="/login">Đăng nhập</Link>',
    body,
    count=1,
)

body = re.sub(
    r'(<a className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-white text-slate-900 font-headline text-sm font-semibold hover:bg-slate-100 transition-colors shadow" )href="#">',
    r'\1to="/login">',
    body,
    count=1,
)
body = body.replace(
    '<a className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-white text-slate-900 font-headline text-sm font-semibold hover:bg-slate-100 transition-colors shadow" to="/login">',
    '<Link className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-white text-slate-900 font-headline text-sm font-semibold hover:bg-slate-100 transition-colors shadow" to="/login">',
    1,
)
idx = body.find("Đăng ký trải nghiệm ngay")
if idx != -1:
    close = body.find("</a>", idx)
    if close != -1:
        body = body[:close] + "</Link>" + body[close + 4 :]

# JSX needs &amp; etc; keep as-is. Fix style attributes if any (none expected).

component = f'''import {{ Link }} from "react-router-dom";

export default function Landing() {{
  return (
    <div className="landing-root bg-surface font-body text-on-surface antialiased selection:bg-primary-fixed selection:text-primary min-h-screen">
{body}
    </div>
  );
}}
'''

out = Path(__file__).resolve().parents[1] / "src" / "pages" / "Landing.jsx"
out.write_text(component, encoding="utf-8")
print("wrote", out, "bytes", out.stat().st_size)
print("Link count", component.count("<Link"))
print("class leftover", len(re.findall(r"(?<![a-zA-Z])class=", component)))
print("html comments left", "<!--" in component)
