# sgao-images 图片仓库使用说明

## 仓库地址

```
https://github.com/skylonely/sgao-images
```

所有图片统一存放于此仓库。

---

# 推荐目录结构

```
sgao-images

blog/
docs/
logo/
common/
cloudflare/
```

例如：

```
docs/

    workers.png

logo/

    logo.png

common/

    avatar.png
```

---

# 新增图片

直接上传即可。

例如：

```
docs/

worker.png
```

Git：

```bash
git add .

git commit -m "add image"

git push
```

无需重新部署 Worker。

---

# 图片访问

GitHub 原始地址：

```
https://raw.githubusercontent.com/skylonely/sgao-images/main/docs/worker.png
```

推荐使用：

```
https://img.sgao.cc/docs/worker.png
```

统一通过 img.sgao.cc 访问。

---

# Markdown 使用

推荐：

```md
![Cloudflare Worker](https://img.sgao.cc/docs/worker.png)
```

HTML：

```html
<img src="https://img.sgao.cc/logo/logo.png" />
```

CSS：

```css
background-image: url("https://img.sgao.cc/common/bg.png");
```

---

# 图片更新

如果替换图片内容：

```
logo.png
```

浏览器可能使用缓存。

可以：

```
logo.png?v=2
```

或者：

```
logo.png?20260728
```

进行缓存刷新。

---

# 注意事项

建议：

- 文件名全部小写
- 使用英文
- 使用短横线

例如：

```
cloudflare-worker.png
```

不要：

```
CloudFlare Worker 最终版.png
```

---

# 推荐规范

```
logo/

docs/

blog/

travel/

cloudflare/

apple/

mac/
```

方便长期维护。

---

# 最佳实践

统一使用：

```
https://img.sgao.cc/...
```

不要直接引用：

```
raw.githubusercontent.com
```

这样可以充分利用 Cloudflare Cache，提高访问速度，并保证后续图片迁移时无需修改文档。
