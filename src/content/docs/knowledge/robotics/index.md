---
title: 机器人系统
description: ROS 2 与 PX4 的仿真和定位记录，以及地面机器人的导航与协同建图。
sidebar:
  order: 3
---

无人机部分从 ROS 2 任务节点与 PX4 的状态交换读起。旧版任务在仿真中完成起飞、悬停和降落。台架记录用于核对视觉观测是否过期，飞控日志用于查看融合状态。当前版本的实机自主任务仍待验证。[ROS 2 与机器人仿真学习路径](./ros2-and-simulation/) · [室内无人机项目记录](/projects/indoor-autonomous-drone/)

地面机器人部分从两个现场问题入手。障碍移走后，小车为什么仍会停车？两台相机都认出标定板后，怎样核对小车与六足的地图方向？协同建图时六足由人操控，现场记录覆盖两张地图的对齐与交换。[轮式机器人导航](/projects/fpga-robot-navigation/) · [双机协同建图](/projects/hexapod-robot-cooperative-mapping/)
