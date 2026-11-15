/**
 * Centralized Legal & Brand Identity Configuration for CreatorsBrand
 *
 * Platform Product Name: CreatorsBrand
 * Operating Company / Legal Entity: CreatorsBrand
 */

export const LEGAL_CONFIG = {
  /** The public facing product/platform name */
  PLATFORM_NAME: "CreatorsBrand",

  /** The legal operating entity name */
  LEGAL_ENTITY_NAME: "CreatorsBrand",

  /** Clean footer operating statement */
  OPERATED_BY: "Operated by CreatorsBrand",

  /** Full legal identity statement */
  FULL_LEGAL_STATEMENT: "CreatorsBrand, operated by CreatorsBrand",

  /** Contractual entity reference used in terms and privacy policies */
  CONTRACTUAL_ENTITY: 'CreatorsBrand ("we", "us", or "our")',

  /** Legal Contact Details (Centralized configuration) */
  CONTACT: {
    /** Primary support / legal contact email */
    SUPPORT_EMAIL: "support@creatorsbrand.com",
    PRIVACY_EMAIL: "privacy@creatorsbrand.com",
    LEGAL_EMAIL: "legal@creatorsbrand.com",

    /** Corporate Address & Jurisdiction (Pending formal filing) */
    REGISTERED_ADDRESS: "CreatorsBrand Corporate Headquarters",
    GOVERNING_JURISDICTION: "Applicable Laws & State Jurisdiction",
  },
} as const;
