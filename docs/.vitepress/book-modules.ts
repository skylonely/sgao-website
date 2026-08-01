export interface BookChapter {
  text: string;
  link: string;
  description: string;
}

export interface BookSection {
  text: string;
  items: BookChapter[];
}

export interface BookModule {
  id: string;
  title: string;
  icon: string;
  base: string;
  kicker: string;
  summary: string;
  audience: {
    title: string;
    description: string;
  };
  outcome: {
    title: string;
    description: string;
  };
  sections: BookSection[];
  appendices?: Array<Pick<BookChapter, "text" | "link">>;
}

export const gitBook: BookModule = {
  id: "git",
  title: "Git 完整专栏",
  icon: "📘",
  base: "/git/",
  kicker: "BOOK MODULE · 01",
  summary:
    "从 Git 的设计思想出发，系统掌握工作原理、底层数据结构、常用命令、团队协作、GitHub、CI/CD、事故恢复与 AI Coding。",
  audience: {
    title: "从初学者到团队负责人",
    description:
      "适合第一次系统学习 Git 的开发者、希望补齐底层原理与团队规范的工程师，以及正在使用 ChatGPT、Codex 等 AI 工具进行开发的人。",
  },
  outcome: {
    title: "从会使用，到会理解、会设计",
    description:
      "不仅掌握日常命令，还能理解 Git 的底层模型，为项目选择工作流，处理常见事故，并设计稳定的代码评审与自动化交付流程。",
  },
  sections: [
    {
      text: "第一部分 · 建立认知",
      items: [
        {
          text: "01 Git 为什么会诞生",
          link: "/git/chapters/01-why-git",
          description: "从版本混乱、集中式管理到分布式版本控制。",
        },
        {
          text: "02 Git 到底是什么",
          link: "/git/chapters/02-what-is-git",
          description: "理解快照数据库、对象库与引用系统。",
        },
      ],
    },
    {
      text: "第二部分 · 理解原理",
      items: [
        {
          text: "03 Git 工作原理",
          link: "/git/chapters/03-how-git-works",
          description: "掌握工作区、暂存区、本地仓库与远程仓库。",
        },
        {
          text: "04 Git 内部原理",
          link: "/git/chapters/04-git-internals",
          description: "深入 Blob、Tree、Commit、Tag 与对象数据库。",
        },
      ],
    },
    {
      text: "第三部分 · 日常开发",
      items: [
        {
          text: "05 常用命令实战",
          link: "/git/chapters/05-essential-commands",
          description: "覆盖初始化、提交、查看、恢复与远程同步。",
        },
        {
          text: "06 Branch 分支",
          link: "/git/chapters/06-branches",
          description: "理解轻量分支、HEAD 与企业分支管理。",
        },
        {
          text: "07 Merge 与 Rebase",
          link: "/git/chapters/07-merge-and-rebase",
          description: "掌握合并策略、冲突处理与历史管理。",
        },
      ],
    },
    {
      text: "第四部分 · 团队协作",
      items: [
        {
          text: "08 Git 工作流",
          link: "/git/chapters/08-git-workflows",
          description: "比较 Git Flow、GitHub Flow 与主干开发。",
        },
        {
          text: "09 GitHub 协作平台",
          link: "/git/chapters/09-github-collaboration",
          description: "串联仓库、Issue、PR、Release 与 Pages。",
        },
        {
          text: "10 GitHub Actions",
          link: "/git/chapters/10-github-actions",
          description: "用 Workflow、Job 和 Runner 构建 CI/CD。",
        },
      ],
    },
    {
      text: "第五部分 · 进阶实践",
      items: [
        {
          text: "11 事故恢复",
          link: "/git/chapters/11-recovery",
          description: "使用 restore、revert、reflog 等工具安全恢复。",
        },
        {
          text: "12 AI 时代最佳实践",
          link: "/git/chapters/12-ai-workflow",
          description: "建立从需求、编码到自动化上线的完整流程。",
        },
      ],
    },
  ],
  appendices: [
    {
      text: "附录 · GitHub 2026 快速指南",
      link: "/git/github-complete-guide",
    },
  ],
};

