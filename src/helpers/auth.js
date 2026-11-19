import cookies from 'js-cookie';

const expiredToken = new Date(Date.now() + 1000 * 60 * (60 * 4));

export const setLoginApoteker = (isLoginApoteker = 0, expired) => {
    cookies.set('isLoginApoteker', isLoginApoteker, { expires: expired || expiredToken });
    return 0;
};

export { expiredToken };