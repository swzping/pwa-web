export const youtubeRegExp = new RegExp(
    '^(?:https?://|//)?(?:www\\.|m\\.)?' +
        '(?:youtu\\.be/|youtube\\.com/(?:embed/|v/|watch\\?v=|watch\\?.+&v=))([\\w-]{11})(?![\\w-])'
);

export const isYoutubeUrl = src => youtubeRegExp.test(src);

export const getYoutubeId = url => {
    const match = url.match(youtubeRegExp);
    let youtubeId = '';
    if (match && match[1].length == 11) {
        youtubeId = match[1];
    }
    return youtubeId;
};