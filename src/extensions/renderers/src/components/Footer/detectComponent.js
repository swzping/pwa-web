export default function detectComponent(content) {
    return /class="footer-pwa"/.test(content);
}
