const isDev = __DEV__;

export const Logger = {
    debug: (tag: string, message: string, ...args: unknown[]) => {
        if (isDev) {
            console.log(`[${tag}] ${message}`, ...args);
        }
    },

    info: (tag: string, message: string, ...args: unknown[]) => {
        console.log(`[${tag}] ${message}`, ...args);
    },

    warn: (tag: string, message: string, ...args: unknown[]) => {
        console.warn(`[${tag}] ${message}`, ...args);
    },

    error: (tag: string, message: string, ...args: unknown[]) => {
        console.error(`[${tag}] ${message}`, ...args);
    },
};
