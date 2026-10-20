/* Red Apple Food Box | photos.js
   One place to set every photo on the page. Each value is a file path or a CDN link.
   To swap a photo, change its path or URL here. If an image fails to load,
   the page draws a placeholder illustration instead.
   All images are AI-generated for illustration, not photographs of the store. */
window.RED_APPLE_IMAGES = {
  /* Local files in assets/images/ (the storefront sign carries the real logo) */
  storefront: "assets/images/storefront.jpg",
  aisle: "assets/images/aisle.jpg",
  snacks: "assets/images/snacks.jpg",
  drinks: "assets/images/drinks.jpg",
  essentials: "assets/images/essentials.jpg",

  /* Local file first (drop pantry.jpg / basket.jpg into assets/images/), then the CDN link */
  pantry: ["assets/images/pantry.jpg", "https://d8j0ntlcm91z4.cloudfront.net/user_3Ge7kFte2ta7MrQJTvWjb8Z0Ovf/hf_20261020_131012_180786d6-2de1-48ac-83aa-d6ac9f63064b.png"],
  basket: ["assets/images/basket.jpg", "https://d8j0ntlcm91z4.cloudfront.net/user_3Ge7kFte2ta7MrQJTvWjb8Z0Ovf/hf_20261020_131012_635b87b0-036f-4d8f-8662-4431a65655f6.png"]
};
