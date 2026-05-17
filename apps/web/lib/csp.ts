import { IS_PRODUCTION } from "@calcom/lib/constants";
import { WEBAPP_URL } from "@calcom/lib/constants";

import { buildNonce } from "./buildNonce";

function getCspPolicy(nonce: string) {
  //TODO: Do we need to explicitly define it in turbo.json
  const CSP_POLICY = process.env.CSP_POLICY;

  // Note: "non-strict" policy only allows inline styles otherwise it's the same as "strict"
  // We can remove 'unsafe-inline' from style-src when we add nonces to all style tags
  // Maybe see how @next-safe/middleware does it if it's supported.
  const useNonStrictPolicy = CSP_POLICY === "non-strict";

  // We add WEBAPP_URL to img-src because of booking pages, which end up loading images from app.cal.com on cal.com
  // FIXME: Write a layer to extract out EventType Analytics tracking endpoints and add them to img-src or connect-src as needed. e.g. fathom, Google Analytics and others
  return `
	  default-src 'self' ${IS_PRODUCTION ? "" : "data:"};
	  script-src 'nonce-${nonce}' 'strict-dynamic' 'self' 'unsafe-inline' https:${
      IS_PRODUCTION ? "" : " http:"
    };
    object-src 'none';
    base-uri 'none';
	  child-src app.cal.com;
	  style-src 'self' ${
      IS_PRODUCTION ? (useNonStrictPolicy ? "'unsafe-inline'" : "") : "'unsafe-inline'"
    } app.cal.com;
	  font-src 'self';
	  img-src 'self' ${WEBAPP_URL} https://img.youtube.com https://eu.ui-avatars.com/api/ data:;
    connect-src 'self'
	`;
}

export function getCspNonce() {
  const nonce = buildNonce(crypto.getRandomValues(new Uint8Array(22)));

  return nonce;
}

export function getCspHeader({ shouldEnforceCsp, nonce }: { shouldEnforceCsp: boolean; nonce: string }) {
  const cspHeaderName = shouldEnforceCsp
    ? "Content-Security-Policy"
    : /*"Content-Security-Policy-Report-Only"*/ null;

  if (!cspHeaderName) {
    return null;
  }

  const cspHeaderValue = getCspPolicy(nonce)
    .replace(/\s{2,}/g, " ")
    .trim();

  return { name: cspHeaderName, value: cspHeaderValue };
}
