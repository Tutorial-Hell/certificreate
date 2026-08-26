"use client";

import { formatCertificateDate, isValidIsoDate } from "@/lib/certificate/date";
import { useAutoFitFontSize } from "@/lib/certificate/use-auto-fit-font-size";
import type { CertificateData } from "@/lib/certificate/types";

const RECIPIENT_NAME_BASE_FONT_SIZE = 40;

// Export is always gated behind full-data validation, so a placeholder can
// only ever appear in the live preview, never in an exported certificate.
function withPlaceholder(value: string, placeholder: string): { text: string; isPlaceholder: boolean } {
  const trimmed = value.trim();
  return trimmed ? { text: trimmed, isPlaceholder: false } : { text: placeholder, isPlaceholder: true };
}

function Signoff({ value, label, muted }: { value: string; label: string; muted?: boolean }) {
  return (
    <div className="text-center">
      <div
        className={`border-b border-[var(--cert-hairline)] pb-2 text-[30px] font-bold uppercase tracking-[0.06em] ${
          muted ? "italic text-[var(--cert-ink)]/30" : "text-[var(--cert-ink)]"
        }`}
      >
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
  const recipientName = withPlaceholder(data.recipientName, "Recipient Name");
  const course = withPlaceholder(data.course, "Course Name");
  const date =
    data.date.trim() && isValidIsoDate(data.date)
      ? { text: formatCertificateDate(data.date), isPlaceholder: false }
      : { text: "MM/DD/YYYY", isPlaceholder: true };
  const instructorName = withPlaceholder(data.instructorName, "Instructor Name");

  const { ref: recipientNameRef, fontSize: recipientNameFontSize } = useAutoFitFontSize<HTMLDivElement>(
    recipientName.text,
    RECIPIENT_NAME_BASE_FONT_SIZE,
  );

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
            <div
              ref={recipientNameRef}
              style={{ fontSize: recipientNameFontSize }}
              className={`min-w-[380px] max-w-[1000px] overflow-hidden whitespace-nowrap border-b border-[var(--cert-hairline)] px-2 pb-2 font-bold uppercase tracking-[0.1em] ${
                recipientName.isPlaceholder ? "italic text-[var(--cert-ink)]/30" : "text-[var(--cert-ink)]"
              }`}
            >
              {recipientName.text}
            </div>
            <div className="mt-3 text-[32px] text-[var(--cert-muted)]">
              Has completed the following Traversy Media course:
            </div>
            <div
              className={`text-[40px] font-bold ${
                course.isPlaceholder ? "italic text-[var(--cert-ink)]/30" : "text-[var(--cert-ink)]"
              }`}
            >
              {course.text}
            </div>
          </div>

          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-5">
            <Signoff value={date.text} label="Date" muted={date.isPlaceholder} />
            <LogoMark logoUrl={data.logoUrl} />
            <Signoff value={instructorName.text} label="Instructor" muted={instructorName.isPlaceholder} />
          </div>
        </div>
      </div>
    </div>
  );
}
