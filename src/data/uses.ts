export const sections = [
  { id: 'overview', label: '概览', shortLabel: '00' },
  { id: 'hardware', label: '硬件', shortLabel: '01' },
  { id: 'software', label: '软件', shortLabel: '02' },
  { id: 'workflows', label: '工作流', shortLabel: '03' },
  { id: 'principles', label: '原则', shortLabel: '04' },
  { id: 'constraints', label: '限制', shortLabel: '05' },
  { id: 'projects', label: '项目', shortLabel: '06' },
] as const;

export const overview = {
  eyebrow: '/uses · Workbench',
  title: '我用工具缩短验证路径，不用清单装饰工作台。',
  intro:
    '我的工作跨过嵌入式、机器人、FPGA 视频链路、边缘 AI 和内容发布。这里记录已经进入公开项目的工具，也同时写下它们解决的问题和当前边界。',
  note:
    '我不按品牌完整度整理设备，也不追逐版本号。没有公开记录支持的型号、性能和成果，不会写进这份清单。',
} as const;

export const hardwareGroups = [
  {
    id: 'development',
    title: '开发与调试',
    summary: '我先让构建、日志和通信记录可复现，再判断问题属于代码、接口还是环境。',
    items: [
      {
        id: 'workstation',
        label: '本地工作站',
        role: '承载工程构建、仿真、日志分析和网站验证。',
        limit: '公开资料没有固定品牌、型号或配置，我不补写这些信息。',
      },
      {
        id: 'embedded-bench',
        label: '嵌入式实验台',
        role: '用 STM32、飞控和常用通信接口验证外设、时序与控制假设。',
        limit: '公开记录支持开发与调试流程，不代表所有真机任务都已完成。',
      },
    ],
  },
  {
    id: 'video-edge',
    title: '视频与边缘计算',
    summary: '我把采集、FPGA 处理、网络转发和 NPU 推理拆开验证，再用日志串回完整链路。',
    items: [
      {
        id: 'video-chain',
        label: 'PC、PYNQ-Z2 与 Ascend 310B',
        role: '组成 HDMI 视频、FPGA 处理、UDP 转发和 YOLO 推理验证链路。',
        limit: '摄像头输入稳定性和统一条件下的端到端数据仍需继续验证。',
      },
      {
        id: 'hdmi-io',
        label: 'HDMI 输入输出设备',
        role: '用于检查视频输入、直通画面、时钟约束和输出状态。',
        limit: '当前公开结果聚焦已验证链路，不延伸为未测量的长期性能结论。',
      },
    ],
  },
] as const;

export const softwareGroups = [
  {
    id: 'systems',
    title: '系统开发',
    summary: '我在 Linux 环境里完成编译、运行、日志排查和通信测试。',
    items: [
      { label: 'C/C++', detail: '实现嵌入式模块、ROS 2 节点和端侧程序。' },
      { label: 'Python', detail: '配合视频与推理环境完成脚本和数据处理。' },
      { label: 'Git 与 Shell', detail: '保存变更边界，复现构建与排障命令。' },
    ],
  },
  {
    id: 'robotics',
    title: '机器人系统',
    summary: '我把节点、飞控、仿真和地面站放在同一条可检查的控制链路里。',
    items: [
      { label: 'ROS 2', detail: '组织节点、Topic、launch 与工程构建。' },
      { label: 'PX4 与 MAVLink', detail: '验证飞控状态、指令和 Offboard 接入流程。' },
      { label: 'Gazebo 与 QGroundControl', detail: '承担仿真、参数检查和模式联调。' },
    ],
  },
  {
    id: 'fpga-ai',
    title: 'FPGA 与边缘 AI',
    summary: '我先确认视频接口与时序，再接入网络转发和推理。',
    items: [
      { label: 'Vivado', detail: '配置 HDMI 链路、IO 与时钟约束。' },
      { label: 'Verilog / HLS', detail: '实现和验证 FPGA 侧视频处理模块。' },
      { label: 'YOLO 推理环境', detail: '在 Ascend 310B 端验证后端推理与结果输出。' },
    ],
  },
  {
    id: 'publishing',
    title: '内容发布',
    summary: '我把私有编辑、公开白名单、静态构建和质量门禁分开管理。',
    items: [
      { label: 'Obsidian', detail: '作为知识库编辑源，保留私有与公开内容边界。' },
      { label: 'Astro 与 Starlight', detail: '生成公开页面、文章和知识文档。' },
      { label: 'Node.js 与 TypeScript', detail: '实现内容同步、校验和站点逻辑。' },
      {
        label: 'GitHub Actions、Playwright、axe 与 Lighthouse',
        detail: '执行构建、浏览器、无障碍和性能门禁。',
      },
    ],
  },
] as const;

