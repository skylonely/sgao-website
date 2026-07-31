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
  version: string;
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
    "从版本控制为什么诞生开始，逐步掌握 Git 原理、日常命令、分支协作、GitHub、CI/CD、事故恢复和 AI 时代开发工作流。",
  version: "v1.0",
  audience: {
    title: "从初学者到独立开发者",
    description:
      "适合前端开发者、独立开发者、AI Coding 使用者，以及希望系统补齐 Git 与 GitHub 工程实践的人。",
  },
  outcome: {
    title: "建立完整的软件交付思维",
    description:
      "不仅会使用命令，还能理解 Git 的底层模型，选择团队工作流，处理常见事故，并把自动化接入真实项目。",
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

export const bookModules = {
  git: gitBook,
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
