import type { CertificateData } from "@/lib/certificate/types";

function SignoffLine({
  value,
  label,
  align = "left",
}: {
  value: string;
  label: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div className="border-t border-[var(--cert-hairline)] pt-2 text-[26px] font-bold uppercase tracking-[0.04em] text-[var(--cert-ink)]">
        {value}
      </div>
      <div className="mt-1 text-[20px] text-[var(--cert-muted)]">{label}</div>
    </div>
  );
}

function LogoMark({ logoUrl }: { logoUrl?: string }) {
  return (
    <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full border-[3px] border-[var(--cert-border)]">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable static asset
        <img src={logoUrl} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-9 w-9 text-[var(--cert-border)]">
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

export function ModernLineTemplate({ data }: { data: CertificateData }) {
  return (
    <div className="aspect-[1.414/1] w-full border-[3px] border-[var(--cert-border)] bg-[var(--cert-bg)] px-[64px] py-[48px] shadow-[var(--cert-shadow)]">
      <div className="flex h-full flex-col justify-between">
        <div>
          <div className="font-sans text-[72px] font-bold leading-[1.05] text-[var(--cert-ink)]">
            Certificate of Completion
          </div>
          <div className="mt-5 h-[6px] w-[200px] bg-[var(--cert-border)]" />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-3">
          <div className="text-[24px] font-semibold uppercase tracking-[0.22em] text-[var(--cert-muted)]">
            This is to certify that
          </div>
          <div className="text-[44px] font-bold uppercase tracking-[0.05em] text-[var(--cert-ink)]">
            {data.recipientName}
          </div>
          <div className="mt-2 text-[28px] text-[var(--cert-muted)]">
            Has completed the following Traversy Media course:
          </div>
          <div className="text-[36px] font-bold text-[var(--cert-ink)]">{data.course}</div>
        </div>

        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-end gap-8">
          <SignoffLine value={data.date} label="Date" />
          <LogoMark logoUrl={data.logoUrl} />
          <SignoffLine value={data.instructorName} label="Instructor" align="right" />
        </div>
      </div>
    </div>
  );
}
