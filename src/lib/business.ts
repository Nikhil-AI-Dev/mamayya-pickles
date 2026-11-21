/**
 * Statutory identifiers for the business. Single source of truth for the
 * storefront. The order API (backend/main.py) carries the same FSSAI number
 * via the FSSAI_REG_NO env var so receipts and emails match the site.
 */

export type FssaiKind = "Registration" | "Licence";

export const FSSAI: {
  /** 14-digit number from the FSSAI certificate. First digit 2 = Registration, 1 = Licence. */
  number: string;
  kind: FssaiKind;
  /** Legal name exactly as printed on the certificate. Shown on the policy page when set. */
  holder?: string;
  /** Validity end date from the certificate, YYYY-MM-DD. Renew at least 30 days before. */
  validUntil?: string;
  /** FSSAI's public register (FoSCoS), where any number can be verified. */
  verifyUrl: string;
} = {
  number: "21226184001414",
  kind: "Registration",
  verifyUrl: "https://foscos.fssai.gov.in/",
};

/** "Reg." for a registration, "Lic." for a licence: the abbreviation used on labels. */
export const FSSAI_ABBR = FSSAI.kind === "Registration" ? "Reg." : "Lic.";

/** The one-line form used in footers, labels and receipts. */
export const FSSAI_SHORT = `FSSAI ${FSSAI_ABBR} No. ${FSSAI.number}`;
