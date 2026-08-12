import type { CertificateData } from "@/lib/certificate/types";

function Signoff({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="border-b border-[var(--cert-hairline)] pb-1.5 text-sm font-bold uppercase tracking-[0.06em] text-[var(--cert-ink)]">
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--cert-muted)]">{label}</div>
    </div>
  );
}

function LogoMark({ logoUrl }: { logoUrl?: string }) {
  return (
    <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[1.5px] border-[var(--cert-border)]">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable static asset
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-[var(--cert-border)]">
          <circle cx="4" cy="3" r="1.6" />
          <circle cx="10" cy="3" r="1.6" />
          <circle cx="16" cy="3" r="1.6" />
          <circle cx="10" cy="9" r="1.6" />
          <circle cx="10" cy="15" r="1.6" />
        </svg>
      )}
    </div>
  );
}

export function BlackBorderTemplate({ data }: { data: CertificateData }) {
  return (
    <div className="aspect-[1.414/1] w-full bg-[var(--cert-bg)] p-[14px] shadow-[var(--cert-shadow)]">
      <div className="h-full rounded-[26px] border-[3px] border-[var(--cert-border)] p-[5px]">
        <div className="flex h-full flex-col items-center justify-between rounded-[18px] border-[1.5px] border-[var(--cert-border-inner)] px-[50px] py-[34px] text-center">
          <div>
            <div className="font-serif text-[46px] font-bold leading-[1.05] text-[var(--cert-ink)]">
              Certificate
            </div>
            <div className="mt-0.5 font-serif text-2xl font-medium text-[var(--cert-ink)]">
              of Completion
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cert-muted)]">
              This is to certify that
            </div>
            <div className="min-w-[260px] border-b border-[var(--cert-hairline)] px-1.5 pb-1.5 text-lg font-bold uppercase tracking-[0.1em] text-[var(--cert-ink)]">
              {data.recipientName}
            </div>
            <div className="mt-2.5 text-sm text-[var(--cert-muted)]">
              Has completed the following Traversy Media course:
            </div>
            <div className="text-lg font-bold text-[var(--cert-ink)]">{data.course}</div>
          </div>

          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-5">
            <Signoff value={data.date} label="Date" />
            <LogoMark logoUrl={data.logoUrl} />
            <Signoff value={data.instructorName} label="Instructor" />
          </div>
        </div>
      </div>
    </div>
  );
}
