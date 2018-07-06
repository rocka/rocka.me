```meta
{
    "title": "使用命令行工具处理图片",
    "date": "Fri Jul 06 2018 19:53:32 GMT+0800 (China Standard Time)",
    "tags": [ "Linux" ]
}
```

用手机拍摄的照片将要在互联网上公开转播的时候，我通常会担心两点。第一，图片的 EXIF 信息会不会泄漏；第二，尺寸太大，传输速度不理想。虽然大部分服务商都会压缩图片，但如果不是自行处理一下的话还是会感觉怪怪的。但如果使用 Krita/GIMP 之类的工具，有些杀鸡焉用牛刀的感觉。所以简简单单的命令行工具就足够了。

## 删除图片的 EXIF 信息

这里用到的第一个命令行工具是 `exiv2` 。删除 EXIF ，只需要一条命令就够了：

```bash
exiv2 rm *.jpg
```

然后图片的 EXIF 信息就没了。

这个工具也提供 prpr 的功能，不过是用来打印 `pr(int)` EXIF，不是你们想象的那种：

```bash
exiv2 pr *.jpg
```

输出的格式像这样

```yaml
File name       : IMG_1.jpg
File size       : 3442224 Bytes
MIME type       : image/jpeg
Image size      : 4032 x 3016
Camera make     : Sony
Camera model    : 就不告诉你
Image timestamp : 2018:02:30 23:33:33
Image number    :
Exposure time   : 1/2333 s
Aperture        : F1.8
Exposure bias   :
Flash           : No, compulsory
Flash bias      :
Focal length    : 3.8 mm (35 mm equivalent: 27.0 mm)
Subject distance:
ISO speed       : 233
Exposure mode   : Not defined
Metering mode   : Center weighted average
Macro mode      :
Image quality   :
Exif Resolution : 2333 x 6666
White balance   : Auto
Thumbnail       : None
Copyright       :
Exif comment    :
```

~~上面的信息都是我编的~~

## 调整图片大小

这一步可以使用 `imagemagick` ，用到的命令是 `convert` 。

```bash
convert source.jpg -resize $WIDTHx$HEIGHT output.jpg
```

其中 `$WIDTH` 或者 `$HEIGHT` 可以省略一个，但是中间的 `x` 不要省略，这样可以在缩放的同时保持宽高比。

---

这就完了？好像有点太水了 ... 那就再加一个 svg 转 png 好了 ..

## 将 SVG 转换为指定分辨率的 PNG

这次要用的的是 `inkscape` ，但只用 Command Line ：

```bash
inkscape --without-gui --export-png $OUTPUT.png --export-width $WIDTH --export-height $HIGHT $SOURCE.svg
```

完工。然后命令行参数可以简写， `$WIDTH` 和 `$HEIGHT` 其中的一个也可以省略：

```bash
inkscape -e $OUTPUT.png -w $SIZE icon.svg
```

就是这么简单。

~~反正这就是一篇大水文，不服你来打我啊 2333~~

![珈百璃趴桌.webp](https://rocka.me/static/img/%E7%8F%88%E7%99%BE%E7%92%83%E8%B6%B4%E6%A1%8C.webp)
