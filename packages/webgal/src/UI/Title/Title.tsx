import { FC, useEffect, useRef } from 'react';
import styles from './title.module.scss';
import { playBgm } from '@/Core/controller/stage/playBgm';
import { continueGame, startGame } from '@/Core/controller/gamePlay/startContinueGame';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, webgalStore } from '@/store/store';
import { setMenuPanelTag, setVisibility } from '@/store/GUIReducer';
import { MenuPanelTag } from '@/store/guiInterface';
import useTrans from '@/hooks/useTrans';
// import { resize } from '@/Core/util/resize';
import { hasFastSaveRecord, loadFastSaveGame } from '@/Core/controller/storage/fastSaveLoad';
import useSoundEffect from '@/hooks/useSoundEffect';
import useApplyStyle from '@/hooks/useApplyStyle';
import { fullScreenOption } from '@/store/userDataInterface';
import { keyboard } from '@/hooks/useHotkey';
import useConfigData from '@/hooks/useConfigData';
import * as PIXI from 'pixi.js';
import { WebGAL } from '@/Core/WebGAL';
import { SCREEN_CONSTANTS } from '@/Core/util/constants';
import { logger } from '@/Core/util/logger';
import { GlowFilter } from '@pixi/filter-glow';
/**
 * 标题页
 * @constructor
 */
