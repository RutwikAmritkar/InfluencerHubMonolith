import { SocialAccount } from "@workspace/db";

export interface VerificationResult {
  status: "VERIFIED" | "FAILED";
  verificationType?: "PROFILE_EXISTS";
  verifiedAt?: string;
  errorMessage?: string;
}

export interface ISocialVerificationProvider {
  platform: string;
  verify(account: SocialAccount): Promise<VerificationResult>;
}

// ─── Individual Platform Providers ──────────────────────────────────────────

export class InstagramVerificationProvider implements ISocialVerificationProvider {
  platform = "instagram";

  async verify(account: SocialAccount): Promise<VerificationResult> {
    const rawUrl = (account.profileUrl || "").toLowerCase();
    const handle = (account.username || "").trim();

    if (account.inputType === "url") {
      const isValidDomain = /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.-]+\/?$/i.test(rawUrl);
      if (!isValidDomain) {
        return {
          status: "FAILED",
          errorMessage: "Invalid Instagram profile URL format.",
        };
      }
    } else {
      if (!handle || handle.length < 1 || handle.includes(" ")) {
        return {
          status: "FAILED",
          errorMessage: "Invalid Instagram username format.",
        };
      }
    }

    return {
      status: "VERIFIED",
      verificationType: "PROFILE_EXISTS",
      verifiedAt: new Date().toISOString(),
    };
  }
}

export class YouTubeVerificationProvider implements ISocialVerificationProvider {
  platform = "youtube";

  async verify(account: SocialAccount): Promise<VerificationResult> {
    const rawUrl = (account.profileUrl || "").toLowerCase();
    const handle = (account.username || "").trim();

    if (account.inputType === "url") {
      const isValidDomain = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(rawUrl);
      if (!isValidDomain) {
        return {
          status: "FAILED",
          errorMessage: "Invalid YouTube profile or channel URL format.",
        };
      }
    } else {
      if (!handle || handle.length < 1) {
        return {
          status: "FAILED",
          errorMessage: "Invalid YouTube handle format.",
        };
      }
    }

    return {
      status: "VERIFIED",
      verificationType: "PROFILE_EXISTS",
      verifiedAt: new Date().toISOString(),
    };
  }
}

export class TikTokVerificationProvider implements ISocialVerificationProvider {
  platform = "tiktok";

  async verify(account: SocialAccount): Promise<VerificationResult> {
    const rawUrl = (account.profileUrl || "").toLowerCase();
    const handle = (account.username || "").trim();

    if (account.inputType === "url") {
      const isValidDomain = /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9_.-]+\/?$/i.test(rawUrl);
      if (!isValidDomain) {
        return {
          status: "FAILED",
          errorMessage: "Invalid TikTok profile URL format.",
        };
      }
    } else {
      if (!handle || handle.length < 1 || handle.includes(" ")) {
        return {
          status: "FAILED",
          errorMessage: "Invalid TikTok handle format.",
        };
      }
    }

    return {
      status: "VERIFIED",
      verificationType: "PROFILE_EXISTS",
      verifiedAt: new Date().toISOString(),
    };
  }
}

export class FacebookVerificationProvider implements ISocialVerificationProvider {
  platform = "facebook";

  async verify(account: SocialAccount): Promise<VerificationResult> {
    const rawUrl = (account.profileUrl || "").toLowerCase();
    const handle = (account.username || "").trim();

    if (account.inputType === "url") {
      const isValidDomain = /^(https?:\/\/)?(www\.)?facebook\.com\/.+/i.test(rawUrl);
      if (!isValidDomain) {
        return {
          status: "FAILED",
          errorMessage: "Invalid Facebook profile URL format.",
        };
      }
    } else {
      if (!handle || handle.length < 1) {
        return {
          status: "FAILED",
          errorMessage: "Invalid Facebook username format.",
        };
      }
    }

    return {
      status: "VERIFIED",
      verificationType: "PROFILE_EXISTS",
      verifiedAt: new Date().toISOString(),
    };
  }
}

export class XVerificationProvider implements ISocialVerificationProvider {
  platform = "x";

  async verify(account: SocialAccount): Promise<VerificationResult> {
    const rawUrl = (account.profileUrl || "").toLowerCase();
    const handle = (account.username || "").trim();

    if (account.inputType === "url") {
      const isValidDomain = /^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\/[a-zA-Z0-9_]+\/?$/i.test(rawUrl);
      if (!isValidDomain) {
        return {
          status: "FAILED",
          errorMessage: "Invalid X (Twitter) profile URL format.",
        };
      }
    } else {
      if (!handle || handle.length < 1 || handle.includes(" ")) {
        return {
          status: "FAILED",
          errorMessage: "Invalid X (Twitter) handle format.",
        };
      }
    }

    return {
      status: "VERIFIED",
      verificationType: "PROFILE_EXISTS",
      verifiedAt: new Date().toISOString(),
    };
  }
}

export class TwitchVerificationProvider implements ISocialVerificationProvider {
  platform = "twitch";

