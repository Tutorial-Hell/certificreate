import type { CertificateData } from "@/lib/certificate/types";

function Signoff({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="border-b border-[var(--cert-hairline)] pb-2 text-[30px] font-bold uppercase tracking-[0.06em] text-[var(--cert-ink)]">
        {value}
      </div>
      <div className="mt-1.5 text-[26px] text-[var(--cert-muted)]">{label}</div>
    </div>
  );
}

function LogoMark({ logoUrl }: { logoUrl?: string }) {
  return (
    <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full border-[3px] border-[var(--cert-border)]">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable static asset
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-11 w-11 text-[var(--cert-border)]">
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
            <div className="font-serif text-[104px] font-bold leading-[1.05] text-[var(--cert-ink)]">
              Certificate
            </div>
            <div className="mt-1 font-serif text-[56px] font-medium text-[var(--cert-ink)]">
              of Completion
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <div className="mb-1 text-[26px] font-semibold uppercase tracking-[0.22em] text-[var(--cert-muted)]">
              This is to certify that
            </div>
            <div className="min-w-[380px] border-b border-[var(--cert-hairline)] px-2 pb-2 text-[40px] font-bold uppercase tracking-[0.1em] text-[var(--cert-ink)]">
              {data.recipientName}
            </div>
            <div className="mt-3 text-[32px] text-[var(--cert-muted)]">
              Has completed the following Traversy Media course:
            </div>
            <div className="text-[40px] font-bold text-[var(--cert-ink)]">{data.course}</div>
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
