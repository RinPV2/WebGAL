import * as PIXI from 'pixi.js';
import { registerPerform } from '@/Core/util/pixiPerformManager/pixiPerformManager';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';
import { WebGAL } from '@/Core/WebGAL';
import de from '@/translations/de';
import { t } from 'i18next';
import { rand } from 'pixi-live2d-display-webgal';

const starRail = () => {
  const effectsContainer = WebGAL!.gameplay!.pixiStage!.effectsContainer;
  const app = WebGAL!.gameplay!.pixiStage!.currentApp!;
  const container = new PIXI.Container();
  const bloomFilter = new AdvancedBloomFilter({
    threshold: 0.1, // 较低的值会增强光晕效果
    bloomScale: 2, // 增强光晕强度
    brightness: 1, // 提高亮度
    blur: 2, // 增加模糊半径
    quality: 20, // 增加模糊质量
  });
  container.filters = [bloomFilter];
  effectsContainer.addChild(container);

  // 将容器移到中心
  container.x = app.screen.width / 2;
  container.y = app.screen.height;
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

  // 找共切点,简化问题圆心在原点
  function findTangentPoints(x1: number, y1: number, x2: number, y2: number): number[] {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const r = Math.sqrt(x1 * x1 + y1 * y1);
    const dm = Math.sqrt(mx * mx + my * my);
    const length = (r * r) / dm;
    const rx = (mx * length) / dm;
    const ry = (my * length) / dm;
    return [rx, ry];
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
    tailAngle: number;
    tail: number;
    tailDecay: number;

    constructor() {
      this.centerX = 0;
      this.centerY = 0;
      this.radius = random(app.screen.width / 8, app.screen.width / 1.5);
      this.angle = random(0, Math.PI * 2);
      this.x = this.centerX + Math.cos(this.angle) * this.radius;
      this.y = this.centerY + Math.sin(this.angle) * this.radius;
      this.tailAngle = random(Math.PI / 4, Math.PI / 3);
      this.speed = random(0.005, 0.02) / 5;
      this.tail = Math.PI / 4;
      this.tailDecay = this.speed / random(200, 500);
      this.hue = random(80, 270);
      this.alphaDecay = random(0.003, 0.006);
      this.alphaMax = random(0.8, 1);
      this.alpha = 0.01;
      this.coordinates = [];
      this.coordinatesCount = random(225, 325);
      this.hsl = hslToHex(this.hue, random(10, 40), random(40, 50));
      this.width = random(1.5, 3);

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
      const tailX = this.centerX + Math.cos(this.angle + this.tail) * this.radius;
      const tailY = this.centerY + Math.sin(this.angle + this.tail) * this.radius;
      const arcStart = findTangentPoints(tailX, tailY, this.x, this.y);
      this.graphics.beginFill();
      this.graphics.clear();
      this.graphics
        .moveTo(tailX, tailY)
        .lineStyle(this.width, this.hsl, this.alpha)
        .arcTo(arcStart[0], arcStart[1], this.x, this.y, this.radius);
      this.graphics.endFill();
    }

    // 更新星星的位置
    update(delta: number) {
      if (this.coordinates.length > this.coordinatesCount) {
        this.coordinates.pop();
      }
      this.coordinates.unshift([this.x, this.y]);

      this.angle -= this.speed * delta;
      this.x = this.centerX + Math.cos(this.angle) * this.radius;
      this.y = this.centerY + Math.sin(this.angle) * this.radius;
      this.alpha = Math.min(this.alphaDecay + this.alpha, this.alphaMax);
      if (this.tail < this.tailAngle) {
        this.tail += this.tailDecay;
      }
      this.draw();
    }
  }

  const starsCount = 200;

  // 添加多个星星到场景中
  const stars: Star[] = [];
  for (let i = 0; i < starsCount; i++) {
    const star = new Star();
    stars.push(star);
  }

  function tickerFn(delta: number) {
    while (stars.length < starsCount) {
      const star = new Star();
      stars.push(star);
    }
    stars.forEach((star) => {
      star.update(delta);
      if (Math.random() > 0.9995) {
        star.alphaDecay = -star.alphaDecay * 2;
      }
      if (star.alpha <= 0) {
        star.destroy();
        stars.splice(stars.indexOf(star), 1);
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