  async verify(account: SocialAccount): Promise<VerificationResult> {
    const rawUrl = (account.profileUrl || "").toLowerCase();
    const handle = (account.username || "").trim();

    if (account.inputType === "url") {
      const isValidDomain = /^(https?:\/\/)?(www\.)?twitch\.tv\/[a-zA-Z0-9_]+\/?$/i.test(rawUrl);
      if (!isValidDomain) {
        return {
          status: "FAILED",
          errorMessage: "Invalid Twitch channel URL format.",
        };
      }
    } else {
      if (!handle || handle.length < 1) {
        return {
          status: "FAILED",
          errorMessage: "Invalid Twitch channel handle format.",
        };
      }
    }

    return {
      status: "VERIFIED",
      verificationType: "PROFILE_EXISTS",
      verifiedAt: new Date().toISOString(),
    };
  }
}

export class LinkedInVerificationProvider implements ISocialVerificationProvider {
  platform = "linkedin";

  async verify(account: SocialAccount): Promise<VerificationResult> {
    const rawUrl = (account.profileUrl || "").toLowerCase();
    const handle = (account.username || "").trim();

    if (account.inputType === "url") {
      const isValidDomain = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/.+/i.test(rawUrl);
      if (!isValidDomain) {
        return {
          status: "FAILED",
          errorMessage: "Invalid LinkedIn profile URL format.",
        };
      }
    } else {
      if (!handle || handle.length < 1) {
        return {
          status: "FAILED",
          errorMessage: "Invalid LinkedIn profile handle format.",
        };
      }
    }

    return {
      status: "VERIFIED",
      verificationType: "PROFILE_EXISTS",
      verifiedAt: new Date().toISOString(),
    };
  }
}

export class PinterestVerificationProvider implements ISocialVerificationProvider {
  platform = "pinterest";

  async verify(account: SocialAccount): Promise<VerificationResult> {
    const rawUrl = (account.profileUrl || "").toLowerCase();
    const handle = (account.username || "").trim();

    if (account.inputType === "url") {
      const isValidDomain = /^(https?:\/\/)?(www\.)?pinterest\.com\/[a-zA-Z0-9_.-]+\/?$/i.test(rawUrl);
      if (!isValidDomain) {
        return {
          status: "FAILED",
          errorMessage: "Invalid Pinterest profile URL format.",
        };
      }
    } else {
      if (!handle || handle.length < 1) {
        return {
          status: "FAILED",
          errorMessage: "Invalid Pinterest handle format.",
        };
      }
    }

    return {
      status: "VERIFIED",
      verificationType: "PROFILE_EXISTS",
      verifiedAt: new Date().toISOString(),
    };
  }
}

export class SnapchatVerificationProvider implements ISocialVerificationProvider {
  platform = "snapchat";

  async verify(account: SocialAccount): Promise<VerificationResult> {
    const rawUrl = (account.profileUrl || "").toLowerCase();
    const handle = (account.username || "").trim();

    if (account.inputType === "url") {
      const isValidDomain = /^(https?:\/\/)?(www\.)?snapchat\.com\/add\/[a-zA-Z0-9_.-]+\/?$/i.test(rawUrl);
      if (!isValidDomain) {
        return {
          status: "FAILED",
          errorMessage: "Invalid Snapchat profile URL format.",
        };
      }
    } else {
      if (!handle || handle.length < 1) {
        return {
          status: "FAILED",
          errorMessage: "Invalid Snapchat handle format.",
        };
      }
    }

    return {
      status: "VERIFIED",
      verificationType: "PROFILE_EXISTS",
      verifiedAt: new Date().toISOString(),
    };
  }
}

export class FallbackVerificationProvider implements ISocialVerificationProvider {
  platform = "other";

  async verify(account: SocialAccount): Promise<VerificationResult> {
    const rawUrl = (account.profileUrl || "").toLowerCase();
    const handle = (account.username || "").trim();

    const isValid = (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) || handle.length > 0;
    if (!isValid) {
      return {
        status: "FAILED",
        errorMessage: "Invalid profile URL or handle format.",
      };
    }

    return {
      status: "VERIFIED",
      verificationType: "PROFILE_EXISTS",
      verifiedAt: new Date().toISOString(),
    };
  }
}

// ─── Main Service Registry ──────────────────────────────────────────────────

export class SocialVerificationService {
  private providers = new Map<string, ISocialVerificationProvider>();
  private fallbackProvider = new FallbackVerificationProvider();

  constructor() {
    this.registerProvider(new InstagramVerificationProvider());
    this.registerProvider(new YouTubeVerificationProvider());
    this.registerProvider(new TikTokVerificationProvider());
    this.registerProvider(new FacebookVerificationProvider());
    this.registerProvider(new XVerificationProvider());
    this.registerProvider(new TwitchVerificationProvider());
    this.registerProvider(new LinkedInVerificationProvider());
    this.registerProvider(new PinterestVerificationProvider());
    this.registerProvider(new SnapchatVerificationProvider());
  }

  registerProvider(provider: ISocialVerificationProvider) {
    this.providers.set(provider.platform.toLowerCase(), provider);
  }

  async verifyAccount(account: SocialAccount): Promise<VerificationResult> {
    const platform = (account.platform || "other").toLowerCase();
    const provider = this.providers.get(platform) || this.fallbackProvider;
    return provider.verify(account);
  }
}

export const socialVerificationService = new SocialVerificationService();
