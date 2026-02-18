/**
 * Generates a URL-friendly slug from a string.
 * @param {string} text - The text to slugify.
 * @returns {string} The slugified string.
 */
export const generateSlug = (text) => {
    if (!text) return "";

    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/&/g, "-and-") // Replace & with 'and'
        .replace(/[\s\W-]+/g, "-") // Replace spaces, non-word chars and dashes with a single dash
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
};
