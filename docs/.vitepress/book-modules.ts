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
    {
      text: "第九章 · 系统安全",
      items: [
        {
          text: "01 第九章导读",
          link: "/ruankao/system-architect/chapters/chapter-09/01-system-security",
          description: "了解信息安全、密码技术、网络攻击与安全协议的知识地图。",
        },
        {
          text: "02 信息安全基础",
          link: "/ruankao/system-architect/chapters/chapter-09/02-information-security-overview",
          description: "掌握保密性、完整性、可用性、可控性和不可否认性。",
        },
        {
          text: "03 信息安全技术",
          link: "/ruankao/system-architect/chapters/chapter-09/03-information-security-technology",
          description: "学习对称加密、非对称加密、摘要、签名、PKI 与 CA。",
        },
        {
          text: "04 访问控制",
          link: "/ruankao/system-architect/chapters/chapter-09/04-access-control",
          description: "理解主体、客体、权限以及 ACM、ACL 模型。",
        },
        {
          text: "05 网络攻击与防护",
          link: "/ruankao/system-architect/chapters/chapter-09/05-attack-defense",
          description: "掌握 ARP、DNS、IP 欺骗、SYN Flood 与 DDoS。",
        },
        {
          text: "06 安全体系与等级保护",
          link: "/ruankao/system-architect/chapters/chapter-09/06-security-evaluation",
          description: "理解安全保障体系、等级保护和风险评估。",
        },
        {
          text: "07 网络安全技术",
          link: "/ruankao/system-architect/chapters/chapter-09/07-network-security",
          description: "比较防火墙、IDS、IPS、蜜罐和 VPN。",
        },
        {
          text: "08 网络安全协议",
          link: "/ruankao/system-architect/chapters/chapter-09/08-network-security-protocol",
          description: "掌握 HTTPS、SSH、PGP、SET、IPSec 和 Kerberos。",
        },
        {
          text: "09 章节练习",
          link: "/ruankao/system-architect/chapters/chapter-09/09-exercises",
          description: "通过选择题、判断题和综合题巩固本章知识。",
        },
        {
          text: "10 历年真题复习",
          link: "/ruankao/system-architect/chapters/chapter-09/10-past-exams",
          description: "按密码技术、攻击防护和协议用途复盘真题。",
        },
        {
          text: "11 第九章总结",
          link: "/ruankao/system-architect/chapters/chapter-09/11-summary",
          description: "用一页知识图和对照表完成考前复习。",
        },
      ],
    },
    {
      text: "第十章 · 软件工程",
      items: [
        {
          text: "01 第十章导读",
          link: "/ruankao/system-architect/chapters/chapter-10/01-software-engineering",
          description: "了解软件工程、需求、设计、测试与维护的知识地图。",
        },
        {
          text: "02 软件工程概述",
          link: "/ruankao/system-architect/chapters/chapter-10/02-software-engineering-overview",
          description: "掌握软件危机、软件生命周期、工程目标和 PDCA。",
        },
        {
          text: "03 CMM 与 CMMI",
          link: "/ruankao/system-architect/chapters/chapter-10/03-capability-maturity-model",
          description: "理解能力成熟度五级模型及 CMMI 表示方式。",
        },
        {
          text: "04 软件过程模型",
          link: "/ruankao/system-architect/chapters/chapter-10/04-software-process-model",
          description: "比较瀑布、V、原型、增量、螺旋、敏捷和 CBSD。",
        },
        {
          text: "05 逆向工程",
          link: "/ruankao/system-architect/chapters/chapter-10/05-reverse-engineering",
          description: "掌握逆向工程、重构、再工程及其应用场景。",
        },
        {
          text: "06 软件需求",
          link: "/ruankao/system-architect/chapters/chapter-10/06-software-requirements",
          description: "理解软件需求分类、功能需求和非功能需求。",
        },
        {
          text: "07 需求获取",
          link: "/ruankao/system-architect/chapters/chapter-10/07-requirements-acquisition",
          description: "掌握访谈、问卷、观察、原型等需求获取方法。",
        },
        {
          text: "08 需求分析",
          link: "/ruankao/system-architect/chapters/chapter-10/08-requirements-analysis",
          description: "学习 DFD、数据字典、实体关系和状态模型。",
        },
        {
          text: "09 需求定义",
          link: "/ruankao/system-architect/chapters/chapter-10/09-requirements-definition",
          description: "掌握 SRS、需求规格说明和需求基线。",
        },
        {
          text: "10 需求验证",
          link: "/ruankao/system-architect/chapters/chapter-10/10-requirements-validation",
          description: "理解正确性、完整性、一致性和可验证性检查。",
        },
        {
          text: "11 需求管理",
          link: "/ruankao/system-architect/chapters/chapter-10/11-requirements-management",
          description: "掌握需求变更、追踪、版本和配置控制。",
        },
        {
          text: "12 过程设计",
          link: "/ruankao/system-architect/chapters/chapter-10/12-process-design",
          description: "学习结构化设计、流程图、IPO、PAD 和模块化。",
        },
        {
          text: "13 系统设计",
          link: "/ruankao/system-architect/chapters/chapter-10/13-system-design",
          description: "掌握高内聚、低耦合、模块设计和系统架构。",
        },
        {
          text: "14 UI 设计",
          link: "/ruankao/system-architect/chapters/chapter-10/14-ui-design",
          description: "理解人机界面设计原则、风格和可用性。",
        },
        {
          text: "15 软件测试",
          link: "/ruankao/system-architect/chapters/chapter-10/15-software-testing",
          description: "掌握测试层次、黑盒/白盒、Alpha/Beta 和回归测试。",
        },
        {
          text: "16 测试用例设计",
          link: "/ruankao/system-architect/chapters/chapter-10/16-test-case-design",
          description: "学习等价类、边界值、判定表、路径和覆盖测试。",
        },
        {
          text: "17 调试与软件质量",
          link: "/ruankao/system-architect/chapters/chapter-10/17-debug-quality",
          description: "区分测试与调试，掌握软件质量和质量保证。",
        },
        {
          text: "18 系统转换与维护",
          link: "/ruankao/system-architect/chapters/chapter-10/18-system-conversion-maintenance",
          description: "理解系统转换方式、维护类型和遗留系统。",
        },
        {
          text: "19 净室软件工程与 CBSD",
          link: "/ruankao/system-architect/chapters/chapter-10/19-cleanroom-cbsd",
          description: "掌握净室软件工程和基于构件的软件开发。",
        },
        {
          text: "20 章节练习",
          link: "/ruankao/system-architect/chapters/chapter-10/20-exercises",
          description: "通过选择题、判断题和综合题巩固本章知识。",
        },
        {
          text: "21 历年真题复习",
          link: "/ruankao/system-architect/chapters/chapter-10/21-past-exams",
          description: "按软件过程、需求、测试和维护复盘真题。",
        },
        {
          text: "22 第十章总结",
          link: "/ruankao/system-architect/chapters/chapter-10/22-summary",
          description: "用知识图和对照表完成软件工程考前复习。",
        },
      ],
    },
    {
      text: "第十一章 · 面向对象技术",
      items: [
        {
          text: "01 第十一章导读",
          link: "/ruankao/system-architect/chapters/chapter-11/01-object-oriented",
          description: "了解面向对象开发、UML 和设计模式的知识地图。",
        },
        {
          text: "02 面向对象开发",
          link: "/ruankao/system-architect/chapters/chapter-11/02-object-oriented-development",
          description: "掌握对象、类、封装、继承、多态、OOA 与 OOD。",
        },
        {
          text: "03 UML 概述",
          link: "/ruankao/system-architect/chapters/chapter-11/03-uml-overview",
          description: "理解 UML 的定位、组成和建模用途。",
        },
        {
          text: "04 UML 关系",
          link: "/ruankao/system-architect/chapters/chapter-11/04-uml-relationships",
          description: "区分关联、聚合、组合、泛化和依赖关系。",
        },
        {
          text: "05 UML 图",
          link: "/ruankao/system-architect/chapters/chapter-11/05-uml-diagrams",
          description: "掌握类图、用例图、顺序图、状态图和部署图。",
        },
        {
          text: "06 UML 4+1 视图",
          link: "/ruankao/system-architect/chapters/chapter-11/06-uml-4plus1",
          description: "理解逻辑视图、开发视图、进程视图、物理视图和场景。",
        },
        {
          text: "07 设计模式概述",
          link: "/ruankao/system-architect/chapters/chapter-11/07-design-pattern-overview",
          description: "掌握 GoF 23 种模式的三大分类和使用目的。",
        },
        {
          text: "08 创建型模式",
          link: "/ruankao/system-architect/chapters/chapter-11/08-creational-patterns",
          description: "学习工厂、抽象工厂、单例、建造者和原型。",
        },
        {
          text: "09 结构型模式",
          link: "/ruankao/system-architect/chapters/chapter-11/09-structural-patterns",
          description: "学习适配器、装饰器、代理、外观、桥接等模式。",
        },
        {
          text: "10 行为型模式",
          link: "/ruankao/system-architect/chapters/chapter-11/10-behavioral-patterns",
          description: "学习策略、观察者、状态、模板方法等行为型模式。",
        },
        {
          text: "11 章节练习",
          link: "/ruankao/system-architect/chapters/chapter-11/11-exercises",
          description: "通过选择题、判断题和综合题巩固本章知识。",
        },
        {
          text: "12 历年真题复习",
          link: "/ruankao/system-architect/chapters/chapter-11/12-past-exams",
          description: "按面向对象、UML 和设计模式复盘真题。",
        },
        {
          text: "13 第十一章总结",
          link: "/ruankao/system-architect/chapters/chapter-11/13-summary",
          description: "用知识图和模式分类完成考前复习。",
        },
      ],
    },
    {
      text: "第十二章 · 项目管理",
      items: [
        {
          text: "01 第十二章导读",
          link: "/ruankao/system-architect/chapters/chapter-12/index",
          description: "了解项目管理、进度、配置、质量和风险管理的知识范围。",
        },
        {
          text: "02 项目管理概述",
          link: "/ruankao/system-architect/chapters/chapter-12/01-project-management-overview",
          description: "掌握项目管理目标、过程、知识体系与高频考点。",
        },
        {
          text: "03 项目进度管理",
          link: "/ruankao/system-architect/chapters/chapter-12/02-progress-management",
          description: "学习活动定义、排序、估算、计划编制与进度控制。",
        },
        {
          text: "04 关键路径法",
          link: "/ruankao/system-architect/chapters/chapter-12/03-critical-path-method",
          description: "掌握 CPM、ES、EF、LS、LF、浮动时间和关键路径计算。",
        },
        {
          text: "05 软件配置管理",
          link: "/ruankao/system-architect/chapters/chapter-12/04-software-configuration-management",
          description: "理解配置项、基线、版本、状态报告、审计和 CCB。",
        },
        {
          text: "06 质量管理",
          link: "/ruankao/system-architect/chapters/chapter-12/05-quality-management",
          description: "区分质量规划、质量保证和质量控制。",
        },
        {
          text: "07 风险管理",
          link: "/ruankao/system-architect/chapters/chapter-12/06-risk-management",
          description: "掌握风险识别、分析、应对和监控流程。",
        },
        {
          text: "08 章节练习",
          link: "/ruankao/system-architect/chapters/chapter-12/07-exercises",
          description: "通过选择题、判断题和关键路径计算巩固本章知识。",
        },
        {
          text: "09 历年真题复习",
          link: "/ruankao/system-architect/chapters/chapter-12/08-past-exams",
          description: "按进度、配置、质量和风险管理复盘典型题型。",
        },
        {
          text: "10 第十二章总结",
          link: "/ruankao/system-architect/chapters/chapter-12/09-summary",
          description: "用知识体系、对照表和思维导图完成考前复习。",
        },
      ],
    },
    {
      text: "第十三章 · 系统架构设计",
      items: [
        {
          text: "01 第十三章导读",
          link: "/ruankao/system-architect/chapters/chapter-13/index",
          description: "了解软件架构、架构风格、架构评估与中间件的知识范围。",
        },
        {
          text: "02 软件架构概述",
          link: "/ruankao/system-architect/chapters/chapter-13/01-software-architecture-overview",
          description: "掌握软件架构的定义、组成、作用和生命周期关系。",
        },
        {
          text: "03 软件架构风格",
          link: "/ruankao/system-architect/chapters/chapter-13/02-software-architecture-style",
          description: "比较数据流、调用返回、独立构件、虚拟机和仓库风格。",
        },
        {
          text: "04 软件构件",
          link: "/ruankao/system-architect/chapters/chapter-13/03-component",
          description: "理解构件定义、接口、复用和构件化开发。",
        },
        {
          text: "05 层次架构",
          link: "/ruankao/system-architect/chapters/chapter-13/04-layered-architecture",
          description: "掌握 C/S、B/S、三层和多层架构的特点与对比。",
        },
        {
          text: "06 MVC、MVP、MVVM",
          link: "/ruankao/system-architect/chapters/chapter-13/05-mvc-mvp-mvvm",
          description: "区分 MVC、MVP、MVVM 的组成、流程和适用场景。",
        },
        {
          text: "07 SOA 面向服务架构",
          link: "/ruankao/system-architect/chapters/chapter-13/06-soa",
          description: "掌握 SOA 角色、服务模型、注册发现和 ESB。",
        },
        {
          text: "08 Web Service",
          link: "/ruankao/system-architect/chapters/chapter-13/07-web-service",
          description: "理解 SOAP、WSDL、UDDI 及 Web Service 调用流程。",
        },
        {
          text: "09 DSSA",
          link: "/ruankao/system-architect/chapters/chapter-13/08-dssa",
          description: "掌握领域工程、领域分析、设计和实现。",
        },
        {
          text: "10 ABSD",
          link: "/ruankao/system-architect/chapters/chapter-13/09-absd",
          description: "理解基于架构的软件开发及架构需求、设计、实现和演化。",
        },
        {
          text: "11 软件架构评估",
          link: "/ruankao/system-architect/chapters/chapter-13/10-software-architecture-evaluation",
          description: "掌握质量属性、场景驱动分析和架构权衡。",
        },
        {
          text: "12 SAAM、ATAM、CBAM",
          link: "/ruankao/system-architect/chapters/chapter-13/11-saam-atam-cbam",
          description: "比较 SAAM、ATAM、CBAM 的目标、过程与适用场景。",
        },
        {
          text: "13 中间件技术",
          link: "/ruankao/system-architect/chapters/chapter-13/12-middleware-technology",
          description: "了解 CORBA、COM/DCOM、EJB、J2EE 和 .NET 中间件。",
        },
        {
          text: "14 章节练习",
          link: "/ruankao/system-architect/chapters/chapter-13/13-exercises",
          description: "通过选择题、判断题和综合题巩固系统架构设计知识。",
        },
        {
          text: "15 历年真题复习",
          link: "/ruankao/system-architect/chapters/chapter-13/14-past-exams",
          description: "按架构风格、SOA、架构评估和中间件复盘典型题型。",
        },
        {
          text: "16 第十三章总结",
          link: "/ruankao/system-architect/chapters/chapter-13/15-summary",
          description: "用知识体系、对比表和思维导图完成考前复习。",
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
