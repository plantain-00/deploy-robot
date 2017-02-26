export type Locale = {
    justGot: string;
    defaultDone: string;
    pullRequestOpenedDone: string;
    pullRequestUpdatedDone: string;
    pullRequestMergedDone: string;
};

export const defaultLocale: Locale = {
    justGot: "it may take a few minutes to finish it.",
    defaultDone: "it's done now.",
    pullRequestOpenedDone: "the test application is created now, you can test it at {0}",
    pullRequestUpdatedDone: "the test application is updated now, the test url is still available",
    pullRequestMergedDone: "the test application is destroyed and not available now",
};

export const locales: { [name: string]: Locale } = {
    "zh-cn": {
        justGot: "可能需要几分钟完成相关工作。",
        defaultDone: "已完成。",
        pullRequestOpenedDone: "测试程序现在已经创建好，可以在 {0} 进行测试。",
        pullRequestUpdatedDone: "测试程序现在已经更新，测试地址未变化。",
        pullRequestMergedDone: "测试程序现在已经被清理，原测试地址已经失效。",
    },
};

export function getLocale(name: string | undefined | Locale): Locale {
    if (name === undefined) {
        return defaultLocale;
    }
    if (typeof name === "string") {
        return locales[name.toLowerCase()] || defaultLocale;
    }
    return name;
};