export const workflows = [
  {
    id: 'video',
    title: '视频链路',
    summary: '我按信号入口、处理、传输、推理和证据逐段确认。',
    nodes: [
      {
        id: 'video-input',
        label: '输入视频',
        protocol: 'HDMI',
        detail: '先对比 PC 与摄像头输入，确认问题是否来自信号源。',
      },
      {
        id: 'video-fpga',
        label: 'FPGA 处理',
        protocol: 'TMDS / pixel clock',
        detail: '检查引脚、IO 标准、时钟约束和模块锁定状态。',
      },
      {
        id: 'video-transfer',
        label: '数据转发',
        protocol: 'UDP',
        detail: '连接 PC、PYNQ-Z2 与 Ascend 310B，并保留通信记录。',
      },
      {
        id: 'video-inference',
        label: '后端推理',
        protocol: 'YOLO pipeline',
        detail: '接入 NPU 推理，分别检查 pipeline、backend 和 player 日志。',
      },
    ],
    result: '已公开验证 HDMI 直通、通信压测框架和分段日志采集。',
    limit: '摄像头稳定性、延迟、有效帧率、丢包率和长期运行仍缺少统一公开数据。',
    projectHref: '/projects/heterogeneous-video-pipeline/',
  },
  {
    id: 'robotics',
    title: '机器人控制',
    summary: '我先让构建和仿真成立，再进入参数、通信与真机排障。',
    nodes: [
      {
        id: 'robotics-build',
        label: '功能包构建',
        protocol: 'ament_cmake / colcon',
        detail: '编译 ROS 2 C++ 节点，先排除依赖和工程配置问题。',
      },
      {
        id: 'robotics-dataflow',
        label: '节点数据流',
        protocol: 'ROS 2 Topic',
        detail: '订阅飞控状态，发布控制指令，并检查话题是否持续有数据。',
      },
      {
        id: 'robotics-flight-control',
        label: '飞控接入',
        protocol: 'PX4 / MAVLink',
        detail: '核对 Offboard 前置条件、模式切换和通信状态。',
      },
      {
        id: 'robotics-validation',
        label: '仿真与联调',
        protocol: 'Gazebo / QGroundControl',
        detail: '在仿真和地面站中检查参数、状态和异常恢复路径。',
      },
    ],
    result: '已形成覆盖构建、仿真、参数、通信和模式切换的排障链路。',
    limit: '公开材料没有完整真机自主飞行条件、任务成功率和稳定运行数据。',
    projectHref: '/projects/indoor-autonomous-drone/',
  },
  {
    id: 'publishing',
    title: '内容发布',
    summary: '我只发布明确批准的内容，并让每个输出都能追溯到公开源。',
    nodes: [
      {
        id: 'publishing-source',
        label: '私有编辑',
        protocol: 'Obsidian',
        detail: '知识库负责思考和编辑，不把整个私有目录交给公开构建。',
      },
      {
        id: 'publishing-allowlist',
        label: '公开白名单',
        protocol: '80_Publish',
        detail: '只同步明确批准公开的文章、项目、页面和资源。',
      },
      {
        id: 'publishing-generate',
        label: '确定性生成',
        protocol: 'Astro / Starlight',
        detail: '转换内容并记录源、输出、路由和哈希。',
      },
      {
        id: 'publishing-gates',
        label: '发布门禁',
        protocol: 'CI checks',
        detail: '依次检查内容、敏感信息、构建、链接、路由、浏览器和无障碍。',
      },
    ],
    result: '发布流程可追溯、可构建、可验证，任一步失败都会阻止后续发布。',
    limit: '自动化不能代替事实审核和视觉复核，公开工程素材仍需逐项确认。',
    projectHref: '/projects/obsidian-astro-publishing/',
  },
] as const;

