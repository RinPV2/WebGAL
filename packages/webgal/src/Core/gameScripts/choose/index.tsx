import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { changeScene } from '@/Core/controller/scene/changeScene';
import { jmp } from '@/Core/gameScripts/label/jmp';
import ReactDOM from 'react-dom';
import React from 'react';
import styles from './choose.module.scss';
import { webgalStore } from '@/store/store';
import { textFont } from '@/store/userDataInterface';
import { PerformController } from '@/Core/Modules/perform/performController';
import { useSEByWebgalStore } from '@/hooks/useSoundEffect';
import { WebGAL } from '@/Core/WebGAL';
import { whenChecker } from '@/Core/controller/gamePlay/scriptExecutor';
import useEscape from '@/hooks/useEscape';
import useApplyStyle from '@/hooks/useApplyStyle';
import { Provider } from 'react-redux';

class ChooseOption {
  /**
   * 格式：
   * (showConditionVar>1)[enableConditionVar>2]->text:jump
   */
  public static parse(script: string): ChooseOption {
    const parts = script.split('->');
    const conditonPart = parts.length > 1 ? parts[0] : null;
    const mainPart = parts.length > 1 ? parts[1] : parts[0];
    const mainPartNodes = mainPart.split(/(?<!\\):/g);
    const option = new ChooseOption(mainPartNodes[0], mainPartNodes[1]);
    if (conditonPart !== null) {
      const showConditionPart = conditonPart.match(/\((.*)\)/);
      if (showConditionPart) {
        option.showCondition = showConditionPart[1];
      }
      const enableConditionPart = conditonPart.match(/\[(.*)\]/);
      if (enableConditionPart) {
        option.enableCondition = enableConditionPart[1];
      }
    }
    return option;
  }
  public text: string;
  public jump: string;
  public jumpToScene: boolean;
  public showCondition?: string;
  public enableCondition?: string;

  public constructor(text: string, jump: string) {
    this.text = useEscape(text);
    this.jump = jump;
    this.jumpToScene = jump.match(/(?<!\\)\./) !== null;
  }
}

/**
 * 显示选择枝
 * @param sentence
 */
export const choose = (sentence: ISentence): IPerform => {
  const chooseOptionScripts = sentence.content.split(/(?<!\\)\|/);
  const chooseOptions = chooseOptionScripts.map((e) => ChooseOption.parse(e));

  // eslint-disable-next-line react/no-deprecated
  ReactDOM.render(
    <Provider store={webgalStore}>
      <Choose chooseOptions={chooseOptions} />
    </Provider>,
    document.getElementById('chooseContainer'),
  );
  return {
    performName: 'choose',
    duration: 1000 * 60 * 60 * 24,
    isHoldOn: false,
    stopFunction: () => {
      // eslint-disable-next-line react/no-deprecated
      ReactDOM.render(<div />, document.getElementById('chooseContainer'));
    },
    blockingNext: () => true,
    blockingAuto: () => true,
    stopTimeout: undefined, // 暂时不用，后面会交给自动清除
  };
};

function Choose(props: { chooseOptions: ChooseOption[] }) {
  const fontFamily = webgalStore.getState().userData.optionData.textboxFont;
  const font = fontFamily === textFont.song ? '"思源宋体", serif' : '"WebgalUI", serif';
  const longPressTime = 3000; // 长按时间 5 秒
  const decreaseWidth = 2.5; // 每次减少的宽度
  const { playSeEnter, playSeClick } = useSEByWebgalStore();
  const applyStyle = useApplyStyle('Stage/Choose/choose.scss');
  // 运行时计算JSX.Element[]
  const runtimeBuildList = (chooseListFull: ChooseOption[]) => {
    return chooseListFull
      .filter((e, i) => whenChecker(e.showCondition))
      .map((e, i) => {
        const enable = whenChecker(e.enableCondition);
        const className = enable
          ? applyStyle('Choose_item', styles.Choose_item)
          : applyStyle('Choose_item_disabled', styles.Choose_item_disabled);
        
        let isLongPressTrigger = false;
        let progressElement: HTMLElement | null = null;
        let currentProgress = 0; // 当前进度
        const chkLongPress = e.text.split('-');
        if(chkLongPress.length > 1) 
          isLongPressTrigger = true;
        const showText = chkLongPress[0];
        // 新增长按处理逻辑
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const handleMouseDown = (event: React.MouseEvent) => {
          if (!enable) return;
          if (!isLongPressTrigger) return;
        
          // 获取进度条元素
          progressElement = (event.currentTarget as HTMLElement).firstElementChild?.firstElementChild as HTMLElement;
          console.log(e.text, e);
        
          if (progressElement) {
            console.log('长按触发了！', event.currentTarget, progressElement);
            progressElement.style.setProperty('--progress-width', `${currentProgress}%`);
          }
        
          clearInterval(timeoutId!); 
          timeoutId = setInterval(() => {
            currentProgress += (100 / longPressTime) * 50; // 5秒 = 5000ms，每次更新增加的宽度
            if (progressElement) {
              progressElement.style.setProperty('--progress-width', `${currentProgress}%`);
            }
            // 当进度条满了，触发点击事件
            if (currentProgress >= 100) {
              clearInterval(timeoutId!);
              console.log('点击触发了');
              if (e.jumpToScene) {
                changeScene(e.jump, e.text);
              } else {
                jmp(e.jump);
              }
              WebGAL.gameplay.performController.unmountPerform('choose');
            }
          }, 50); // 每50毫秒更新一次
        };

        const handleMouseUp = () => {
          if (!enable) return;
          if (!isLongPressTrigger) return;
          clearInterval(timeoutId!); 
          timeoutId = setInterval(() => {
            currentProgress -= decreaseWidth; // 每次减少指定的速度
            if (currentProgress <= 0) {
              currentProgress = 0; // 确保不会小于0
              clearInterval(timeoutId!); // 停止减少
              console.log('进度条复位到0，停止检测');
            }
            if (progressElement) {
              progressElement.style.setProperty('--progress-width', `${currentProgress}%`);
            }
          }, 50);
        };

        const onClick = enable
          ? () => {
              if (isLongPressTrigger) return;
              playSeClick();
              if (e.jumpToScene) {
                changeScene(e.jump, e.text);
              } else {
                jmp(e.jump);
              }
              WebGAL.gameplay.performController.unmountPerform('choose');
            }
          : () => {};
        return (
          <div 
            className={applyStyle('Choose_item_outer', styles.Choose_item_outer)} 
            key={e.jump + i} 
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}>
            <div className={className} style={{ fontFamily: font }} onClick={onClick} onMouseEnter={playSeEnter}>
              {showText}
              {isLongPressTrigger && (<div className={applyStyle('Progress_bar', styles.Progress_bar)}/>)}
            </div>
          </div>
        );
      });
  };

  return <div className={applyStyle('Choose_Main', styles.Choose_Main)}>{runtimeBuildList(props.chooseOptions)}</div>;
}
