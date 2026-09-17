// Categoria veche /fitness-sport nu are echivalent. Regulile din _redirects sunt ignorate de
// Cloudflare pentru acest path (404 live, cauza neconfirmata), asa ca redirectionam din Function.
export const onRequest = ({ request }) => Response.redirect(new URL('/', request.url).toString(), 301);
