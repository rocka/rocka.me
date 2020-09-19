---
title: 调试并修复 Vue 2 应用的内存泄漏问题
date: Sat Sep 19 2020 15:39:20 GMT+0800 (CST)
tags:
  - 前端
---

其实这篇文章~~一~~ ~~两~~几个月前就该写出来了，甚至在调试问题的过程中就已经在构思文章的结构了。但由于~~懒~~某些原因，一直没有动~~键盘~~笔。几天间惊闻 Vue 3 已经 ~~RC~~ Release 了，再不写出来，恐怕就没有人会看了。~~写得再早也没有人会看的吧~~

## TL;DR

- 不要用 `<keep-alive>`
  - 如果一定要用，请给 Vue 打几个 patch （建议使用 [ds300/patch-package](https://github.com/ds300/patch-package) ，应用的 patch 参考[这里](https://github.com/Rocket1184/electron-netease-cloud-music/blob/d5686e846b4062b6ac9c802c272c7a32e45fc1ec/patches/README.md)）
- 每次 `addEventListener` 都要记得在适当的时候 `removeEventListener`
- 不要以为 `delete domElement.onXXX` 就可以移除 DOM 元素的 Event Listener ，要用 `domElement.onXXX = null`
- 不要在 Vue 的 Custom Directive 的 Hook Function 中引用 `vnode` （即[第三个参数](https://vuejs.org/v2/guide/custom-directive.html#Directive-Hook-Arguments)）

<!-- more -->

## 问题的出现

对于一个网页应用的内存泄漏，很多开发者都不是怎么在意。“什么？漏内存了？刷新一下页面不就好了？”，这样。但不巧的是，这是一个 [Electron 应用](https://github.com/Rocket1184/electron-netease-cloud-music)，没错，就是把网页套上一层马甲冒充桌面应用的那种。如果需要用户经常刷新页面来释放内存，绝对不能称为好的用户体验。~~虽然 Electron 本身就已经是很差的体验了~~。不过我自己倒是没受到过多大的影响，因为每天用完电脑之后都会关机，第二天又会回到没有泄漏内存的初始状态。直到我看到了[这个 Issue](https://github.com/Rocket1184/electron-netease-cloud-music/issues/78) 。

只是用了几天，就泄漏了 4G 的内存吗 ... 虽然以前也感觉会有内存泄漏，但没想到居然那么严重，有必要仔细分析一下了。跟着 [Chrome DevTools 团队的文章](https://developers.google.com/web/tools/chrome-devtools/memory-problems)，学习了一下 Memory Profiler 的用法，开始分析吧。

## Heap Snapshot

启动应用，打开开发者工具，然后把 console 清掉，不然已经记录的 log 内容会保持对象的引用，对后续定位内存泄漏点产生影响。切换到 Memory 面板，按下左上角的 “Take heap snapshot” 按钮，记录一下初始状态所用的内存。然后在页面上胡乱操作一通，再次清除 console 并记录 heap snapshot ，再操作，清 console ，再记录 ... 观察每次 snapshot 的大小，直到定位到稳定引发 snapshot 大小增加的特定操作。然后**关掉页面重新打开**，注意刷新是不行的， Chrome 并不会完全释放页面占用的所有内存，为了提高刷新页面时的加载速度，有些内容会保留到刷新页面之后，对 snapshot 造成影响。记录初始状态，紧接着重复刚刚找到的会引发 snapshot 大小增加的操作，再次记录 snapshot 。在左侧的列表中点击后生成的 snapshot ，然后再将上方工具栏中的 Summary 视图更改为 Comparison 视图，就得到了两次 snapshot 之间内存占用的比较结果。

![Heap Snapshot](https://rocka.me/static/img/Screenshot_20200919_091540.png)

经过若干次尝试后发现，每次打开歌单详情页面，并返回后， `VueComponent` 和 `Detached HTMLDivElement` 就会非常稳定地泄漏上几百个。而且歌单中的内容越多，泄漏的也越多。大概定位到了内存泄漏的位置，然后就该开始分析了。

### Retainers

将右侧列表中的 `VueComponent` 展开，选中其中的一个，查看它的 Retainers 信息。值得注意的是，在这个树形图中，层级结构是倒过来的，也就是说，越往上的元素，层级越低，子元素在上方，父元素在下方。

![Retainers](https://rocka.me/static/img/Screenshot_20200919_094755.png)

在这个 Retainers 图中，出现了一个奇怪的现象：有一个 parent-children-parent-children 循环。循环中最后一个 children 是一个 `<transition>` 组件，而它的 children 分别是 `<keep-alive>` 以及上文中被发现会导致内存泄漏的歌单详情组件。这些组件在应用中的层级如下（[App.vue on GitHub](https://github.com/Rocket1184/electron-netease-cloud-music/blob/d5686e846b4062b6ac9c802c272c7a32e45fc1ec/src/renderer/App.vue#L5-L9)）：

```html
<transition :name="transitionName">
    <keep-alive :include="KeepAlive">
        <router-view></router-view>
    </keep-alive>
</transition>
```

奇怪的是， `<keep-alive>` 的 include 列表中并没有包含歌单详情组件，那为什么该组件还是被保留在内存中了？在查看 `Detached HTMLDivElement` 的 Retainers 信息时发现，歌单详情的组件并没有被包含在 `<keep-alive>` 的 cache 中，但在 cache 中的组件又通过 parent-children-parent-children 的引用链条引用到了该 `<keep-alive>` 中在正常情况下并不会被 cache 住的组件。

![Retainers of Detached HTMLDivElement](https://rocka.me/static/img/Screenshot_20200919_094645.png)

只要正常保留在 cache 中的组件不被销毁，被引用的组件也不会被销毁。但不巧的是，这里被 cache 住的组件偏偏是应用的首页，无论用户怎么导航，最后肯定会回来的，所以就必须一直驻留在 cache 中。这也就导致了被引用的组件永远不会被销毁，只会随着用户的各种操作越积越多。

这绝对是 Vue 的 bug ，果然，经过一番搜索，找到了 [vuejs/vue#9842](https://github.com/vuejs/vue/issues/9842) ， Issue 中给出了详细的复现过程，与上面的情形几乎一致──然而并没有给出解决方案。但好在页面中有几个相关的 PR ，经过几次尝试，发现 [vuejs/vue#9962](https://github.com/vuejs/vue/pull/9962) 完美地解决了上述问题。好耶！

### Retained Size

──虽然很想这么说。应用 patch 之后，再次重复上述会出现内存泄漏的操作，内存泄漏的速度确实变慢了 ... 但从结果上来讲，还是在泄漏啊！于是只能再次开始漫无目地的寻找。终于，在某个 snapshot 的 Summary 视图中，按照 Retained Size 降序排列，找到了几个大的出奇的 `VueComponent` ：

![Big-O-Component](https://rocka.me/static/img/Screenshot_20200919_102309.png)

鼠标移动过去，展开详情一看，是先前为了提升列表滚动性能采用的 [RecycleScroller](https://github.com/Akryum/vue-virtual-scroller#recyclescroller) 组件 ... 去翻源码吧。结果翻了又翻，也没找到疑似内存泄漏点，而且 Issue 区也没有相关的 bug report ，一时陷入了僵局。

## `delete` won't delete

既然已经确定了问题出在 [RecycleScroller](https://github.com/Akryum/vue-virtual-scroller#recyclescroller) ，当然要想办法深挖到底。然后又去翻了它的依赖： [scrollparent](https://github.com/olahol/scrollparent.js) ， [vue-observe-visibility](https://github.com/Akryum/vue-observe-visibility) 以及 [vue-resize](https://github.com/Akryum/vue-resize) 。在 vue-resize 中，发现了一点可疑的地方（[ResizeObserver.vue on GitHub](https://github.com/Akryum/vue-resize/blob/2f6c0904fb0da5f4185e362383d8bfe9b66455d8/src/components/ResizeObserver.vue#L34-L41)）：

```js
removeResizeHandlers () {
    if (this._resizeObject && this._resizeObject.onload) {
        if (!isIE && this._resizeObject.contentDocument) {
            this._resizeObject.contentDocument.defaultView.removeEventListener('resize', this.compareAndNotify)
        }
        delete this._resizeObject.onload
    }
},
```

移除 onload 事件处理函数时，直接用了 `delete` 。而经过测试， `delete` 操作虽然返回了 `true` ，但真正的 onload 并没有被移除：

```console
> delete obj.onload
true
> obj.onload
ƒ load () { ... }
> obj.onload = null
null
> obj.onload
null
```

而且，其在组件的 `mounted` 钩子中创建并 append 到 DOM 树中的 `HTMLObjectElement` 也没有在 `beforeDestroy` 钩子中移除（[ResizeObserver.vue on GitHub](https://github.com/Akryum/vue-resize/blob/2f6c0904fb0da5f4185e362383d8bfe9b66455d8/src/components/ResizeObserver.vue#L50-L51)）。

于是，做如下的修改（已提交 PR [Akryum/vue-resize#62](https://github.com/Akryum/vue-resize/pull/62) 并已经被合并）：

```diff
                 if (!isIE && this._resizeObject.contentDocument) {
                     this._resizeObject.contentDocument.defaultView.removeEventListener('resize', this.compareAndNotify)
                 }
-                delete this._resizeObject.onload
+                this.$el.removeChild(this._resizeObject)
+                this._resizeObject.onload = null
+                this._resizeObject = null
             }
         },
     },
```

先将手动 append 的元素移除，然后用赋值 `null` 的方式正确移除 `onload` 。（手动）应用 patch 后，再重复上述会出现内存泄漏的操作── `VueComponent` 的 delta 变成 0 了！好耶，问题终于解决了！

![VueComponent: delta 0](https://rocka.me/static/img/Screenshot_20200919_111813.png)

──虽然很想这么说。但在这个版本发布几天后，又发现了更加严重的内存泄漏 ...

## 放在那不动，自己就开始漏内存！？

[这次的反馈](https://github.com/Rocket1184/electron-netease-cloud-music/issues/78#issuecomment-613497824)是，“在它自己切换歌曲时就会产生泄漏”。虽然这个问题更加神秘，但至少不用费心思去找能够复现内存泄漏的操作了。于是照常打开 Memory Profiler ，清除 console ，打 snapshot ，切歌，打 snapshot ... 经过一番尝试，发现了具体的内存泄漏点：每次按下界面上的播放或者切歌按钮，都会泄漏 3 个 `VueComponent` ；但并不一定是精确的 3 个，如果两次按下按钮时间间隔较长，就会多漏上几个：

![VueComponent: delta 6](https://rocka.me/static/img/Screenshot_20200919_140023.png)

![VueComponent: delta 10](https://rocka.me/static/img/Screenshot_20200919_140041.png)

通过这些没有被回收的 `VueComponent` 上的属性名，判断它是组件库 [Muse-UI 中的 `popup` mixin](https://github.com/museui/muse-ui/blob/03fe1e7b21205c05b9ffbc0c256a5ad6be00c4d9/src/internal/mixins/popup/index.js) 。

![properties on VueComponent](https://rocka.me/static/img/Screenshot_20200919_141054.png)

而这些组件的 Retainer ，是一个 `<transition>` 组件，由 [`createTransition`](https://github.com/museui/muse-ui/blob/03fe1e7b21/src/internal/transitions.js#L4) 动态创建，而且是函数式组件。

![popup's Retainer](https://rocka.me/static/img/Screenshot_20200919_140413.png)

然后我就非常想当然地，把函数式组件改写成了一般的组件（[rocka/muse-ui@`6777a89` on GitHub](https://github.com/rocka/muse-ui/commit/6777a8994354f7cbf8ca156d0e207b442325c125)）：

```diff
 function createTransition (name, mode) {
   return {
     name,
-    functional: true,
-    render (h, context) {
-      context.data = context.data || {};
-      context.data.props = { name, appear: true };
-      context.data.on = context.data.on || {};
-      if (!Object.isExtensible(context.data.on)) {
-        context.data.on = { ...context.data.on };
-      }
-
-      if (mode) context.data.props.mode = mode;
-
-      return h('transition', context.data, context.children);
+    render (h) {
+      return h('transition', {
+        props: { name, appear: true, ...this.$attrs },
+        on: this.$listeners
+      }, this.$slots.default);
     }
   };
 }
```

结果却出人意料地非常好？可喜可贺可喜可贺！

![VueComponent: delta 0, again!](https://rocka.me/static/img/Screenshot_20200919_142139.png)

## closure 害人

──虽然很想这么说就是了。定睛一看，虽然 `VueComponent` 不再增加了，但 `VNode` 却在以更加惊人的速度在增加，平均点击一下按钮要增加 20 个。继续对比这些多出来的 `VNode` ，却很难找到有什么共同点，除了它们都是那个被点击的按钮附近的一些组件。然后我尝试将按钮附近的那些组件一个一个注释掉，进而发现：当注释掉其中一个 `<mu-menu>` 组件时（[PlayerBar.vue on GitHub](https://github.com/Rocket1184/electron-netease-cloud-music/blob/4932823c9df2cc73149923fb9d43bc6bd8a8364c/src/renderer/components/PlayerBar/PlayerBar.vue#L65)）， `VNode` 的泄漏数量减少了近 40%；

![VNode: delta 24](https://rocka.me/static/img/Screenshot_20200919_143323.png)

而把两个 `<mu-menu>` 都注释掉，或者换成 `<div>` 的时候， `VNode` 泄漏消失了：

![VNode: delta 0](https://rocka.me/static/img/Screenshot_20200919_143508.png)

但是把组件改成 `<div>` ，就没法达成原有的功能了，但这次总算定位了泄漏点： Muse-UI 中的 [`<mu-menu>` 组件](https://github.com/museui/muse-ui/blob/03fe1e7b21/src/Menu/Menu.js)，它通过另一个 [`<mu-popover>` 组件](https://github.com/museui/muse-ui/blob/03fe1e7b21205c05b9ffbc0c256a5ad6be00c4d9/src/Popover/Popover.js)，间接使用了上文中提到过 `popup` mixin 。于是继续用排除法，保留两个 `<mu-menu>` 组件，用注释/替换组件为 `<div>` 等方法，终于定精确位到了问题所在点： `popup` mixin 中使用的 [`click-outside` directive](https://github.com/museui/muse-ui/blob/03fe1e7b21205c05b9ffbc0c256a5ad6be00c4d9/src/internal/directives/click-outside.js) 。

```js
bind (el, binding, vnode) {
  const documentHandler = function (e) {
    if (!vnode.context || el.contains(e.target)) return;
    if (binding.expression) {
      vnode.context[el[clickoutsideContext].methodName](e);
    } else {
      el[clickoutsideContext].bindingFn(e);
    }
  };
  el[clickoutsideContext] = {
    documentHandler,
    methodName: binding.expression,
    bindingFn: binding.value
  };
  setTimeout(() => {
    document.addEventListener('click', documentHandler);
  }, 0);
}
```

关于 custom directive 各个参数的说明，参考文档 [Custom Directives — Vue.js](https://vuejs.org/v2/guide/custom-directive.html#Directive-Hook-Arguments) 。这个 directive 的作用是，提供一个效果类似于“在组件外点击”的事件，比如用于弹出菜单，当用户点击菜单外部时，就调用传给 directive 的函数，触发关闭菜单的动作。所以要监听 `document` 的 click 事件，并判点击的位置是否在组件内部，即 `el.contains(e.target)` ，这么实现当然是很正常的。但问题在于，只要应用了 `click-outside` directive 的组件对应的元素在 DOM 中存在，作为 `document` click 事件 event listener 的 `documentHandler` 就不能被 GC ；而这个 `documentHandler` 正好引用了 `bind` hook 的第三个参数： `vnode` ，并读取了其 `context` 属性，这导致 `vnode` 也不能被 GC 。然后被这个 `vnode` 直接或间接引用的各种对象，也同样不能被 GC ... 而 vdom 的特性，决定了每次界面将变化时，都会产生很多 `VNode` ，这些 `VNode` 都将被一开始的 `vnode` 间接引用到，所以都不能被 GC 。

要解决这个问题，只要不在 `documentHandler` 访问 `vnode` 就行了。那为什么它需要访问 `vnode` 呢？是在尝试使用 `binding.expression` 作为方法名，调用 `vnode.context` 中的方法。而根据文档，`binding.value` 直接就是 directive 的绑定值了，如果绑定值是一个函数， Vue 还会帮你绑定好 `this` 。所以，做出以下改动（[rocka/muse-ui@`5695eae` on GitHub](https://github.com/rocka/muse-ui/commit/5695eaec7ea3de6d2a1bd99fbe679653d2d8f39d)）：

```diff
-  bind (el, binding, vnode) {
+  bind (el, binding) {
     const documentHandler = function (e) {
-      if (!vnode.context || el.contains(e.target)) return;
-      if (binding.expression) {
-        vnode.context[el[clickoutsideContext].methodName](e);
-      } else {
-        el[clickoutsideContext].bindingFn(e);
-      }
+      if (el.contains(e.target)) return;
+      el[clickoutsideContext].bindingFn(e);
     };
     el[clickoutsideContext] = {
       documentHandler,
-      methodName: binding.expression,
       bindingFn: binding.value
     };
```

至此，无论进行什么操作， `VueComponent` 和 `VNode` 的 delta 都稳定在了 0 ，问题终于圆满解决：

![delta zero!](https://rocka.me/static/img/Screenshot_20200919_151912.png)

---

## 后记

1. 在 GitHub 上围观 debug 全过程： [Rocket1184/electron-netease-cloud-music#78](https://github.com/Rocket1184/electron-netease-cloud-music/issues/78)

1. 文中的所有截图，都**不**是调试问题时的截图，而是写这篇文章时，根据当时的场景还原出来的。如有错漏之处，请务必在评论区指出。

1. 实际发现并分析/解决问题的过程比文章更加曲折离奇。文中的一个转折，可能在现实中就要耗费几天。感谢 Telegram 群里的大爷们，看我吐槽内存泄漏问题，并帮我分析。

1. 文中故意写了很多次 **清除 console** ，因为真的很重要。在先前的很多次尝试中，发现组件虽然被销毁了，但其数据并没有被回收，后来才意识到这些数据的 Retainer 都是 DevTools console ，白白浪费了时间。

1. [Muse-UI](https://github.com/museui/muse-ui) 已经很久无人维护了，之前为了修复 Material Ripple 点击特效失效的问题，就 fork 了一份自己维护。所以文中有关 Muse-UI 的修复就直接链接到 [fork 的仓库](https://github.com/rocka/muse-ui)了。也可以直接使用 npm 安装 [@rocka/muse-ui](https://www.npmjs.com/package/@rocka/muse-ui) 进行使用。

1. Vue 3 已经发布了，~~是时候自己造一套组件库了~~ 这篇文章还是来得太迟了 ...

1. 我从短暂的调试过程中学到一件事，越写前端，就越会发现前端框架的能力是有极限的 ... ... ~~我不做前端了！~~
