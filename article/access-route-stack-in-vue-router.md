---
title: 在 vue-router 中访问导航栈
date: Tue Jan 22 2019 00:28:04 GMT+0800 (CST)
tags:
  - 前端
---

`vue` 提供了 `<transition>` 组件来为组件的切换添加动画，得益于这个特性， `vue-router` 中的 `router-view` 也可以在切换路由组件时播放动画。自然的，就产生了在前进/后退时使用不同动画的需求。在 `vue-router` 文档的 [Route-Based Dynamic Transition][1] 一节中，提供了这样的写法：

```js
// then, in the parent component,
// watch the `$route` to determine the transition to use
watch: {
  '$route' (to, from) {
    const toDepth = to.path.split('/').length
    const fromDepth = from.path.split('/').length
    this.transitionName = toDepth < fromDepth ? 'slide-right' : 'slide-left'
  }
}
```

根据路径中 `/` 的个数来判断路由的深度，然后以此决定播放的动画。但事情并不总是那么简单。

<!-- more -->

想象一个在线音乐流媒体应用 ~~[真的不是这个][2]~~ ，其中有搜索（ `/search` ），歌手（`/artist/:id`），专辑（`/album/:id`），歌单（`/playlist/:id`）等页面。用户搜索 <sup>1</sup> 关键词后，通过搜索结果进入歌单 <sup>2</sup> 页面，然后根据歌单中的歌曲进入歌手 <sup>3</sup> 页面，再由歌手详情页的专辑列表进入专辑 <sup>4</sup> 页面。在这期间，累积了这样的导航栈：

1. `/search`
2. `/playlist/:id`
3. `/artist/:id`
4. `/album/:id`

此时，如果用户选择返回，根据上面的代码计算出的路由 3 与 4 的“层级”相同，用户将看到与导航前进时完全相同的动画，这很反直觉。如果觉得这样的表述不够直观，可以看[这个 fiddle][3] 。

所以 `vue-router` 就真的没有一个导航栈吗？还真就没有。甚至还在 GitHub 上找到了一个 [6012 年的上古 Issue][4] ，然后惊奇地发现它被列在了 Todo in 3.x 中。

怎么办？`vue-router` 提供了一个 [`abstract` 模式][5]，由数组保存所经过的路由，可以由 `$router.history.stack` 访问到。具体的细节可以参见[源码][6]。感觉这本来是提供给没有 浏览器 API 的 SSR 环境用的，不过这里也可以适用。不过有个缺点：使用 `abstract` 模式后，任何的路由变化都不会体现在地址栏上， URL 将不会有任何变化。~~反正 Electron 本来就看不见地址栏~~

至于实现，请看[这个 fiddle][7] 。值得注意的是，`abstract` 模式的 `vue-router` 在使用前需要先手动 `push` 一个路由进去，否则路径会是空的。

---

（这似乎是这个博客建立以来的第一篇正经的前端文章呢 ... 有点尴尬 ...）

最近一直在肝 [Electron NCM][8] ，用上了网易云新版 eapi ，常用的功能都写得差不多了，只剩一些我基本不用的什么私人 FM 啦，榜单啦，用户关注啦之类的。哦其实也不能看评论，不过用桌面版客户端听歌的时候一般都是在写代码嘛，哪有空看评论啊 ...

这篇文章也是对开发时解决问题的记录，这是一个真实的需求！不过这个项目中有更复杂的动画逻辑，比如播放器界面的展开/折叠之类的。详情可以看[这一段][9]。

好了，不多说，该睡了。

---

## 参考

1. https://markus.oberlehner.net/blog/vue-router-page-transitions/

[1]: https://router.vuejs.org/guide/advanced/transitions.html#route-based-dynamic-transition
[2]: https://github.com/Rocket1184/electron-netease-cloud-music
[3]: https://jsfiddle.net/Rocka/d9vqn3ko/3/
[4]: https://github.com/vuejs/vue-router/issues/883
[5]: https://router.vuejs.org/api/#mode
[6]: https://github.com/vuejs/vue-router/blob/v3.0.2/src/history/abstract.js
[7]: https://jsfiddle.net/Rocka/d9vqn3ko/7/
[8]: https://github.com/Rocket1184/electron-netease-cloud-music
[9]: https://github.com/Rocket1184/electron-netease-cloud-music/blob/3f92f448ddb42de49fa403d3ee50da5220436869/src/renderer/App.vue#L57-L72