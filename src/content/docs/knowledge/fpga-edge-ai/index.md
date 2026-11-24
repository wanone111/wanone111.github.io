---
title: FPGA 与边缘 AI
description: FPGA、PYNQ、视频链路、HLS 与边缘推理。
sidebar:
  order: 4
---

从 RTL 仿真进入板测时，可以用一次高云小车的零速通信试验核对命令往返，也可以用 PYNQ-Z2 的固定视频源检查 HDMI 输入输出。实验条件、观测指标和相关笔记见 [FPGA、Verilog 与 HLS 学习路径](./fpga-development/)。

PYNQ-Z2 的 1080p、60 Hz 记录来自 HDMI 直通实验。含 UDP 转发、昇腾 310B 推理和播放的整条链路仍需单独测量帧率与延迟。[异构视频项目的板测与分段日志](/projects/heterogeneous-video-pipeline/)
