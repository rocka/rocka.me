---
title: 网易云音乐 EAPI 中 cache_key 参数分析
date: Wed Jan 29 2020 20:49:03 GMT+0800 (CST)
tags:
  - 逆向
---

最近又开始填[电子云音乐][1]的坑了。虽然新的网易云音乐客户端新的 `eapi` 已经被扒得差不多了，但有几个 API （`'/album/v3/detail'` 和 `'/artist/v3/detail'`）的 `cache_key` 参数仍然不知道是从哪里来的。虽然之前也尝试着“逆向”过几次，但每次基本都是 `apktool d ncm.apk` 之后对着满脸的 smali 就不知道如何下手了。但这次真的太想用这几个 API 了，只能强行面向 Google 逆向，没想到居然真的搞出来了 ... 幸好这部分都是用 Java 写的，如果像请求 body 加密那样是用 native lib 实现的那我肯定又抓瞎了。

这次选用的工具是 [bytecode-viewer][2] 。一开始想用 [smali2java][3] 来着，不过因为 AUR 没有现成的包，就算了（这到底是有多懒啊）。逆向所用的版本是网易云音乐 Android 4.3.1 ，Google Play 国区最后一个版本，很久以前在 ApkMirror 下载的，现在好像找不到了，但在[手机乐园][4]仍然可以下到历史版本。

用 bytecode-viewer 打开 apk 文件后，需要耗费一点时间进行处理。这时候可以设置一下反编译器，在顶部的菜单栏 View -> Pane 1/2/3 中选择。我为 Pane 1 选择了 JADX ，因为它生成的结果看起来可读性更强一些，然后为 Pane 2 选择了JD-GUI 。不过还是建议把这几个选项都试一下。更改设置后，已经打开的文件并不会被重新反编译，只有打开新的文件之后，才会应用新的反编译器设置。

