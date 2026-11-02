/**
 * Vertical rhythm for MDX blocks that opt out of typeset (`not-prose`): the
 * article flow between blocks (20px, 24px on phones), a tighter gap under a
 * heading, none at the top. Mirrors `.typeset-docs` in `app/typeset.css`.
 */
export const BLOCK_SPACING =
  "mt-5 max-md:mt-6 first:mt-0 [:is(h2,h3)+&]:mt-4 max-md:[:is(h2,h3)+&]:mt-3.5";
