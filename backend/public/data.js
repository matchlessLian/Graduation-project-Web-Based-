window.DATA = {
  nav: {
    zh: [
      { id: "dashboard", label: "主页" },
      { id: "portfolio", label: "新闻" },
      { id: "articles", label: "求职广场" },
      { id: "contact", label: "联系" }
    ]
  },

  home: {
    zh: {
      heroItems: [
        { text: "企业进校宣讲", annotation: "（3月17日智能制造企业就业宣讲会）", category: "校园招聘" },
        { text: "西部计划", annotation: "（西部计划报名通道今日开启）", category: "宣讲会" },
        { text: "顺丰校招", annotation: "（顺丰集团华东分拨区26界春季校园招聘启动）", category: "就业服务" },
        { text: "高途春招", annotation: "（高途春招提前批也正式开启啦）", category: null }
      ],
      intro: "大厂都在用求职大师|用求职大师招聘人才好方便！",
      selectedWorks: "与我们的合作企业",
      years: "[ 2025 — 至今 ]"
    }
  },

  cooperate: {
    logo: [
      "assets/cooperate/1.png",
      "assets/cooperate/2.png",
      "assets/cooperate/3.png",
      "assets/cooperate/4.png",
      "assets/cooperate/5.png",
      "assets/cooperate/6.png",
      "assets/cooperate/7.png",
      "assets/cooperate/8.png",
      "assets/cooperate/9.png"
    ]
  },

  contact: {
    zh: {
      baseLabel: "WELCOME",
      locationValue: "高薪工作拿到手软！",
      contactLabel: "立即求职",
      contactLabel2: "企业入驻",
      tooltip: "用求职大师，你，就是求职大师！",

      hello: "你好 :-)",
      intro: "广告位招租中",
      email: "广告商速速联系我！！！->*****@163.com",
      github: "本项目已开源至我的个人仓库，急速配置，有问题就issue",
      thanks1: "新时代最好的合作伙伴（限2026）",
      thanks2: "",
      thanks3: "",

      footerDesign: "Powered by Deepseek, Codex, Doubao"
    }
  },

  newsPage: {
    zh: {
      title: "新闻",
      description: "校内线下招聘新闻一手爆料"
    }
  },

  jobsPage: {
    zh: {
      title: "招聘广场",
      description: "企业招聘信息一手资源"
    }
  },

  jobTags: [
    "前端",
    "后端",
    "产品",
    "设计",
    "运营",
    "校招",
    "实习",
    "React",
    "Java",
    "AI"
  ],

  jobs: [
    {
      id: "job-001",
      title: "前端开发工程师",
      company: "腾汛",
      location: "深圳·南山",
      salaryMin: 12,
      salaryMax: 20,
      salaryUnit: "k/月",
      tags: ["前端", "校招", "React"],
      publishDate: "2026-03-08",
      summary: "参与校园招聘官网与活动报名系统的开发与维护。",
      responsibilities: [
        "负责前端页面与交互实现",
        "维护组件库与设计规范",
        "与后端协作完成接口联调"
      ],
      requirements: [
        "熟悉 HTML/CSS/JS",
        "掌握 React 或 Vue 基础",
        "有良好的沟通与协作能力"
      ],
      benefits: ["五险一金", "免费三餐", "节日福利"],
      interview: {
        mode: "线下面试",
        time: "每周三 14:00",
        location: "南山科技园 A 座 5F",
        contact: "HR-张 138****1234"
      },
      companyUser: "tencent_hr"
    },
    {
      id: "job-002",
      title: "后端开发工程师",
      company: "阿里",
      location: "杭州·滨江",
      salaryMin: 15,
      salaryMax: 25,
      salaryUnit: "k/月",
      tags: ["后端", "校招", "Java"],
      publishDate: "2026-03-03",
      summary: "负责招聘系统服务端的设计与性能优化。",
      responsibilities: [
        "参与后端服务设计与实现",
        "优化数据库结构与查询性能",
        "保障系统稳定性与可用性"
      ],
      requirements: [
        "熟悉 Java / Spring 生态",
        "了解 MySQL 与 Redis",
        "具备基础的系统设计能力"
      ],
      benefits: ["绩效奖金", "住房补贴", "带薪年假"],
      interview: {
        mode: "线上面试",
        time: "工作日 10:00-18:00",
        location: "钉钉会议",
        contact: "HR-王 136****9966"
      },
      companyUser: "alibaba_hr"
    },
    {
      id: "job-003",
      title: "产品实习生",
      company: "字节跳动",
      location: "北京·朝阳",
      salaryMin: 5,
      salaryMax: 7,
      salaryUnit: "k/月",
      tags: ["产品", "实习"],
      publishDate: "2026-02-27",
      summary: "协助招聘产品需求整理与原型设计。",
      responsibilities: [
        "收集用户需求与痛点",
        "输出 PRD 与原型",
        "跟进研发测试流程"
      ],
      requirements: [
        "逻辑清晰，表达能力强",
        "能使用 Axure 或 Figma",
        "有团队协作意识"
      ],
      benefits: ["餐补", "弹性打卡", "导师带教"],
      interview: {
        mode: "线上面试",
        time: "每周二 15:00",
        location: "飞书会议",
        contact: "HR-赵 139****5566"
      },
      companyUser: "bytedance_hr"
    },
    {
      id: "job-004",
      title: "视觉设计师",
      company: "米哈游",
      location: "上海·徐汇",
      salaryMin: 10,
      salaryMax: 16,
      salaryUnit: "k/月",
      tags: ["设计", "校招"],
      publishDate: "2026-02-20",
      summary: "负责品牌视觉与招聘活动视觉设计。",
      responsibilities: [
        "输出海报与宣传视觉",
        "维护品牌视觉规范",
        "支持线下活动视觉落地"
      ],
      requirements: [
        "精通 PS/AI",
        "有审美与排版能力",
        "有作品集优先"
      ],
      benefits: ["节日礼包", "交通补贴", "年度体检"],
      interview: {
        mode: "线下面试",
        time: "每周五 10:00",
        location: "徐汇园区 B2 大厅",
        contact: "HR-陈 133****7788"
      },
      companyUser: "mihoyo_hr"
    },
    {
      id: "job-005",
      title: "运营专员",
      company: "小红书",
      location: "上海·黄浦",
      salaryMin: 8,
      salaryMax: 12,
      salaryUnit: "k/月",
      tags: ["运营", "校招"],
      publishDate: "2026-03-10",
      summary: "负责招聘活动与内容的运营推广。",
      responsibilities: [
        "策划校园招聘活动",
        "维护社媒内容更新",
        "数据复盘与优化"
      ],
      requirements: [
        "文案能力强",
        "熟悉社交媒体玩法",
        "有活动组织经验优先"
      ],
      benefits: ["下午茶", "团建", "弹性工作"],
      interview: {
        mode: "线上面试",
        time: "每周四 16:00",
        location: "腾讯会议",
        contact: "HR-周 137****3300"
      },
      companyUser: "xiaohongshu_hr"
    },
    {
      id: "job-006",
      title: "AI 算法实习生",
      company: "科大讯飞",
      location: "合肥·高新",
      salaryMin: 6,
      salaryMax: 9,
      salaryUnit: "k/月",
      tags: ["AI", "实习"],
      publishDate: "2026-02-16",
      summary: "参与语音与文本相关算法模型的实验与优化。",
      responsibilities: [
        "整理训练数据并训练模型",
        "进行实验与效果对比",
        "协助算法工程师落地部署"
      ],
      requirements: [
        "了解深度学习基础",
        "熟悉 Python",
        "具备良好的学习能力"
      ],
      benefits: ["餐补", "科研氛围", "住宿补贴"],
      interview: {
        mode: "线上面试",
        time: "工作日 11:00",
        location: "会议链接另行通知",
        contact: "HR-刘 135****1122"
      },
      companyUser: "iflytek_hr"
    }
  ],

  news: [
    {
      id: "news-001",
      title: "春季校招专场宣讲会即将开启",
      category: "校园宣讲",
      coverImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
      date: "2026-03-09",
      summary: "多家企业将参与本次宣讲会，欢迎同学们现场投递简历。",
      content: [
        "本次宣讲会将于下周三在图书馆报告厅举办。",
        "现场提供简历直投与面试安排。",
        "建议同学提前准备好个人简历与作品集。"
      ],
      source: "校就业办"
    },
    {
      id: "news-002",
      title: "名企招聘负责人分享会报名开启",
      category: "职业讲座",
      coverImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c",
      date: "2026-03-05",
      summary: "围绕简历撰写、面试技巧与岗位趋势进行分享。",
      content: [
        "活动形式为线下分享与答疑。",
        "参与活动可获得企业内推资格。",
        "名额有限，请尽快报名。"
      ],
      source: "学院就业中心"
    },
    {
      id: "news-003",
      title: "校园招聘季岗位信息更新",
      category: "招聘资讯",
      coverImage: "https://images.unsplash.com/photo-1553877522-43269d4ea984",
      date: "2026-02-28",
      summary: "新增多家互联网企业的校招岗位信息。",
      content: [
        "新增企业覆盖互联网、游戏、制造等方向。",
        "岗位类型包括研发、产品、设计与运营。",
        "欢迎同学关注招聘广场的最新岗位。"
      ],
      source: "就业办官方通知"
    }
  ]
};
