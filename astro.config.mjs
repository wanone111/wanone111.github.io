import { defineConfig } from 'astro/config';

const redirects = {
  '/blog/': '/notes/',
  '/archive/': '/notes/',
  '/tags/': '/notes/',
  '/links/': '/about/',
  '/uses/': '/about/',
  '/projects/fpga-robot-navigation/': '/projects/hexapod-robot-cooperative-mapping/',
  '/projects/obsidian-astro-publishing/': '/about/',
  '/knowledge/': '/notes/',
  '/knowledge/embedded/': '/notes/embedded/communication-protocols/',
  '/knowledge/embedded/communication-path/': '/notes/embedded/communication-protocols/',
  '/knowledge/robotics/': '/notes/robotics/ros2-notes/',
  '/knowledge/robotics/ros2-and-simulation/': '/notes/robotics/ros2-notes/',
  '/knowledge/fpga-edge-ai/': '/notes/fpga/fpga-overview/',
  '/knowledge/fpga-edge-ai/fpga-development/': '/notes/fpga/fpga-overview/',
  '/knowledge/linux-tools/': '/notes/engineering/remote-development-and-terminal-proxy/',
  '/knowledge/linux-tools/linux-and-networking/': '/notes/engineering/remote-development-and-terminal-proxy/',
  '/notes/robotics/ros2-workspace-build-run/': '/notes/robotics/ros2-notes/',
  '/notes/robotics/gazebo-notes/': '/notes/robotics/ros2-notes/',
  '/notes/embedded/esp-at-networking/': '/notes/embedded/communication-protocols/',
  '/notes/networking/linux-tcp-socket-basics/': '/notes/engineering/remote-development-and-terminal-proxy/',
  '/notes/programming/cpp-class-access-control/': '/notes/engineering/remote-development-and-terminal-proxy/',
};

// Each article had a dated URL and a /blog/ slug. A third value moves its /notes/ URL as well.
for (const [datedUrl, slug, movedTo] of [
  ['/2025/09/16/ROS2学习笔记/', 'robotics/ros2-notes'],
  ['/2025/09/18/FPGA-RTL学习笔记/', 'fpga/rtl-notes', '/notes/fpga/fpga-overview/'],
  ['/2025/09/18/linux学习笔记/', 'tools/linux-notes', '/notes/engineering/remote-development-and-terminal-proxy/'],
  ['/2025/09/18/PID/', 'algorithms/pid', '/notes/algorithms/pid-control-basics/'],
  ['/2025/09/18/STM32学习笔记/', 'embedded/stm32-notes', '/notes/embedded/communication-protocols/'],
  ['/2025/09/18/嵌入式通信/', 'embedded/communication-protocols'],
  ['/2025/09/23/FPGA/', 'fpga/fpga-overview'],
  ['/2025/09/23/STM32-通信/', 'embedded/stm32-communication', '/notes/embedded/communication-protocols/'],
  ['/2025/10/16/FPGA-HLS学习笔记/', 'fpga/vitis-hls-notes', '/notes/fpga/fpga-overview/'],
  ['/2025/10/16/电赛/', 'embedded/electronic-design-contest', '/notes/embedded/communication-protocols/'],
  ['/2025/10/17/Linux-socket/', 'networking/linux-socket', '/notes/engineering/remote-development-and-terminal-proxy/'],
  ['/2026/03/07/Gazebo仿真/', 'robotics/gazebo-simulation', '/notes/robotics/ros2-notes/'],
  ['/2026/04/07/C++学习笔记/', 'programming/cpp-notes', '/notes/engineering/remote-development-and-terminal-proxy/'],
  ['/2026/04/07/SLAM学习笔记/', 'robotics/slam-notes', '/notes/robotics/ros2-notes/'],
  ['/2026/04/07/verilog学习笔记/', 'fpga/verilog-notes', '/notes/fpga/fpga-overview/'],
  ['/2026/04/08/matlab学习笔记/', 'vision/matlab-notes', '/notes/'],
  ['/2026/04/08/opencv学习笔记/', 'vision/opencv-notes', '/notes/'],
  ['/2026/04/08/各种滤波算法/', 'algorithms/filtering', '/notes/'],
]) {
  const notesUrl = `/notes/${slug}/`;
  const destination = movedTo ?? notesUrl;
  redirects[datedUrl] = destination;
  redirects[`/blog/${slug}/`] = destination;
  if (movedTo) redirects[notesUrl] = movedTo;
}

export default defineConfig({
  site: 'https://wanone111.github.io',
  scopedStyleStrategy: 'where',
  redirects,
});
