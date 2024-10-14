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
/**
 * 标题页
 * @constructor
 */
const Title: FC = () => {
  const effectsContainer = useRef<HTMLDivElement | null>(null);
  const scalePreset = 0.15;
  const cherryBlossomsSpeed = 3;
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
      if(GUIState.showTitle){
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

      // 添加简单的特效 (如粒子效果，雪花效果等)
      const container = new PIXI.ParticleContainer();
      app.stage.addChild(container);


      const texture = PIXI.Texture.from('./game/tex/cherryBlossoms.png');
      // コンテナを中央に移動
      // 将容器移到中心
      container.x = app.screen.width / 2;
      container.y = app.screen.height / 2;
      container.pivot.x = container.width / 2;
      container.pivot.y = container.height / 2;
      // ズームを調整
      // 调整缩放
      container.scale.x = 1;
      container.scale.y = 1;
      // container.rotation = -0.2;
      const bunnyList: any = [];
      // アニメーションの更新を監視
      // 监听动画更新
      function tickerFn(delta: number) {
        // 桜の位置を制御するために使用される長さと幅を取得します
        // 获取长宽，用于控制花出现位置
        // オブジェクトを作成
        // 创建对象
        const bunny = new PIXI.Sprite(texture);
        let scaleRand = 0.25;

        bunny.scale.x = scalePreset * scaleRand;
        bunny.scale.y = scalePreset * scaleRand;
        // アンカーポイントを設定
        // 设置锚点
        bunny.anchor.set(0.5);
        // ランダムな桜の位置
        // 随机花位置
        bunny.x = Math.random() * stageWidth - 0.5 * stageWidth;
        bunny.y = 0 - 0.5 * stageHeight;
        // @ts-ignore
        bunny['dropSpeed'] = Math.random() * 5;
        // @ts-ignore
        bunny['acc'] = Math.random();
        container.addChild(bunny);
        bunnyList.push(bunny);

        let count = 0;
        for (const e of bunnyList) {
          count++;
          const randomNumber = Math.random();
          e['dropSpeed'] = e['acc'] * 0.01 + e['dropSpeed'];
          e.y += delta * cherryBlossomsSpeed * e['dropSpeed'] * 0.3 + 0.7;
          const addX = count % 2 === 0;
          if (addX) {
            e.x += delta * randomNumber * 0.5;
            e.rotation += delta * randomNumber * 0.03;
          } else {
            e.x -= delta * randomNumber * 0.5;
            e.rotation -= delta * randomNumber * 0.03;
          }
        }
        // 同じ画面上の桜の数を制御します
        // 控制同屏花数
        if (bunnyList.length >= 200) {
          bunnyList.shift()?.destroy();
          container.removeChild(container.children[0]);
        }
      }

      app.ticker.add(() => {
        // 每一帧更新特效，移动矩形
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
          <div ref={effectsContainer} className={styles.pixiCanvas}></div> {/* 特效层 */}
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