![选择反编译器](https://rocka.me/static/img/Screenshot_20200129_212918.png)

> 文中的 Java 代码前都会标注使用的反编译器。反编译器的代码风格不同，缩进混乱，凑合着看吧 ...

随便打开 com/netease/cloudmusic 里面的一个文件（这里看的是 com/netease/cloudmusic/a/a/a.class ，因为全是 a 排在最前面），base64 糊了一脸：

```java
// JADX
mv.setId(jSONObject.getLong(a.auu.a.c("LAo=")));
mv.setName(jSONObject.optString(a.auu.a.c("Kw8OFw==")));
if (!jSONObject.isNull(a.auu.a.c("JBwXGwoEPSE="))) {
    mv.setArtistId(jSONObject.getLong(a.auu.a.c("JBwXGwoEPSE=")));
}
mv.setArtistName(jSONObject.optString(a.auu.a.c("JBwXGwoEOiQDBg==")));
if (!jSONObject.isNull(a.auu.a.c("JxwKFx80ETYN"))) {
    mv.setBriefDesc(jSONObject.getString(a.auu.a.c("JxwKFx80ETYN")));
}
if (!jSONObject.isNull(a.auu.a.c("JAIE"))) {
    mv.setAlg(jSONObject.getString(a.auu.a.c("JAIE")));
}
```

这些乱码又都被塞进了 a.auu.a.c() 里面，应该是个解码方法吧 ... 找到 a/aau/a.class ：

```java
// JADX
package a.auu;
// ... 省略 ...
public class a {
    // ...
    static final String key = "Encrypt";
    // ...
    public static String c(String str) {
        if (str == null) {
            return null;
        }
        try {
            byte[] decode = new a().decode(str, 0);
            int length = decode.length;
            int length2 = key.length();
            int i = 0;
            int i2 = 0;
            while (i2 < length) {
                if (i >= length2) {
                    i = 0;
                }
                decode[i2] = (byte) ((byte) (decode[i2] ^ key.charAt(i)));
                i2++;
                i++;
            }
            return new String(decode);
        } catch (Exception e) {
            return null;
        }
    }
    // ...
}
```

然后翻译到 JavaScript(Node.js) ：

```js
function a_auu_a_c(str) {
    const key = Buffer.from('Encrypt', 'utf8');
    const bytes = Buffer.from(str, 'base64');
    let i = 0, j = 0;
    while (j < bytes.length) {
        if (i >= key.length) {
            i = 0;
        }
        bytes[j] = bytes[j] ^ key[i];
        j++;
        i++;
    }
    return bytes.toString('utf8');
}
```

因为循环中的操作是异或，把 from 和 toString 的字符编码倒过来，可以得到编码方法：

```js
function a_auu_a_d(str) {
    const key = Buffer.from('Encrypt', 'utf8');
    const bytes = Buffer.from(str, 'utf8');
    let i = 0, j = 0;
    while (j < bytes.length) {
        if (i >= key.length) {
            i = 0;
        }
        bytes[j] = bytes[j] ^ key[i];
        j++;
        i++;
    }
    return bytes.toString('base64');
}
```

这样就可以知道 `cache_key` 的编码是 `Jg8AGhwvHyAX` 。然后搜索这个字符串：

![搜索字符串](https://rocka.me/static/img/Screenshot_20200129_215703.png)

找到了 com/netease/cloudmusic/a/a/a.class 这个文件。打开，再在文件中搜索字符串，一下子就找到了这个方法：

```java
// JADX
public Album a(long j, boolean z, Set<Long> set) {
    try {
        HashMap hashMap = new HashMap();
        hashMap.put(a.auu.a.c("IDER"), com.netease.cloudmusic.g.i.a.a() + ""); // e_r
        hashMap.put(a.auu.a.c("LAo="), j + ""); // id
        hashMap.put(a.auu.a.c("Jg8AGhwvHyAX"), com.netease.cloudmusic.g.i.a.a(hashMap)); // cache_key
        JSONObject d = com.netease.cloudmusic.g.a.a(!z ? a.auu.a.c("JAIBBxRfAnZBBxcNER0p") : a.auu.a.c("JAIBBxRfAnFBBxcNER0p")).a(hashMap).d(); // album/v3/detail
        int i = d.getInt(a.auu.a.c("JgEHFw==")); // code
        if (i == 200) {
            Album c = c(d.getJSONObject(a.auu.a.c("JAIBBxQ="))); // album
            c.setMusics(g(d.getJSONArray(a.auu.a.c("NgENFQo=")))); // songs
            if (set != null && !d.isNull(a.auu.a.c("NRwGIRwcGBYBDRUwFAc="))) { // preSellSongIds
                JSONArray jSONArray = d.getJSONArray(a.auu.a.c("NRwGIRwcGBYBDRUwFAc=")); // preSellSongIds
                for (int i2 = 0; i2 < jSONArray.length(); i2++) {
                    set.add(Long.valueOf(jSONArray.getLong(i2)));
                }
            }
            return c;
        } else if (i == 404 && !z) {
            return a(j, true);
        } else {
            k(i);
            return null;
        }
    } catch (JSONException e) {
        e.printStackTrace();
        throw new com.netease.cloudmusic.f.a(1);
    }
}
```

返回值的类型 `Album` 居然没有被混淆，这是不是有点太容易了 ... 稍有常识的人都能看出，先新建了一个 `HashMap`，键 e_r 的值设置为 g.i.a.a() ，键 id 的值设置为长整形 j ，键 cache_key 的值设置为 g.i.a.a(hashMap) 。那接下来就该去找这个 g.i.a.a 了，在 com/netease/cloudmusic/g/i/a.class 。这次 JADX 生成的代码的可读性不如 JD-GUI 。

```java
// JD-GUI
package com.netease.cloudmusic.g.i;
import com.netease.cloudmusic.utils.NeteaseMusicUtils;
// ...
public class a
{
  // ...
  public static String a(Map<String, String> paramMap)
  {
    if ((paramMap == null) || (paramMap.size() == 0)) {
      throw new IllegalArgumentException(a.auu.a.c("NQ8RExQDVCAcER0L")); // params error
    }
    ArrayList localArrayList = new ArrayList(paramMap.keySet());
    Collections.sort(localArrayList, new a.1());
    StringBuffer localStringBuffer = new StringBuffer();
    for (int i = 0; i < localArrayList.size(); i++)
    {
      localStringBuffer.append((String)localArrayList.get(i) + a.auu.a.c("eA==") + (String)paramMap.get(localArrayList.get(i))); // =
      if (i != localArrayList.size() - 1) {
        localStringBuffer.append(a.auu.a.c("Yw==")); // &
      }
    }
    return NeteaseMusicUtils.q(localStringBuffer.toString());
  }

  public static boolean a()
  {
    return true;
  }
}
```

无参数的重载就只是返回 true 而已。如果参数是 Map ，先取出所有的 key ，然后按照 `new a.1()` 进行排序，然后又塞进了一个 `q` 方法里面。

先看排序，打开 com/netease/cloudmusic/g/i/a$1.class 。这次 JADX 反编译的结果是乱码，JD-GUI 的结果为：

```java
// JD-GUI
package com.netease.cloudmusic.g.i;

import java.util.Comparator;

final class a$1
  implements Comparator<String>
{
  public int a(String paramString1, String paramString2)
  {
    return paramString1.codePointAt(0) - paramString2.codePointAt(0);
  }
}
```

原来就是按照第一个字母的字典序。接下来就是把每一组对应的键和值用 `=` 连起来，把每一组键值对用 `&` 连起来，基本就是 querystring 格式嘛。

再来看看那个 `q` 。找到 com/netease/cloudmusic/utils/NeteaseMusicUtils.class ，发现又用了 a.a(String, String)

```java
// JD-GUI
public static String q(String paramString)
{
  a(a.auu.a.c("CwkKHAEgF2UeAgAYHU5l"), paramString); // NginxPc param:
  paramString = Base64.encodeToString(a.a(paramString,a.auu.a.c("bEZSQR0RBRUuEAEOQAYhEA==")), 2); // )(13daqP@ssw0rd~
  a(a.auu.a.c("CwkKHAEgF2UFBgtDUA=="), paramString); // NginxPc key:
  return paramString;
}
```

解密一下 `a.a` 的第二个参数，得到 `)(13daqP@ssw0rd~` 。看来这一串 P@ssw0rd 就是应该是密钥了。继续找到 com/netease/cloudmusic/utils/a.class ：

```java
// JADX
package com.netease.cloudmusic.utils;
import javax.crypto.Cipher;
//...
public class a {
    // ...
    public static byte[] a(String str, String str2) {
        // a(querystring, key, null, "AES")
        return a(str, str2, null, a.auu.a.c("BCsw")); // AES
    }

    public static byte[] a(String str, String str2, String str3, String str4) {
        //                querystring, key,         null,        "AES"
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(b(str2), a.auu.a.c("BCsw")); // AES
            Cipher instance = Cipher.getInstance(str4);
            byte[] bytes = str.getBytes(a.auu.a.c("MBoFX0E=")); // utf-8
            if (str3 == null) {
                instance.init(1, secretKeySpec);
            } else {
                instance.init(1, secretKeySpec, new IvParameterSpec(str3.getBytes()));
            }
            return instance.doFinal(bytes);
        } catch (UnsupportedEncodingException | InvalidAlgorithmParameterException | InvalidKeyException | NoSuchAlgorithmException | BadPaddingException | IllegalBlockSizeException | NoSuchPaddingException e) {
            e.printStackTrace();
            return null;
        }
    }
    // ...
    private static byte[] b(String str) throws UnsupportedEncodingException {
        return str.getBytes(a.auu.a.c("MBoFX0E=")); // utf-8
    }
}

```

好像终于找到加密的部分了，但这个 AES 既写密钥长度，也没写 mode ... 哦不对，根据前面找到的 `)(13daqP@ssw0rd~` ，可以判断密钥位数是 128 位，那 mode 呢？

根据 [Oracle 的文档][5]，如果只提供 algorithm 而不提供 mode/padding ，会使用 provider 默认值，例如 `SunJCE` 的默认值是 ECB mode 和 PKCS5Padding 。

因为参数 str3 是 null ，所以也没有使用 IV ，看下来就是一个很朴实的 AES 加密了。而 [Node.js 也使用 PKCS padding][6] ，翻译成 JavaScript(Node.js) 也很直白：

```js
const crypto = require('crypto');
function a(str) {
    const cipher = crypto.createCipheriv('aes-128-ecb', ')(13daqP@ssw0rd~', null);
    return cipher.update(str, 'utf8') + cipher.final(); // returns Buffer
}
```

到这里， `cache_key` 就生成完毕了。梳理一下所有的步骤：

- 请求参数放置在 HashMap 中
- 所有参数按照 key 的第一个字母字典序排序，并连接成 query string
- 使用 aes-128-ecb 加密 query string
- base64 编码加密结果

用 JavaScript(Node.js) 完整实现：

```js
const crypto = require('crypto');
const qs = require('querystring');
/**
 * @param {Record<string, any>} params
 */
function getCacheKey(params) {
    const keys = Object.keys(params).sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
    /** @type {Record<string, string>} */
    const record = {};
    for (const k of keys) {
        record[k] = params[k];
    }
    const text = qs.stringify(record);
    const cipher = crypto.createCipheriv('aes-128-ecb', ')(13daqP@ssw0rd~', null);
    const key = cipher.update(text, 'utf8', 'base64') + cipher.final('base64');
    return key;
}
```

把生成的结果与之前抓包得到的几个 cache_key 做对比，完全一致：

```js
const body = {
    id: 35864444,
    e_r: true
};
console.log(getCacheKey(body));
/*
|    id    | cache_key
| 35864444 | BA06KMtT+Jm5DZSrXsuZ0jGEx2migzblBUw9lQhLRk8=
| 71853061 | A8n1QcV7AJngH5IqI6PCRh6+VMaxh6RGw+7gM294MTA=
*/
```

塞进[电子云音乐][1]里面运行，也能得到正确的响应：

![getAlbumDetailE](https://rocka.me/static/img/Screenshot_20200129_231528.png)

虽然只是一个很简单的，调用库函数进行的 AES 加密，但毕竟是我第一次成功的逆向尝试，搞出了一点有用的东西。上一张 bytecode-viewer 留作纪念：

![bytecode-viewer on KDE Plasma 5.17](https://rocka.me/static/img/Screenshot_20200129_231336.png)

---

## 参考

1. https://juejin.im/post/5ac10c51f265da23a229408d
2. https://juejin.im/post/5b1b6e4b6fb9a01e87569e96

[1]: https://github.com/Rocket1184/electron-netease-cloud-music
[2]: https://github.com/Konloch/bytecode-viewer
[3]: https://github.com/AlexeySoshin/smali2java
[4]: https://soft.shouji.com.cn/down/25231.html
[5]: https://docs.oracle.com/javase/7/docs/technotes/guides/security/crypto/CryptoSpec.html#transformation
[6]: https://stackoverflow.com/a/50701479/8370777
