import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";

export const Route = createFileRoute("/")({
  component: Home,
  loader: () => loadHighlightedCode(),
});

const codeExample = `import { createI18nEmail } from "i18n-email";

const i18n = createI18nEmail({
  openaiApiKey: process.env.OPENAI_API_KEY!,
});

const { subject, html } = await i18n.translate({
  locale: "pl",
  subject: "Welcome!",
  react: <WelcomeEmail name="Dan" />,
});`;

const beforeCode = `<h1>Welcome!</h1>
<p>Your account has been created.</p>
<p>Here's what you can do next:</p>`;

const afterCode = `<h1>Witamy!</h1>
<p>Twoje konto zostało utworzone.</p>
<p>Oto co możesz zrobić:</p>`;

const loadHighlightedCode = createServerFn({ method: "GET" }).handler(
  async () => {
    const { highlight } = await import("@/lib/highlight");
    const [codeHtml, beforeHtml, afterHtml] = await Promise.all([
      highlight(codeExample, "tsx"),
      highlight(beforeCode, "html"),
      highlight(afterCode, "html"),
    ]);
    return { codeHtml, beforeHtml, afterHtml };
  },
);

const features = [
  {
    title: "React Email & HTML",
    description:
      "Pass a React Email component or raw HTML. The library renders, extracts, and translates — you just pick a locale.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: "Single API call",
    description:
      "Subject and body are translated together in one OpenAI request. No multiple round-trips, no orchestration.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: "Smart extraction",
    description:
      "Only visible text is sent to OpenAI. Styles, scripts, head, and non-translatable markup are skipped automatically.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    title: "Built-in caching",
    description:
      "Plug any async key-value store — Redis, Upstash, DynamoDB — and identical emails won't hit OpenAI twice.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    title: "RTL support",
    description:
      'Arabic, Hebrew, Persian, and Urdu locales get dir="rtl" injected on the root element. Zero config.',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="17" y1="10" x2="3" y2="10" />
        <line x1="21" y1="6" x2="3" y2="6" />
        <line x1="21" y1="14" x2="3" y2="14" />
        <line x1="17" y1="18" x2="3" y2="18" />
      </svg>
    ),
  },
  {
    title: "Locale detection",
    description:
      "The source language is detected automatically. If the email is already in the target locale, nothing changes.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

function CodeBlock({
  html,
  label,
  badge,
}: {
  html: string;
  label?: string;
  badge?: string;
}) {
  return (
    <div className="rounded-xl border border-fd-border overflow-hidden">
      {(label || badge) && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-fd-border bg-fd-card">
          {label && (
            <span className="text-xs font-medium text-fd-muted-foreground uppercase tracking-wider">
              {label}
            </span>
          )}
          {badge && (
            <span className="ml-auto text-[11px] text-fd-muted-foreground font-mono">
              {badge}
            </span>
          )}
        </div>
      )}
      <div
        className="[&_pre]:!rounded-none [&_pre]:!border-0 [&_pre]:!m-0 [&_pre]:p-5 [&_pre]:text-sm [&_pre]:leading-relaxed [&_code]:!text-[13px]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function Home() {
  const { codeHtml, beforeHtml, afterHtml } = Route.useLoaderData();

  return (
    <HomeLayout {...baseOptions()}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-fd-primary/[0.03] blur-3xl" />
        </div>
        <div className="mx-auto max-w-[980px] px-6 pt-24 pb-20 md:pt-32 md:pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-fd-border bg-fd-card text-fd-muted-foreground text-xs tracking-wide">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Open source
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-fd-foreground leading-[1.1]">
            Translate emails.
            <br />
            <span className="text-fd-muted-foreground">Ship globally.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-fd-muted-foreground max-w-[600px] mx-auto leading-relaxed">
            i18n-email translates transactional emails into any language with a
            single function call. Works with React Email and raw HTML.
          </p>
          <div className="flex items-center justify-center gap-3 mt-10">
            <Link
              to="/docs/$"
              params={{ _splat: "" }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-fd-primary text-fd-primary-foreground text-sm font-medium transition-colors hover:bg-fd-primary/90"
            >
              Get started
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <a
              href="https://github.com/i18n-email/i18n-email"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-fd-border text-fd-foreground text-sm font-medium transition-colors hover:bg-fd-accent"
            >
              GitHub
            </a>
          </div>
          <div className="mt-6">
            <code className="text-xs text-fd-muted-foreground font-mono bg-fd-card border border-fd-border px-3 py-1.5 rounded-md select-all">
              bun add i18n-email
            </code>
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="mx-auto max-w-[980px] px-6 pb-20 md:pb-28">
        <div className="grid md:grid-cols-2 gap-4">
          <CodeBlock html={beforeHtml} label="Before" badge="en" />
          <CodeBlock html={afterHtml} label="After" badge="pl" />
        </div>
      </section>

      {/* Code Example */}
      <section className="mx-auto max-w-[980px] px-6 pb-20 md:pb-28">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fd-foreground">
            Three lines to translate
          </h2>
          <p className="mt-3 text-fd-muted-foreground max-w-[480px] mx-auto">
            Create a client, call translate, send. The subject and HTML body
            come back ready to use.
          </p>
        </div>
        <CodeBlock html={codeHtml} badge="index.tsx" />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[980px] px-6 pb-20 md:pb-28">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fd-foreground">
            Built for production
          </h2>
          <p className="mt-3 text-fd-muted-foreground max-w-[480px] mx-auto">
            Everything you need to ship translated emails at scale, with nothing
            you don't.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-fd-border bg-fd-card p-6 transition-colors hover:border-fd-foreground/10"
            >
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-fd-border bg-fd-background text-fd-foreground mb-4">
                {feature.icon}
              </div>
              <h3 className="text-sm font-semibold text-fd-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-fd-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[980px] px-6 pb-20 md:pb-28">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fd-foreground">
            How it works
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: "01",
              title: "Render",
              text: "React components are rendered to HTML. Raw HTML is used as-is.",
            },
            {
              step: "02",
              title: "Extract",
              text: "Visible text nodes and translatable attributes are collected and deduplicated.",
            },
            {
              step: "03",
              title: "Translate",
              text: "All unique strings are sent to OpenAI in a single request and translated.",
            },
            {
              step: "04",
              title: "Inject",
              text: "Translations are mapped back into the HTML. RTL direction is added if needed.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-fd-border bg-fd-card p-6"
            >
              <span className="text-xs font-mono text-fd-muted-foreground">
                {item.step}
              </span>
              <h3 className="text-sm font-semibold text-fd-foreground mt-3 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-fd-muted-foreground leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Maintainers */}
      <section className="mx-auto max-w-[980px] px-6 pb-20 md:pb-28">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fd-foreground">
            Maintainers
          </h2>
        </div>
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-4">
            <img
              src="/dan.png"
              alt="Dan Zabrotski"
              className="w-56 h-56 rounded-full border-2 border-fd-border object-cover"
            />
            <div className="text-center">
              <p className="text-sm font-semibold text-fd-foreground">
                Dan Zabrotski
              </p>
              <p className="text-xs text-fd-muted-foreground mt-0.5">Creator</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <a
                  href="https://github.com/dan-speekl"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-fd-muted-foreground hover:text-fd-foreground transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub
                </a>
                <span className="text-fd-border">·</span>
                <a
                  href="https://x.com/dantechceo"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-fd-muted-foreground hover:text-fd-foreground transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X
                </a>
                <span className="text-fd-border">·</span>
                <a
                  href="https://danzabrotski.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-fd-muted-foreground hover:text-fd-foreground transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Website
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[980px] px-6 pb-24 md:pb-32">
        <div className="rounded-xl border border-fd-border bg-fd-card p-10 md:p-14 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fd-foreground">
            Start translating today
          </h2>
          <p className="mt-3 text-fd-muted-foreground max-w-[440px] mx-auto">
            Add i18n-email to your project and reach every user in their
            language.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              to="/docs/$"
              params={{ _splat: "installation" }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-fd-primary text-fd-primary-foreground text-sm font-medium transition-colors hover:bg-fd-primary/90"
            >
              Read the docs
            </Link>
            <a
              href="https://www.npmjs.com/package/i18n-email"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-fd-border text-fd-foreground text-sm font-medium transition-colors hover:bg-fd-accent"
            >
              npm
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-fd-border py-8 text-center text-xs text-fd-muted-foreground">
        MIT License
      </footer>
    </HomeLayout>
  );
}
