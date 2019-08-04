interface Locale {
  pullRequestOpenedGot: string;
  pullRequestOpenedDone: string;
  pullRequestUpdatedGot: string;
  pullRequestUpdatedDone: string;
  pullRequestMergedGot: string;
  pullRequestMergedDone: string;
  pullRequestClosedGot: string;
  pullRequestClosedDone: string;
}

const defaultLocale: Locale = {
  pullRequestOpenedGot: 'thanks for your contribution, a test application is being created...',
  pullRequestOpenedDone: 'the test application is created now, you can test it at {0}',
  pullRequestUpdatedGot: 'the test application is being updated...',
  pullRequestUpdatedDone: 'the test application is updated now, the test url is still available',
  pullRequestMergedGot: 'the test application is being destroyed...',
  pullRequestMergedDone: 'the test application is destroyed and not available now',
  pullRequestClosedGot: 'the test application is being destroyed...',
  pullRequestClosedDone: 'the test application is destroyed and not available now'
}

const locales: { [name: string]: Locale } = {
  'zh-cn': {
    pullRequestOpenedGot: '感谢贡献代码，即将创建测试程序...',
    pullRequestOpenedDone: '测试程序现在已经创建好，可以在 {0} 进行测试。',
    pullRequestUpdatedGot: '即将更新测试程序...',
    pullRequestUpdatedDone: '测试程序现在已经更新，测试地址未变化。',
    pullRequestMergedGot: '即将清理测试程序...',
    pullRequestMergedDone: '测试程序现在已经被清理，原测试地址已经失效。',
    pullRequestClosedGot: '即将清理测试程序...',
    pullRequestClosedDone: '测试程序现在已经被清理，原测试地址已经失效。'
  }
}

export function getLocale(name: string | undefined | Locale): Locale {
  if (name === undefined) {
    return defaultLocale
  }
  if (typeof name === 'string') {
    return locales[name.toLowerCase()] || defaultLocale
  }
  return name
}
