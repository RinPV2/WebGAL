import * as PIXI from 'pixi.js';
import { registerPerform } from '@/Core/util/pixiPerformManager/pixiPerformManager';
import { WebGAL } from '@/Core/WebGAL';

const smokeEffect = (particleCount: number) => {
  const effectsContainer = WebGAL!.gameplay!.pixiStage!.effectsContainer;
  const app = WebGAL!.gameplay!.pixiStage!.currentApp!;

  // 创建一个容器
  const container = new PIXI.Container();
  effectsContainer.addChild(container);
  const texture = PIXI.Texture.from('./game/tex/smoke.png');
  // 参数设置
  const maxVelocity = 1; // 最大速度
  const particles: PIXI.Sprite[] = []; // 存储粒子的数组
  const canvasWidth = app.screen.width;
  const canvasHeight = 400;

  // 创建粒子
  for (let i = 0; i < particleCount; i++) {
    const particle = new PIXI.Sprite(texture);

    // 设置粒子的初始位置和速度
    particle.x = Math.random() * canvasWidth;
    particle.y = Math.random() * canvasHeight;
    particle.scale.set(3 + Math.random() * 2); // 随机缩放大小
    particle.rotation = Math.random() * Math.PI * 2; // 随机旋转角度
    particle.alpha = 0.8; // 初始透明度

    // 给每个粒子附加速度属性
    (particle as any).xVelocity = (Math.random() * 2 - 1) * maxVelocity;
    (particle as any).yVelocity = (Math.random() * 2 - 1) * maxVelocity * 0.5;

    container.addChild(particle);
    particles.push(particle);
  }

  // 更新粒子
  function tickerFn(delta: number) {
    for (const [index, particle] of particles.entries()) {
      particle.x += (particle as any).xVelocity * delta;
      particle.y += (particle as any).yVelocity * delta;

      // 边缘检测
      if (particle.x >= canvasWidth || particle.x <= 0) {
        (particle as any).xVelocity = -(particle as any).xVelocity;
      }
      if (particle.y >= canvasHeight || particle.y <= 0) {
        (particle as any).yVelocity = -(particle as any).yVelocity;
      }

      // 根据位置调整透明度
      particle.alpha =
        (1 - Math.abs(canvasWidth * 0.5 - particle.x) / canvasWidth) *
        (0.8 - Math.abs(canvasHeight * 0.5 - particle.y) / canvasHeight);

      // 根据index旋转
      switch (index % 4) {
        case 0:
          particle.rotation += 0.0001 * delta;
          break;
        case 1:
          particle.rotation -= 0.0005 * delta;
          break;
        case 2:
          break;
        case 3:
          particle.rotation -= 0.0002 * delta;
          break;
      }
    }
  }

  // 注册动画
  WebGAL!.gameplay!.pixiStage!.registerAnimation(
    { setStartState: () => {}, setEndState: () => {}, tickerFunc: tickerFn },
    'smokeEffect-Ticker',
  );

  return { container, tickerKey: 'smokeEffect-Ticker' };
};

// 注册特效
registerPerform('smoke', () => smokeEffect(120));