export const principles = [
  {
    id: 'verify-first',
    title: '先验证，再抽象',
    detail: '我从可复现的小实验开始。结果成立后，才把方法整理成模块或文档。',
  },
  {
    id: 'follow-data',
    title: '沿数据流排查',
    detail: '我先确认环境和边界，再用构建日志、运行状态、通信记录和对照实验缩小范围。',
  },
  {
    id: 'separate-source-output',
    title: '源与输出分离',
    detail: '我让知识库负责编辑，让网站只接收批准公开的内容。生成结果不能反向覆盖源。',
  },
  {
    id: 'keep-evidence',
    title: '让结论带着证据',
    detail: '我同时记录结果、验证方法和限制。没有公开证据的结论不会补写。',
  },
] as const;

export const constraints = [
  {
    id: 'no-inventory-fiction',
    title: '这不是完整设备清单',
    detail: '公开资料没有支持的品牌、型号、版本和配置，我保持空白。',
  },
  {
    id: 'no-unverified-metrics',
    title: '这不是性能榜单',
    detail: '我只写已有公开记录支持的验证结果，不补齐延迟、帧率、丢包率或成功率。',
  },
  {
    id: 'automation-has-boundaries',
    title: '自动化有边界',
    detail: '检查可以阻止常见错误，但不能替代内容事实、视觉材料和公开范围的人工责任。',
  },
  {
    id: 'work-in-progress',
    title: '项目仍在推进',
    detail: '视频输入稳定性、真机飞行证据和统一条件下的长期数据仍待补充。',
  },
] as const;

export const projects = [
  {
    id: 'heterogeneous-video-pipeline',
    title: '异构硬件视频图像处理方案',
    href: '/projects/heterogeneous-video-pipeline/',
    role: 'FPGA 图像处理 / 边缘 AI 部署',
    result: '完成 HDMI 直通、通信压测框架和日志采集。',
    limit: '摄像头稳定性和统一测试条件下的端到端指标仍待验证。',
  },
  {
    id: 'indoor-autonomous-drone',
    title: '室内无人机自主飞行控制系统',
    href: '/projects/indoor-autonomous-drone/',
    role: '嵌入式软件开发 / ROS 2 开发',
    result: '完成 ROS 2 功能包、基础仿真和飞控接入的阶段性验证。',
    limit: '公开材料不支持完整真机自主飞行成果或量化成功率。',
  },
  {
    id: 'obsidian-astro-publishing',
    title: 'Obsidian 与 Astro 内容发布系统',
    href: '/projects/obsidian-astro-publishing/',
    role: '内容管线设计 / 网站工程 / 质量保证',
    result: '建立白名单发布、生成清单和质量门禁。',
    limit: '事实审核、视觉复核和工程素材公开仍依赖人工流程。',
  },
] as const;

export const readings = [
  {
    id: 'ros2-notes',
    title: 'ROS 2 学习笔记',
    href: '/blog/robotics/ros2-notes/',
    topic: '节点、Topic、服务、参数、动作与构建流程。',
  },
  {
    id: 'gazebo-simulation',
    title: 'Gazebo 仿真笔记',
    href: '/blog/robotics/gazebo-simulation/',
    topic: '机器人仿真环境与验证入口。',
  },
  {
    id: 'fpga-overview',
    title: 'FPGA 概览',
    href: '/blog/fpga/fpga-overview/',
    topic: '设计、仿真、综合、实现和板级调试流程。',
  },
  {
    id: 'vitis-hls-notes',
    title: 'FPGA HLS 学习笔记',
    href: '/blog/fpga/vitis-hls-notes/',
    topic: 'HLS 仿真、综合、协同验证与 IP 交付。',
  },
  {
    id: 'linux-notes',
    title: 'Linux 学习笔记',
    href: '/blog/tools/linux-notes/',
    topic: '构建、命令行、日志和系统工具。',
  },
  {
    id: 'linux-socket',
    title: 'Linux Socket 学习笔记',
    href: '/blog/networking/linux-socket/',
    topic: '网络通信与 Socket 编程基础。',
  },
] as const;
