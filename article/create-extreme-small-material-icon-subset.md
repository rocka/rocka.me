```meta
{
    "title": "制作极限压缩的 Material Icons 图标字体",
    "date": "Tue Apr 24 2018 23:31:40 GMT+0800 (CST)",
    "tags": [ "Linux", "前端" ]
}
```

> **UPDATE:** 写了一个傻傻的 [Python 脚本](https://github.com/rocka/melody-player/blob/6b21df84b79ec5780c17c56eff5812319fbb8fb9/font/create_font.py) 来自动处理字体，只要将所需要的图标名称每行一个写入 `icon-names.txt` ，就能一键生成压缩好的字体文件。(2018/04/26)

以下是原文。

---

这几天挖了 [新坑 MelodyPlayer](https://github.com/rocka/melody-player) ，其中有用到 Google 的 [Material Icons](http://google.github.io/material-design-icons/#icon-font-for-the-web) 。虽然它的 woff2 格式只有 42KB ，但我只用了其中的 10 个图标，加载整个字体文件显得很不划算。虽然 Material Icons 提供了制作 Sprite 的方案，但只有 SVG 或 CSS Sprite ，而的用法是 `<button>` 里写图标的名字，不能兼容。

而我又不愿意改代码，于是想寻找一种提取字体中特定字符的方法，肯定能大幅减文件小体积。

经过一番搜索，找到了 [`fonttools`](https://github.com/fonttools/fonttools) 这个强大的工具，可以精确控制字体文件的每一个 Glyph ，最大限度压缩字体。

`fonttool` is "A library to manipulate font files from Python." 。使用 `pip` 进行安装。顺便说一句，接下来的操作基于 Arch Linux ， Python 3.6.5 和 pip 9.0.1 .

```sh
pip install --user fonttools # 字体工具
pip install --user brotil    # 制作 woff2 格式所需
```

然后，将 `material-icons.woff` 下载到当前目录备用。

```sh
curl -L https://fonts.gstatic.com/s/materialicons/v36/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2 -o material-icons.woff
```

接下来就是喜闻乐见的教程环节了。步骤有些多，还请耐心观看。

## 1

解包 `material-icons.woff2` ：

```sh
ttx material-icons.woff2
```

输出：

```sh
Dumping "material-icons.woff2" to "material-icons.ttx"...
Dumping 'GlyphOrder' table...
Dumping 'head' table...
Dumping 'hhea' table...
Dumping 'maxp' table...
Dumping 'OS/2' table...
Dumping 'hmtx' table...
Dumping 'cmap' table...
Dumping 'cvt ' table...
Dumping 'loca' table...
Dumping 'glyf' table...
Dumping 'name' table...
Dumping 'post' table...
Dumping 'gasp' table...
Dumping 'GDEF' table...
Dumping 'GPOS' table...
Dumping 'GSUB' table...
```

得到 `material-icons.ttx` ，保留备用。

## 2

用文本编辑器打开 `material-icons.ttx` ，寻找需要的 Glyph Name ，这里最好按照字母序排列，方便后续的寻找。

Material Icons 通过 OpenType Ligature 进行字形替换，这里要找的就是它的 Ligature 部分。找到文件中的

```xpath
/GSUB/LookupList/Lookup/LigatureSubst
```

部分，使用文本编辑器的查找功能来寻找想要的字符。要查找的内容是：

```js
iconName.slice(1).split('').join(',').replace(/_/g, 'underscore')
```

比如，我要找 `play_arrow` 这个图标，要搜索 `l,a,y,underscore,a,r,r,o,w` ：

```xml
<Ligature components="l,a,y,underscore,a,r,r,o,w" glyph="uniE037"/>
```

然后记下它的 `glyph` 值，也就是字体中的 Glyph Name ，这里是 `uniE037` 。

我只用了 10 个图标，这个工作量还可以承受。

然后这是结果了：

|Glyph Name|Icon Name|
|-:|:-|
|uniE318|keyboard_capslock|
|uniE037|play_arrow|
|uniE034|pause|
|uniE041|repeat_one|
|uniE040|repeat|
|uniE5DA|subdirectory_arrow_right|
|uniE045|skip_previous|
|uniE044|skip_next|
|uniE043|shuffle|
|uniE047|stop|

存储为 `needed-glyph.txt` 备用。

## 3

这一步要把所需的 Glyph 提取出来，制作一个 Font Subset 。

```sh
pyftsubset material-icons.woff2 \
--gids=13-39 \
--glyphs=uniE045,uniE044,uniE037,uniE034,uniE047,uniE5DA,uniE041,uniE040,uniE043,uniE318 \
--layout-features-=liga \
--output-file=needed-glyph.ttf
```

下面对参数做一点说明：

`--gids=13-39` 包含 `_` 和 `a` 到 `z` 这 27 个字形的 Glyph ID 范围。上一步提到过， Material Icons 通过 Ligature 进行字形替换，没有这些基本字形， Ligature 不能正常工作。

`--glyphs=uniEooo,uniExxx` 第二步中找到的所有所需 Glyph Name ，逗号分隔。

`--layout-features-=liga` 在输出的字体文件中禁用 Font Ligature ，否则所有的 Glyph 都会被包含在输出文件中。但我们要在后面的步骤重新“启用”这个特性。

`--output-file=needed-glyph.ttf` 输出到文件 `needed-glyph.ttf` 。

更具体的参数说明，可以参见 `pyfontsubset --help` 。

## 4

将 `needed-glyph.ttf` 转换为 `ttx` 以便编辑。

```sh
ttx needed-glyph.ttf
```

输出：

```sh
Dumping "needed-glyph.ttf" to "needed-glyph.ttx"...
Dumping 'GlyphOrder' table...
Dumping 'head' table...
Dumping 'hhea' table...
Dumping 'maxp' table...
Dumping 'OS/2' table...
Dumping 'hmtx' table...
Dumping 'cmap' table...
Dumping 'cvt ' table...
Dumping 'loca' table...
Dumping 'glyf' table...
Dumping 'name' table...
Dumping 'post' table...
Dumping 'gasp' table...
Dumping 'GDEF' table...
Dumping 'GPOS' table...
Dumping 'GSUB' table...
```

得到 `needed-glyph.ttx` 。没什么好说的。

## 5

打开 `needed-glyph.ttx` ，找到它的 `/ttFont/GSUB` 元素，应该长这样：

```xml
<GSUB>
  <Version value="0x00010000"/>
  <ScriptList>
    <!-- ScriptCount=1 -->
    <ScriptRecord index="0">
      <ScriptTag value="latn"/>
      <Script>
        <!-- LangSysCount=0 -->
      </Script>
    </ScriptRecord>
  </ScriptList>
  <FeatureList>
    <!-- FeatureCount=0 -->
  </FeatureList>
  <LookupList>
    <!-- LookupCount=0 -->
  </LookupList>
</GSUB>
```

然后打开 `material-icons.ttx` 文件，也找到它的 `/ttFont/GSUB` 元素。复制其中的 `ScriptList` 和 `FeatureList` （下面的代码块部分） ，覆盖 `needed-glyph.ttx` 中对应的元素。

```xml
<ScriptList>
  <!-- ScriptCount=1 -->
  <ScriptRecord index="0">
  <ScriptTag value="latn"/>
  <Script>
    <DefaultLangSys>
    <ReqFeatureIndex value="65535"/>
    <!-- FeatureCount=1 -->
    <FeatureIndex index="0" value="0"/>
    </DefaultLangSys>
    <!-- LangSysCount=0 -->
  </Script>
  </ScriptRecord>
</ScriptList>
<FeatureList>
  <!-- FeatureCount=1 -->
  <FeatureRecord index="0">
  <FeatureTag value="liga"/>
  <Feature>
    <!-- LookupCount=1 -->
    <LookupListIndex index="0" value="0"/>
  </Feature>
  </FeatureRecord>
</FeatureList>
```

## 6

**关键步骤** ：将所需的 Font Ligature 信息写入。

在 `material-icons.ttx` 找到

```xpath
/ttFont/GSUB/LookupList/Lookup/LigatureSubst
```

它包含很多子元素，大概长这样：

```xml
<GSUB>
  <Version value="0x00010000"/>
  <!-- ... -->
  <LookupList>
    <!-- LookupCount=1 -->
    <Lookup index="0">
      <LookupType value="4"/>
      <LookupFlag value="0"/>
      <!-- SubTableCount=1 -->
      <LigatureSubst index="0" Format="1">
        <LigatureSet glyph="a">
          <!-- ... -->
          <Ligature components="d,b" glyph="uniE60E"/>
```

最内层的 `Ligature` 就是我们需要的。还记得第二步的 `needed-glyph.txt` 吗？找到所有对应的 `Ligature` 元素，复制到 `needed-glyph.ttx` 对应的位置，特别要注意保留 XML 的层级关系。

```xml
<LookupList>
  <!-- LookupCount=1 -->
  <Lookup index="0">
  <LookupType value="4"/>
  <LookupFlag value="0"/>
  <!-- SubTableCount=1 -->
  <LigatureSubst index="0" Format="1">
    <LigatureSet glyph="k">
      <Ligature components="e,y,b,o,a,r,d,underscore,c,a,p,s,l,o,c,k" glyph="uniE318"/>
    </LigatureSet>
    <LigatureSet glyph="p">
      <Ligature components="l,a,y,underscore,a,r,r,o,w" glyph="uniE037"/>
      <Ligature components="a,u,s,e" glyph="uniE034"/>
    </LigatureSet>
      <LigatureSet glyph="r">
      <Ligature components="e,p,e,a,t,underscore,o,n,e" glyph="uniE041"/>
      <Ligature components="e,p,e,a,t" glyph="uniE040"/>
    </LigatureSet>
      <LigatureSet glyph="s">
      <Ligature components="u,b,d,i,r,e,c,t,o,r,y,underscore,a,r,r,o,w,underscore,r,i,g,h,t" glyph="uniE5DA"/>
      <Ligature components="k,i,p,underscore,p,r,e,v,i,o,u,s" glyph="uniE045"/>
      <Ligature components="k,i,p,underscore,n,e,x,t" glyph="uniE044"/>
      <Ligature components="h,u,f,f,l,e" glyph="uniE043"/>
      <Ligature components="t,o,p" glyph="uniE047"/>
    </LigatureSet>
  </LigatureSubst>
  </Lookup>
</LookupList>
```

## 7

终于到了最激动人心的一步了，编译字体：

```sh
ttx --flavor woff2 -o ic.min.woff2 needed-glyph.ttx
```

一切正常的话，将会输出输出：

```sh
Compiling "needed-glyph.ttx" to "ic.min.woff2"...
Parsing 'GlyphOrder' table...
Parsing 'head' table...
Parsing 'hhea' table...
Parsing 'maxp' table...
Parsing 'OS/2' table...
Parsing 'hmtx' table...
Parsing 'cmap' table...
Parsing 'cvt ' table...
Parsing 'loca' table...
Parsing 'glyf' table...
Parsing 'name' table...
Parsing 'post' table...
Parsing 'gasp' table...
Parsing 'GDEF' table...
Parsing 'GPOS' table...
Parsing 'GSUB' table...
```

成功。来看一下文件大小

```sh
$ ls -lh ic.min.woff2
-rw-r--r-- 1 rocka rocka 968 Apr  24 14:42 ic.min.woff2
```

只有 968B 。然后转换成 Data URL ：

```sh
echo "data:font/woff2;charset=utf-8;base64,"$(base64 -w 0 ic.min.woff2)
```

测试一番吧：

<style>@font-face{font-family:MDIC;src:url(data:font/woff2;charset=utf-8;base64,d09GMgABAAAAAAPIAA8AAAAACigAAANxAAEEWgAAAAAAAAAAAAAAAAAAAAAAAAAAGhwbEByCVAZgAIIACAQRCAqHCIQFATYCJANOC04ABCAFgnwHIBtUBwieg02ZnZVGZpm0i1Nb0lxy/ZfEw/P36rmvc+IeoI114sKNAekaVJrmqchPNRMw/OF5fn947tOHJyIBbgoZbGmLeSt5Pv9zv/v2MfEkonGS98WUqFotQaWJJw7ZLRHiavB/4JjywNZgWYQDm1iWRVtVIEQU0Hg8mg1sYLsf9AB080bxv+bhHeusk0n6BwjoB0gUUUvUaacI9IqlAAG9GvSRIm/VI4wBeQhEUaXgEQYBwTAQfBI5IzXh2jhhtCk4NbScUsoShlIok8gZMcWpUy+UUGoIpVSpXJU6llKhjNMBjVqn4JjlRC4DNPDTr8SKLTin51esSgXNCpVyjHK50n2Xi1IhX6Bci0QsVBDFKrBSyD7G2CxQWPtvq1auiSdQweNJOK27WKrWiKtuKWMS8skiDokcsBNfoyXdFxLbBoAYBgDw7KZ5TwEJEAAwoxfaoQ0WoBfeaQILNL+XcQvG5TTjhrtS+9rw2vXa9zrwkfZ1LwTO8Cm887XnM4VNYSP3N/c79zn3KfcxOyrjAATQ9QP3nD1w9m0PuAC3IKFS2/BMoNKAYRKVTsouwBQqPfR9gBlUBvDMo56GZwHN+196i4roBUQeClgCDsEWfEAGgG6A6JiKULRUsUYFvIzRQeC50CMKbYBBF8nPcBdJhaGO1AVDS0gkseNTEGEkckQTSQQJZbaPmbAwHQi3kymRWLiuUNBlbGWd9YjjKJasuoim4hMSzfFRBceUSULfR4giopNKgMfa71EFs+vWCnz//r3RPP6yFWMsHUFH5/XoHZBUamLyUrbLmR0toqXa3b1vt+8HZcq3qSKj3/+Ul+4nvf4J9FMlejPsPeFScKVwHOP1CeBpxuvpiuefAmB+wnIpeI6O/qOyfGF/B54AgIBoP19g/9ZvYltbYZEClGfsI8B/0M0GIP4iA90UEEhAAoU4QQAAIsEIsD77sWQwxtgjjhBYUk0DCYJAQQ1Al3Mi0h6Ac2AIUecWoaSeENqhyUqjIqwaf8/i9PjXw8DIxUxFQckqz4ghwyY1WWFgoKAlU6XJGj2JGk2WaWnl2V8XW+hlMhYyZnYyUjW28KyJXYWnrfKXMNCzLE1SsNHimfWnYmu0mynIDhIOOLDJTOGFHDF5xKh+w/ov0U45frQWKt2RZ9jAjblL+b2H6vO0RIBZDiMAAAA=);} #mdic-demo{margin:1rem -0.83rem;padding:1rem;font:36px MDIC;font-weight: normal;font-style: normal;line-height: 1;text-transform: none;letter-spacing: normal;word-wrap: normal;white-space: nowrap;direction: ltr;font-feature-settings: 'liga' 1;color:#abb2bf;background:#282c34;display:flex;justify-content:space-around;flex-wrap:wrap;}</style><div id="mdic-demo"><span>skip_previous</span><span>skip_next</span><span>play_arrow</span><span>pause</span><span>stop</span><span>subdirectory_arrow_right</span><span>repeat_one</span><span>repeat</span><span>shuffle</span><span>keyboard_capslock</span></div>

嗯，效果很不错。这次的教程就到这里，感谢观看！
