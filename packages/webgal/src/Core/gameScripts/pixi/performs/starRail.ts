import * as PIXI from 'pixi.js';
import { registerPerform } from '@/Core/util/pixiPerformManager/pixiPerformManager';
import { WebGAL } from '@/Core/WebGAL';
import de from '@/translations/de';

const starRail = () => {
  const effectsContainer = WebGAL!.gameplay!.pixiStage!.effectsContainer;
  const app = WebGAL!.gameplay!.pixiStage!.currentApp!;
  const container = new PIXI.Container();
  effectsContainer.addChild(container);

  // 将容器移到中心
  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;
  container.pivot.x = container.width / 2;
  container.pivot.y = container.height / 2;
  container.scale.x = 1;
  container.scale.y = 1;

  // 随机生成数值函数
  function random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  function hslToHex(h: number, s: number, l: number): number {
    s /= 100;
    l /= 100;

    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);

    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));

    return (r << 16) + (g << 8) + b;
  }

  // 星星类
  class Star {
    graphics: PIXI.Graphics;
    radius: number;
    angle: number;
    speed: number;
    centerX: number;
    centerY: number;
    x: number;
    y: number;
    hue: number;
    alpha: number;
    alphaDecay: number;
    alphaMax: number;
    coordinates: any[];
    coordinatesCount: number;
    hsl: number;
    width: number;

    constructor(x: number, y: number) {
      this.centerX = 0;
      this.centerY = app.screen.height / 2 - 100;
      this.x = x;
      this.y = y;
      this.radius = Math.sqrt(Math.pow(this.centerX - this.x, 2) + Math.pow(this.centerY - this.y, 2));
      this.angle = random(0, Math.PI * 2);
      this.speed = random(0.003, 0.006);
      this.hue = random(0, 1) > 0.5 ? random(0, 80) : random(160, 260);
      this.alpha = 0;
      this.alphaDecay = random(0.001, 0.015);
      this.alphaMax = random(0, 1);
      this.coordinates = [];
      this.coordinatesCount = random(10, 20);
      this.coordinates.push([this.x, this.y]);
      this.hsl = hslToHex(this.hue, 80, 60);
      this.width = random(0.5, 5);

      this.graphics = new PIXI.Graphics();
      this.graphics.position.set(0, 0);
      this.draw();
      container.addChild(this.graphics);
    }

    destroy() {
      this.graphics.destroy({ children: true, texture: true, baseTexture: true });
      container.removeChild(this.graphics);
    }

    // 绘制星星
    draw() {
      if (
        (this.coordinates[this.coordinates.length - 1][0] - this.x) *
          (this.coordinates[this.coordinates.length - 1][0] - this.x) +
          (this.coordinates[this.coordinates.length - 1][1] - this.y) *
            (this.coordinates[this.coordinates.length - 1][1] - this.y) >
        40000
      )
        return;
      this.graphics.beginFill();
      this.graphics.clear();
      this.graphics
        .lineStyle(this.width, this.hsl, this.alpha)
        .moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1])
        .lineTo(this.x, this.y);
      this.graphics.endFill();
    }

    // 更新星星的位置
    update(delta: number) {
      while (this.coordinates.length > this.coordinatesCount) {
        this.coordinates.pop();
      }
      this.coordinates.unshift([this.x, this.y]);

      this.angle += this.speed * delta;
      this.x = this.centerX + Math.cos(this.angle) * this.radius;
      this.y = this.centerY + Math.sin(this.angle) * this.radius;
      if (this.alpha < this.alphaMax) {
        this.alpha += this.alphaDecay;
      }
      this.radius += delta;
      this.draw();
    }
  }

  const starsCount = 200;

  // 添加多个星星到场景中
  const stars: Star[] = [];
  for (let i = 0; i < starsCount; i++) {
    const star = new Star(random(0, app.screen.width / 2), random(0, app.screen.height / 2));
    stars.push(star);
  }

  function tickerFn(delta: number) {
    while (stars.length < starsCount) {
      const star = new Star(random(0, app.screen.width / 2), random(0, app.screen.height / 2));
      stars.push(star);
    }
    stars.forEach((star) => {
      star.update(delta);
      if (star.radius > app.screen.width / 1.5) {
        stars.splice(stars.indexOf(star), 1);
        star.destroy();
      }
    });
  }

  // 注册动画
  WebGAL!.gameplay!.pixiStage!.registerAnimation(
    { setStartState: () => {}, setEndState: () => {}, tickerFunc: tickerFn },
    'starRail-Ticker',
  );

  return { container, tickerKey: 'starRail-Ticker' };
};

// 注册特效
registerPerform('starRail', () => starRail());
