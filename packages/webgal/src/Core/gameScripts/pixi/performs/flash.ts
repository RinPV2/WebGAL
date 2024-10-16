import * as PIXI from 'pixi.js';
import { registerPerform } from '@/Core/util/pixiPerformManager/pixiPerformManager';
import { WebGAL } from '@/Core/WebGAL';
import { time } from 'console';

const flashEffect = () => {
    const effectsContainer = WebGAL!.gameplay!.pixiStage!.effectsContainer;
    const app = WebGAL!.gameplay!.pixiStage!.currentApp!;
    
    // 创建一个容器
    const container = new PIXI.Container();
    effectsContainer.addChild(container);
    const flash = new PIXI.Graphics();
    flash.beginFill(0xffffff); // 白色
    flash.drawRect(0, 0, app.screen.width, app.screen.height); // 覆盖整个屏幕
    flash.endFill();

    // 添加到效果容器
    effectsContainer.addChild(flash);

    // 设置初始透明度为 1（完全不透明）
    flash.alpha = 1;

    // 半秒后开始渐变透明
    function tickerFn(delta: number){
        flash.alpha -= 0.02 * delta; // 0.02 * 60 = 1s
        if (flash.alpha <= 0) {
            WebGAL!.gameplay!.pixiStage!.removeAnimation('flashEffect-Ticker');
        }
    }

    // 注册动画
    WebGAL!.gameplay!.pixiStage!.registerAnimation(
        { setStartState: () => {}, setEndState: () => {}, tickerFunc: tickerFn },
        'flashEffect-Ticker',
    );

    return { container, tickerKey: 'flashEffect-Ticker' };
};

// 注册特效
registerPerform('flash', () => flashEffect());
