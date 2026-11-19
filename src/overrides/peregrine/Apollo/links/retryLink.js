import { RetryLink } from '@apollo/client/link/retry';
import { ServerError } from '@apollo/client';

const isServer = !globalThis.document;

export default function createRetryLink() {
    return new RetryLink({
        delay: {
            initial: 300,
            max: Infinity,
            jitter: true
        },
        attempts: {
            max: 5,
            retryIf: error => {
                if (error && (error.statusCode === 401 || error.message.includes('Received status code 401'))) {
                    return false;
                }

                return error && !isServer && navigator.onLine;
            }
        }
    });
}