const Title: FC = () => {
  const effectsContainer = useRef<HTMLDivElement | null>(null);
  const scalePreset = 0.07;
  const cherryBlossomsSpeed = 3.5;
  const stageWidth = SCREEN_CONSTANTS.width;
  const stageHeight = SCREEN_CONSTANTS.height;
  const userDataState = useSelector((state: RootState) => state.userData);
  const GUIState = useSelector((state: RootState) => state.GUI);
  const dispatch = useDispatch();
  const fullScreen = userDataState.optionData.fullScreen;
  const background = GUIState.titleBg;
  const showBackground = background === '' ? 'rgba(0,0,0,1)' : `url("${background}")`;
  const t = useTrans('title.');
  const { playSeEnter, playSeClick } = useSoundEffect();

  const applyStyle = useApplyStyle('UI/Title/title.scss');
  useConfigData(); // 监听基础ConfigData变化

  useEffect(() => {
    if (GUIState.showTitle) {
      // 初始化 PIXI 应用程序
      const app = new PIXI.Application({
        width: stageWidth,
        height: stageHeight,
        transparent: true, // 背景透明
      });

      // 将 PIXI 的 canvas 元素添加到 pixiContainer 中
      if (effectsContainer.current) {
        effectsContainer.current.appendChild(app.view);
      }

      // 添加粒子容器
      const container = new PIXI.ParticleContainer();
      container.x = app.screen.width / 2;
      container.y = app.screen.height / 2;
      container.pivot.x = container.width / 2;
      container.pivot.y = container.height / 2;
      container.scale.x = 1;
      container.scale.y = 1;
      app.stage.addChild(container);

      const texture = PIXI.Texture.from('./game/tex/cherryBlossoms.png');
      const bunnyList: PIXI.Sprite[] = []; // 存储所有花瓣对象
      const maxBunnyCount = 50; // 控制最大花瓣数

      // 生成花瓣
      for (let i = 0; i < maxBunnyCount; i++) {
        const bunny = new PIXI.Sprite(texture);
        resetParticle(bunny);
        container.addChild(bunny);
        bunnyList.push(bunny);
      }

      function resetParticle(particle: PIXI.Sprite) {
        let scaleRandX = 1 - 0.9 * Math.random();
        let scaleRandY = (1 - (0.3 - 0.6 * Math.random())) * scaleRandX;
        particle.scale.x = scalePreset * scaleRandX;
        particle.scale.y = scalePreset * scaleRandY;
        particle.anchor.set(0.5);
        particle.alpha = 1 - 0.2 * scaleRandX;
        particle.x = Math.random() * stageWidth - 0.5 * stageWidth;
        particle.y = 0 - (0.5 + Math.random() * 0.3) * stageHeight;
        (particle as any).dropSpeed = (1 - Math.random() * 0.5) * scaleRandX * scaleRandY * 0.01 + 0.002;
      }

      // 更新花瓣动画
      function tickerFn(delta: number) {
        let windStrength = (0.3 + Math.random()) * 0.3; // 模拟风的强度
        bunnyList.forEach((e, index) => {
          e.y += delta * cherryBlossomsSpeed * (e as any).dropSpeed + (Math.sin(e.y / 100 + index) + 0.3) * windStrength * 0.2 * Math.random();

          // 使用 Math.sin 模拟风的左右摆动效果
          e.x += windStrength * (Math.sin(e.y / 100 + index) + Math.cos(e.y / 50) * 0.5 * Math.random()) * e.scale.x / scalePreset;

          // 添加旋转效果
          const randomNumber = Math.random() * 1000;
          const addX = Math.random() < 0.5;
          if (addX) {
            e.rotation += 2;
            // e.alpha -= 0.05 * delta;
          } else {
            e.rotation += 2;
            // e.alpha += 0.1 * delta;
          }

          // 检查是否到达屏幕底部，重置位置
          if (e.y > stageHeight / 2) {
            e.x = Math.random() * stageWidth - 0.5 * stageWidth;
            e.y = 0 - (0.5 + Math.random() * 0.3) * stageHeight;
          }
          if (e.x > stageWidth / 2) {
            e.x -= stageWidth * 1.1;
          }
          if (e.x < -stageWidth / 2) {
            e.x += stageWidth * 1.1;
          }
        })
      }

      // 每一帧更新特效
      app.ticker.add(() => {
        tickerFn(app.ticker.deltaMS);
      });

      // 组件卸载时清理 PIXI 应用
      return () => {
        app.destroy(true, { children: true });
      };
    }
  }, [GUIState.showTitle]);


  return (
    <>
      {GUIState.showTitle && <div className={applyStyle('Title_backup_background', styles.Title_backup_background)} />}
      <div
        id="enter_game_target"
        onClick={() => {
          playBgm(GUIState.titleBgm);
          dispatch(setVisibility({ component: 'isEnterGame', visibility: true }));
          if (fullScreen === fullScreenOption.on) {
            document.documentElement.requestFullscreen();
            if (keyboard) keyboard.lock(['Escape', 'F11']);
          }
        }}
        onMouseEnter={playSeEnter}
      />
      {GUIState.showTitle && (
        <div
          className={applyStyle('Title_main', styles.Title_main)}
          style={{
            backgroundImage: showBackground,
            backgroundSize: 'cover',
          }}
        >
          <div ref={effectsContainer} className={styles.Title_pixi_canvas}></div> {/* 特效层 */}
          <div className={applyStyle('Title_buttonList', styles.Title_buttonList)}>
            <div
              className={applyStyle('Title_button', styles.Title_button)}
              onClick={() => {
                startGame();
                playSeClick();
              }}
              onMouseEnter={playSeEnter}
            >
              <div className={applyStyle('Title_button_text', styles.Title_button_text)}>{t('start.title')}</div>
            </div>
            <div
              className={applyStyle('Title_button', styles.Title_button)}
              onClick={async () => {
                playSeClick();
                dispatch(setVisibility({ component: 'showTitle', visibility: false }));
                continueGame();
              }}
              onMouseEnter={playSeEnter}
            >
              <div className={applyStyle('Title_button_text', styles.Title_button_text)}>{t('continue.title')}</div>
            </div>
            <div
              className={applyStyle('Title_button', styles.Title_button)}
              onClick={() => {
                playSeClick();
                dispatch(setVisibility({ component: 'showMenuPanel', visibility: true }));
                dispatch(setMenuPanelTag(MenuPanelTag.Option));
              }}
              onMouseEnter={playSeEnter}
            >
              <div className={applyStyle('Title_button_text', styles.Title_button_text)}>{t('options.title')}</div>
            </div>
            <div
              className={applyStyle('Title_button', styles.Title_button)}
              onClick={() => {
                playSeClick();
                dispatch(setVisibility({ component: 'showMenuPanel', visibility: true }));
                dispatch(setMenuPanelTag(MenuPanelTag.Load));
              }}
              onMouseEnter={playSeEnter}
            >
              <div className={applyStyle('Title_button_text', styles.Title_button_text)}>{t('load.title')}</div>
            </div>
            <div
              className={applyStyle('Title_button', styles.Title_button)}
              onClick={() => {
                playSeClick();
                dispatch(setVisibility({ component: 'showExtra', visibility: true }));
              }}
              onMouseEnter={playSeEnter}
            >
              <div className={applyStyle('Title_button_text', styles.Title_button_text)}>{t('extra.title')}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Title;