export const systemArchitectBook: BookModule = {
  id: "systemArchitect",
  title: "系统架构设计师",
  icon: "🏗️",
  base: "/ruankao/system-architect/",
  kicker: "BOOK MODULE · 02",
  summary:
    "面向软考系统架构设计师的体系化知识专题，从考试重点出发，结合工程实践、架构思维与 AI 辅助学习方法持续建设。",
  audience: {
    title: "备考系统架构设计师的学习者",
    description:
      "适合准备软考系统架构设计师考试的开发者、技术负责人和架构方向学习者，也适合希望系统补齐计算机基础与架构知识的人。",
  },
  outcome: {
    title: "建立考试与工程相结合的知识体系",
    description:
      "理解高频考点背后的工作原理，能够完成知识梳理、真题复习和综合练习，并把基础知识迁移到真实系统设计中。",
  },
  sections: [
    {
      text: "第一章 · 计算机硬件",
      items: [
        {
          text: "01 第一章导读",
          link: "/ruankao/system-architect/chapters/01-computer-hardware",
          description: "了解本章定位、知识地图、考情与推荐学习路线。",
        },
        {
          text: "02 计算机组成",
          link: "/ruankao/system-architect/chapters/02-computer-organization",
          description: "掌握计算机五大组成部分及其数据流转方式。",
        },
        {
          text: "03 CPU",
          link: "/ruankao/system-architect/chapters/03-cpu",
          description: "理解 CPU 的功能、结构、寄存器与执行过程。",
        },
        {
          text: "04 校验码",
          link: "/ruankao/system-architect/chapters/04-checksum",
          description: "学习码距、奇偶校验与 CRC 的基本原理。",
        },
        {
          text: "05 指令系统",
          link: "/ruankao/system-architect/chapters/05-instruction-system",
          description: "掌握指令格式、执行过程与常见寻址方式。",
        },
        {
          text: "06 存储系统",
          link: "/ruankao/system-architect/chapters/06-storage-system",
          description: "理解存储层次、Cache 与局部性原理。",
        },
        {
          text: "07 输入输出技术",
          link: "/ruankao/system-architect/chapters/07-io",
          description: "比较程序控制、中断和 DMA 三种传输方式。",
        },
        {
          text: "08 总线",
          link: "/ruankao/system-architect/chapters/08-bus",
          description: "区分数据总线、地址总线和控制总线。",
        },
        {
          text: "09 历年真题",
          link: "/ruankao/system-architect/chapters/09-past-exams",
          description: "按知识点复习原资料中的历年真题。",
        },
        {
          text: "10 综合练习",
          link: "/ruankao/system-architect/chapters/10-exercises",
          description: "通过选择题、判断题和思考题巩固知识。",
        },
        {
          text: "11 第一章总结",
          link: "/ruankao/system-architect/chapters/11-summary",
          description: "集中回顾核心知识、高频考点与易错点。",
        },
      ],
    },
    {
      text: "第二章 · 操作系统",
      items: [
        {
          text: "01 第二章导读",
          link: "/ruankao/system-architect/chapters/chapter-02/01-operating-system",
          description: "了解操作系统知识框架、学习目标与推荐路线。",
        },
        {
          text: "02 操作系统概述",
          link: "/ruankao/system-architect/chapters/chapter-02/02-os-overview",
          description: "掌握操作系统的作用、特征、功能与常见分类。",
        },
        {
          text: "03 进程组成与状态",
          link: "/ruankao/system-architect/chapters/chapter-02/03-process-state",
          description: "理解进程、PCB 以及三状态和五状态模型。",
        },
        {
          text: "04 前趋图与资源图",
          link: "/ruankao/system-architect/chapters/chapter-02/04-precedence-graph",
          description: "分析任务依赖、并发关系与执行顺序。",
        },
        {
          text: "05 进程同步与 PV 操作",
          link: "/ruankao/system-architect/chapters/chapter-02/05-process-sync",
          description: "掌握同步、互斥、信号量及 PV 操作。",
        },
        {
          text: "06 进程调度",
          link: "/ruankao/system-architect/chapters/chapter-02/06-process-scheduling",
          description: "比较常见调度算法并理解核心评价指标。",
        },
        {
          text: "07 死锁",
          link: "/ruankao/system-architect/chapters/chapter-02/07-deadlock",
          description: "理解死锁条件、处理策略和资源分配图。",
        },
        {
          text: "08 存储管理",
          link: "/ruankao/system-architect/chapters/chapter-02/08-memory-management",
          description: "学习分页、分段、段页式与地址转换。",
        },
        {
          text: "09 页面置换算法",
          link: "/ruankao/system-architect/chapters/chapter-02/09-page-replacement",
          description: "掌握 OPT、FIFO、LRU、LFU 及缺页分析。",
        },
        {
          text: "10 设备管理",
          link: "/ruankao/system-architect/chapters/chapter-02/10-device-management",
          description: "理解 I/O 控制、DMA、缓冲与 Spooling。",
        },
        {
          text: "11 文件管理",
          link: "/ruankao/system-architect/chapters/chapter-02/11-file-management",
          description: "掌握目录、文件分配、访问方式与保护机制。",
        },
        {
          text: "12 本章练习",
          link: "/ruankao/system-architect/chapters/chapter-02/12-exercises",
          description: "围绕第二章核心考点进行系统自测。",
        },
        {
          text: "13 第二章总结",
          link: "/ruankao/system-architect/chapters/chapter-02/13-summary",
          description: "回顾知识框架、高频考点与复习路线。",
        },
      ],
    },
    {
      text: "第三章 · 数据库系统",
      items: [
        {
          text: "01 第三章导读",
          link: "/ruankao/system-architect/chapters/chapter-03/01-database-system",
          description: "了解数据库系统知识框架、学习目标与推荐路线。",
        },
        {
          text: "02 数据库系统概述",
          link: "/ruankao/system-architect/chapters/chapter-03/02-database-overview",
          description: "区分数据、数据库、DBMS 与数据库系统。",
        },
        {
          text: "03 三级模式两级映像",
          link: "/ruankao/system-architect/chapters/chapter-03/03-three-schema",
          description: "理解数据库抽象层次和两类数据独立性。",
        },
        {
          text: "04 数据库设计",
          link: "/ruankao/system-architect/chapters/chapter-03/04-database-design",
          description: "掌握数据库设计六个阶段与 E-R 图设计。",
        },
        {
          text: "05 数据模型",
          link: "/ruankao/system-architect/chapters/chapter-03/05-data-model",
          description: "学习数据模型、E-R 模型及关系模型转换。",
        },
        {
          text: "06 关系代数",
          link: "/ruankao/system-architect/chapters/chapter-03/06-relational-algebra",
          description: "掌握集合运算、投影、选择与自然连接。",
        },
        {
          text: "07 函数依赖",
          link: "/ruankao/system-architect/chapters/chapter-03/07-functional-dependency",
          description: "理解部分依赖、传递依赖与 Armstrong 公理。",
        },
        {
          text: "08 键与约束",
          link: "/ruankao/system-architect/chapters/chapter-03/08-keys-and-constraints",
          description: "区分各类键并掌握完整性约束。",
        },
        {
          text: "09 规范化",
          link: "/ruankao/system-architect/chapters/chapter-03/09-normalization",
          description: "掌握 1NF、2NF、3NF 和 BCNF 的判定。",
        },
        {
          text: "10 模式分解",
          link: "/ruankao/system-architect/chapters/chapter-03/10-schema-decomposition",
          description: "理解无损连接、函数依赖保持与属性闭包。",
        },
        {
          text: "11 并发控制",
          link: "/ruankao/system-architect/chapters/chapter-03/11-concurrency-control",
          description: "学习事务、ACID 特性和典型并发问题。",
        },
        {
          text: "12 封锁协议",
          link: "/ruankao/system-architect/chapters/chapter-03/12-lock-protocol",
          description: "比较三级封锁协议及其解决的并发问题。",
        },
        {
          text: "13 SQL",
          link: "/ruankao/system-architect/chapters/chapter-03/13-sql",
          description: "掌握 SQL 分类、常用查询与连接操作。",
        },
        {
          text: "14 新型数据库",
          link: "/ruankao/system-architect/chapters/chapter-03/14-new-database",
          description: "了解 NoSQL 类型、特点与典型应用场景。",
        },
        {
          text: "15 章节练习",
          link: "/ruankao/system-architect/chapters/chapter-03/15-exercises",
          description: "通过选择题和综合分析题巩固核心知识。",
        },
        {
          text: "16 历年真题复习",
          link: "/ruankao/system-architect/chapters/chapter-03/16-past-exams",
          description: "整理高频题型、复习清单与答题模板。",
        },
        {
          text: "17 第三章总结",
          link: "/ruankao/system-architect/chapters/chapter-03/17-summary",
          description: "回顾知识体系、高频考点和学习路线。",
        },
      ],
    },
    {
      text: "第四章 · 嵌入式技术",
      items: [
        {
          text: "01 第四章导读",
          link: "/ruankao/system-architect/chapters/chapter-04/01-embedded-technology",
          description: "了解嵌入式技术知识框架、学习目标与推荐路线。",
        },
        {
          text: "02 微处理器体系结构",
          link: "/ruankao/system-architect/chapters/chapter-04/02-microprocessor-architecture",
          description: "比较冯·诺依曼结构与哈佛结构。",
        },
        {
          text: "03 微处理器分类",
          link: "/ruankao/system-architect/chapters/chapter-04/03-microprocessor-classification",
          description: "区分 MCU、MPU、DSP 与 SoC 的特点和用途。",
        },
        {
          text: "04 多核处理器",
          link: "/ruankao/system-architect/chapters/chapter-04/04-multi-core-processor",
          description: "理解 SMP、AMP 与多核任务调度。",
        },
        {
          text: "05 嵌入式软件",
          link: "/ruankao/system-architect/chapters/chapter-04/05-embedded-software",
          description: "掌握 BSP、BootLoader 与设备驱动的职责。",
        },
        {
          text: "06 嵌入式系统",
          link: "/ruankao/system-architect/chapters/chapter-04/06-embedded-system",
          description: "学习系统组成、特点与层次结构。",
        },
        {
          text: "07 实时操作系统",
          link: "/ruankao/system-architect/chapters/chapter-04/07-real-time-operating-system",
          description: "理解 EOS、RTOS、硬实时与软实时。",
        },
        {
          text: "08 嵌入式软件设计",
          link: "/ruankao/system-architect/chapters/chapter-04/08-embedded-software-design",
          description: "掌握交叉开发、交叉编译和交叉调试。",
        },
        {
          text: "09 软件开发工具",
          link: "/ruankao/system-architect/chapters/chapter-04/09-development-tools",
          description: "区分编辑器、GCC、GDB 与 JTAG 的作用。",
        },
        {
          text: "10 章节练习",
          link: "/ruankao/system-architect/chapters/chapter-04/10-exercises",
          description: "通过选择题、判断题和简答题巩固知识。",
        },
        {
          text: "11 历年真题复习",
          link: "/ruankao/system-architect/chapters/chapter-04/11-past-exams",
          description: "整理高频考点、典型题型和考前速记。",
        },
        {
          text: "12 第四章总结",
          link: "/ruankao/system-architect/chapters/chapter-04/12-summary",
          description: "回顾知识体系、易错点与复习路线。",
        },
      ],
    },
    {
      text: "第五章 · 计算机网络",
      items: [
        {
          text: "01 第五章导读",
          link: "/ruankao/system-architect/chapters/chapter-05/01-computer-network",
          description: "了解计算机网络知识框架、高频考点与推荐学习路线。",
        },
        {
          text: "02 网络功能与分类",
          link: "/ruankao/system-architect/chapters/chapter-05/02-network-overview",
          description: "掌握网络功能、性能指标、分类方式与拓扑结构。",
        },
        {
          text: "03 通信技术",
          link: "/ruankao/system-architect/chapters/chapter-05/03-communication-technology",
          description: "理解信道、信号处理、复用技术、多址技术与 5G。",
        },
        {
          text: "04 OSI 七层模型",
          link: "/ruankao/system-architect/chapters/chapter-05/04-osi-model",
          description: "掌握 OSI 各层功能、典型协议与网络设备。",
        },
        {
          text: "05 TCP/IP 协议族",
          link: "/ruankao/system-architect/chapters/chapter-05/05-tcp-ip",
          description: "学习 TCP/IP 四层模型及常见网络协议。",
        },
        {
          text: "06 网络设备",
          link: "/ruankao/system-architect/chapters/chapter-05/06-network-devices",
          description: "区分集线器、网桥、交换机、路由器与网关。",
        },
        {
          text: "07 路由技术",
          link: "/ruankao/system-architect/chapters/chapter-05/07-routing",
          description: "理解路由器、MTU、IGP 与 EGP。",
        },
        {
          text: "08 传输介质",
          link: "/ruankao/system-architect/chapters/chapter-05/08-transmission-media",
          description: "比较双绞线、同轴电缆、光纤与无线介质。",
        },
        {
          text: "09 通信与交换方式",
          link: "/ruankao/system-architect/chapters/chapter-05/09-communication-switching",
          description: "区分单工、半双工、全双工及常见交换方式。",
        },
        {
          text: "10 IP 地址",
          link: "/ruankao/system-architect/chapters/chapter-05/10-ip-address",
          description: "掌握 IPv4 分类、子网掩码与 CIDR。",
        },
        {
          text: "11 IPv6",
          link: "/ruankao/system-architect/chapters/chapter-05/11-ipv6",
          description: "理解 IPv6 地址表示、特点及与 IPv4 的区别。",
        },
        {
          text: "12 网络规划与设计",
          link: "/ruankao/system-architect/chapters/chapter-05/12-network-planning",
          description: "学习网络规划原则、设计流程与核心内容。",
        },
        {
          text: "13 网络存储",
          link: "/ruankao/system-architect/chapters/chapter-05/13-network-storage",
          description: "比较 NAS 与 SAN 的访问方式和应用特点。",
        },
        {
          text: "14 章节练习",
          link: "/ruankao/system-architect/chapters/chapter-05/14-exercises",
          description: "通过选择题、判断题和简答题巩固知识。",
        },
        {
          text: "15 历年真题复习",
          link: "/ruankao/system-architect/chapters/chapter-05/15-past-exams",
          description: "整理高频考点、典型题型与考前速记。",
        },
        {
          text: "16 第五章总结",
          link: "/ruankao/system-architect/chapters/chapter-05/16-summary",
          description: "回顾知识体系、易错点与复习路线。",
        },
      ],
    },
    {
      text: "第六章 · 其他计算机系统基础知识",
      items: [
        {
          text: "01 第六章导读",
          link: "/ruankao/system-architect/chapters/chapter-06/01-other-computer-systems",
          description: "了解本章知识范围、学习目标与章节目录。",
        },
        {
          text: "02 计算机语言",
          link: "/ruankao/system-architect/chapters/chapter-06/02-computer-language",
          description: "掌握机器语言、汇编语言、高级语言与指令地址码。",
        },
        {
          text: "03 多媒体",
          link: "/ruankao/system-architect/chapters/chapter-06/03-multimedia",
          description: "理解媒体分类、多媒体系统组成与压缩技术。",
        },
        {
          text: "04 VR 与 AR",
          link: "/ruankao/system-architect/chapters/chapter-06/04-vr-ar",
          description: "区分虚拟现实、增强现实及其典型分类。",
        },
        {
          text: "05 系统工程",
          link: "/ruankao/system-architect/chapters/chapter-06/05-system-engineering",
          description: "掌握霍尔三维结构、生命周期与系统工程方法。",
        },
        {
          text: "06 MBSE",
          link: "/ruankao/system-architect/chapters/chapter-06/06-mbse",
          description: "理解基于模型的系统工程及需求、行为、结构模型。",
        },
        {
          text: "07 章节练习",
          link: "/ruankao/system-architect/chapters/chapter-06/07-exercises",
          description: "通过练习题巩固计算机语言、多媒体与系统工程知识。",
        },
        {
          text: "08 历年真题复习",
          link: "/ruankao/system-architect/chapters/chapter-06/08-past-exams",
          description: "整理系统工程相关高频题型与答案。",
        },
        {
          text: "09 第六章总结",
          link: "/ruankao/system-architect/chapters/chapter-06/09-summary",
          description: "回顾本章必背知识、重点方法与复习建议。",
        },
      ],
    },
    {
      text: "第七章 · 系统配置与性能评价",
      items: [
        {
          text: "01 第七章导读",
          link: "/ruankao/system-architect/chapters/chapter-07/01-system-config-performance",
          description: "了解系统配置与性能评价的知识范围和章节目录。",
        },
        {
          text: "02 性能指标",
          link: "/ruankao/system-architect/chapters/chapter-07/02-performance-index",
          description: "掌握计算机、网络设备、操作系统和数据库的性能指标。",
        },
        {
          text: "03 性能评价方法",
          link: "/ruankao/system-architect/chapters/chapter-07/03-performance-evaluation",
          description: "理解时钟频率、KIPS、MIPS、PDR 等评价方法。",
        },
        {
          text: "04 Benchmark 基准测试",
          link: "/ruankao/system-architect/chapters/chapter-07/04-benchmark",
          description: "区分整数、浮点、SPEC 与 TPC 基准测试。",
        },
        {
          text: "05 阿姆达尔定律",
          link: "/ruankao/system-architect/chapters/chapter-07/05-amdahl-law",
          description: "掌握加速比公式并完成典型性能计算。",
        },
        {
          text: "06 章节练习",
          link: "/ruankao/system-architect/chapters/chapter-07/06-exercises",
          description: "通过练习题巩固性能指标、基准测试和定律计算。",
        },
        {
          text: "07 历年真题复习",
          link: "/ruankao/system-architect/chapters/chapter-07/07-past-exams",
          description: "整理性能评价高频考点与经典计算题。",
        },
        {
          text: "08 第七章总结",
          link: "/ruankao/system-architect/chapters/chapter-07/08-summary",
          description: "回顾 RASIS、PDR、Benchmark 与阿姆达尔定律。",
        },
      ],
    },
    {
      text: "第八章 · 信息系统基础知识",
      items: [
        {
          text: "01 第八章导读",
          link: "/ruankao/system-architect/chapters/chapter-08/01-information-system",
          description: "了解信息系统基础知识的范围、重点与章节目录。",
        },
        {
          text: "02 信息系统概述",
          link: "/ruankao/system-architect/chapters/chapter-08/02-information-system-overview",
          description: "掌握信息系统组成、能力、生命周期与常见类型。",
        },
        {
          text: "03 信息系统开发方法",
          link: "/ruankao/system-architect/chapters/chapter-08/03-development-methods",
          description: "比较结构化开发、原型法、OO 与 SOA。",
        },
        {
          text: "04 五大信息系统",
          link: "/ruankao/system-architect/chapters/chapter-08/04-tps-mis-dss-es-oas",
          description: "区分 TPS、MIS、DSS、ES 与 OAS 的定位和作用。",
        },
        {
          text: "05 ERP",
          link: "/ruankao/system-architect/chapters/chapter-08/05-erp",
          description: "掌握 MRP、MRPⅡ、MPS、BOM 与 ERP 模块。",
        },
        {
          text: "06 信息系统架构",
          link: "/ruankao/system-architect/chapters/chapter-08/06-information-system-architecture",
          description: "理解企业信息化、电子政务模式与系统架构。",
        },
        {
          text: "07 信息化战略与战略规划",
          link: "/ruankao/system-architect/chapters/chapter-08/07-information-strategy",
          description: "掌握 BSP、CSF、SST、IE、VCA 与 SAM 方法。",
        },
        {
          text: "08 CRM",
          link: "/ruankao/system-architect/chapters/chapter-08/08-crm",
          description: "理解客户关系管理的目标、模块及系统关系。",
        },
        {
          text: "09 SCM",
          link: "/ruankao/system-architect/chapters/chapter-08/09-scm",
          description: "掌握供应链管理流程、特点及协同关系。",
        },
        {
          text: "10 企业应用集成",
          link: "/ruankao/system-architect/chapters/chapter-08/10-enterprise-application-integration",
          description: "学习 EAI 的六种集成方式及其与 SOA 的区别。",
        },
        {
          text: "11 电子商务",
          link: "/ruankao/system-architect/chapters/chapter-08/11-ecommerce",
          description: "区分 B2B、B2C、C2C 与 O2O 模式。",
        },
        {
          text: "12 章节练习",
          link: "/ruankao/system-architect/chapters/chapter-08/12-exercises",
          description: "通过综合练习巩固信息系统核心概念。",
        },
        {
          text: "13 历年真题复习",
          link: "/ruankao/system-architect/chapters/chapter-08/13-past-exams",
          description: "整理信息系统基础知识高频题型和考点。",
        },
        {
          text: "14 第八章总结",
          link: "/ruankao/system-architect/chapters/chapter-08/14-summary",
          description: "回顾信息系统、企业管理系统与电子商务知识体系。",
        },
      ],
    },
  ],
};

export const bookModules = {
  git: gitBook,
  systemArchitect: systemArchitectBook,
};

export function createBookSidebar(book: BookModule) {
  return [
    {
      text: `${book.icon} ${book.title}`,
      link: book.base,
      collapsed: false,
      items: [
        { text: "专栏导读", link: book.base },
        ...book.sections.map((section) => ({
          text: section.text,
          collapsed: false,
          items: section.items.map(({ text, link }) => ({ text, link })),
        })),
        ...(book.appendices?.length
          ? [
              {
                text: "附录",
                collapsed: true,
                items: book.appendices,
              },
            ]
          : []),
      ],
    },
  ];
}
