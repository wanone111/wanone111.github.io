export const knowledgePaths = [
  {
    title: '嵌入式与通信',
    href: '/knowledge/embedded/communication-path/',
    description: 'UART、SPI 与 I²C · ESP8266 联网',
    matches: (slug: string) => slug.startsWith('embedded/') || slug.startsWith('networking/'),
  },
  {
    title: '机器人系统',
    href: '/knowledge/robotics/ros2-and-simulation/',
    description: 'ROS 2 与 PX4 · 导航与协同建图',
    matches: (slug: string) => slug.startsWith('robotics/') || slug === 'algorithms/pid-control-basics',
  },
  {
    title: 'FPGA 与边缘 AI',
    href: '/knowledge/fpga-edge-ai/fpga-development/',
    description: 'RTL 与 HLS · 小车板测与 HDMI 直通',
    matches: (slug: string) => slug.startsWith('fpga/'),
  },
  {
    title: 'Linux 与工程工具',
    href: '/knowledge/linux-tools/linux-and-networking/',
    description: 'C++ · TCP 套接字 · SSH 远程开发',
    matches: (slug: string) => ['tools/', 'programming/', 'networking/', 'engineering/'].some((prefix) => slug.startsWith(prefix)),
  },
];
