export function GET(request: Request) {
  return Response.redirect(new URL("/icon.jpeg", request.url), 308);
}
