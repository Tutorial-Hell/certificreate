"use client";

import { formatCertificateDate, isValidIsoDate } from "@/lib/certificate/date";
import { useAutoFitFontSize } from "@/lib/certificate/use-auto-fit-font-size";
import type { CertificateData } from "@/lib/certificate/types";

const RECIPIENT_NAME_BASE_FONT_SIZE = 44;

// Export is always gated behind full-data validation, so a placeholder can
// only ever appear in the live preview, never in an exported certificate.
function withPlaceholder(value: string, placeholder: string): { text: string; isPlaceholder: boolean } {
  const trimmed = value.trim();
  return trimmed ? { text: trimmed, isPlaceholder: false } : { text: placeholder, isPlaceholder: true };
}

function SignoffLine({
  value,
  label,
  align = "left",
  muted,
}: {
  value: string;
  label: string;
  align?: "left" | "right";
  muted?: boolean;
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div
        className={`border-t border-[var(--cert-hairline)] pt-2 text-[26px] font-bold uppercase tracking-[0.04em] ${
          muted ? "italic text-[var(--cert-ink)]/30" : "text-[var(--cert-ink)]"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[20px] text-[var(--cert-muted)]">{label}</div>
    </div>
  );
}

function LogoMark({ logoUrl }: { logoUrl?: string }) {
  return (
    <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full border-[3px] border-[var(--cert-border)] bg-[var(--cert-border)]/10">
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
    <div className="aspect-[1.414/1] w-full border-[3px] border-[var(--cert-border)] bg-[var(--cert-bg)] shadow-[var(--cert-shadow)]">
      <div className="flex h-full">
        <div className="w-[14px] shrink-0 bg-[var(--cert-border)]" />
        <div className="flex flex-1 flex-col justify-between px-[56px] py-[48px]">
          <div>
            <div className="font-sans text-[72px] font-bold leading-[1.05] text-[var(--cert-ink)]">
              Certificate <span className="text-[var(--cert-border)]">of Completion</span>
            </div>
            <div className="mt-5 h-[5px] w-[160px] bg-[var(--cert-border-inner)]" />
          </div>

          <div className="flex flex-1 flex-col justify-center gap-3">
            <div className="text-[24px] font-semibold uppercase tracking-[0.22em] text-[var(--cert-muted)]">
              This is to certify that
            </div>
            <div
              ref={recipientNameRef}
              style={{ fontSize: recipientNameFontSize }}
              className={`inline-block max-w-[1000px] overflow-hidden whitespace-nowrap border-b-2 border-[var(--cert-border-inner)] pb-1 font-bold uppercase tracking-[0.05em] ${
                recipientName.isPlaceholder ? "italic text-[var(--cert-ink)]/30" : "text-[var(--cert-ink)]"
              }`}
            >
              {recipientName.text}
            </div>
            <div className="mt-2 text-[28px] text-[var(--cert-muted)]">
              Has completed the following Traversy Media course:
            </div>
            <div
              className={`text-[36px] font-bold ${
                course.isPlaceholder ? "italic text-[var(--cert-ink)]/30" : "text-[var(--cert-ink)]"
              }`}
            >
              {course.text}
            </div>
          </div>

          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-end gap-8">
            <SignoffLine value={date.text} label="Date" muted={date.isPlaceholder} />
            <LogoMark logoUrl={data.logoUrl} />
            <SignoffLine
              value={instructorName.text}
              label="Instructor"
              align="right"
              muted={instructorName.isPlaceholder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
