import type { OAuthStrategy } from "@clerk/types";

export interface AuthProvider {
  id: string;
  strategy: OAuthStrategy;
  /** Key into t.auth for the button label. */
  labelKey: "signInWithApple" | "signInWithGoogle";
}

// The only sign-in methods the app offers. To add a provider later (e.g.
// Google), enable it in the Clerk dashboard and add an entry here — the
// sign-in screens render whatever this list contains.
export const AUTH_PROVIDERS: AuthProvider[] = [
  { id: "apple", strategy: "oauth_apple", labelKey: "signInWithApple" },
];
