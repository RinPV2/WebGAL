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
            const container = document.getElementById('chooseContainer');
            if (container) {
                ReactDOM.unmountComponentAtNode(container);  // 清除内容
            }
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
    // 运行时计算JSX.Element[]
    function getProperty(progress: number) {
        return `brightness(${1.0 + 1.5 * progress / 100}) drop-shadow(0 0 ${progress / 10}px white) blur(${10.0 * (100 - progress) / 100}px)`;
    }
    const runtimeBuildList = (chooseListFull: ChooseOption[]) => {
        return chooseListFull
            .filter((e, i) => whenChecker(e.showCondition))
            .map((e, i) => {
                const enable = whenChecker(e.enableCondition);
                let isLongPressTrigger = false;
                let progressElement: HTMLElement | null = null;
                let currentProgress = 0; // 当前进度
                const chkLongPress = e.text.split('-');
                if (chkLongPress.length > 1)
                    isLongPressTrigger = true;
                const className = `${(enable ? '' : styles.Choose_item_disabled)}  ${styles.Choose_item} ${(isLongPressTrigger ? styles.Choose_item_long : '')}`;
                const showText = chkLongPress[0];
                // 新增长按处理逻辑
                let timeoutId: ReturnType<typeof setTimeout> | null = null;

                const handleMouseDown = (event: React.MouseEvent) => {
                    if (!enable) return;
                    if (!isLongPressTrigger) return;

                    // 获取进度条元素
                    progressElement = event.currentTarget as HTMLElement;
                    console.log(e.text, e);

                    if (progressElement) {
                        console.log('长按触发了！', event.currentTarget, progressElement);
                        progressElement.style.setProperty('filter', getProperty(currentProgress));
                    }

                    clearInterval(timeoutId!);
                    timeoutId = setInterval(() => {
                        currentProgress += (100 / longPressTime) * 50; // 5秒 = 5000ms，每次更新增加的宽度
                        if (progressElement) {
                            progressElement.style.setProperty('filter', getProperty(currentProgress));
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
                            progressElement.style.setProperty('filter', getProperty(currentProgress));
                        }
                    }, 50);
                };

                const handleMouseEnter = (event: React.MouseEvent) => {
                    if (!enable) return;
                    document.querySelectorAll(`.${styles.Choose_item}:not(.${styles.Choose_item_disabled})`).forEach(sibling => {
                        if (sibling !== event.currentTarget) { // 排除当前悬停的元素
                            (sibling as HTMLElement).style.opacity = '0.5';
                        }
                    });
                };

                const handleMouseLeave = () => {
                    handleMouseUp();
                    if (!enable) return;
                    document.querySelectorAll(`.${styles.Choose_item}`).forEach(sibling => {
                        (sibling as HTMLElement).style.opacity = '1';
                    });
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
                    : () => { };
                return (
                    <div className={className}
                        style={{ fontFamily: font }}
                        onClick={onClick}
                        key={e.jump + i}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onMouseEnter={handleMouseEnter}>
                        {showText}
                    </div>
                );
            });
    };

    return <div className={styles.Choose_Main}>{runtimeBuildList(props.chooseOptions)}</div>;
}
