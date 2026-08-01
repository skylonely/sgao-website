---
description: 系统架构设计师知识库｜第七章 阿姆达尔定律
outline: deep
sidebar:
  label: 阿姆达尔定律
  order: 5
title: 第四节 阿姆达尔定律
---
# 第四节 阿姆达尔定律

## 公式

```
Speedup = 1 / ((1-a)+a/k)
```

其中：

- a：可优化部分比例
- k：优化倍数

## 示例

60% 可优化，提高到 5 倍：

```
Speedup = 1/(0.4+0.6/5)
         =1.923
```

## 下一节

[下一节：章节练习](./06-exercises)

