export default function detectComponent(content) {
    return /class="contact-pwa"/.test(content);
}
