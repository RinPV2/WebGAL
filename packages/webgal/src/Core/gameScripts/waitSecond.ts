import { stageActions } from '@/store/stageReducer';
import { RootState, webgalStore } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { ISentence } from '../controller/scene/sceneInterface';
import { IPerform } from '../Modules/perform/performInterface';
import { setVisibility } from '@/store/GUIReducer';

/**
 * 开启/关闭对话记录图标
 * @param sentence
 */
export const waitSecond = (sentence: ISentence): IPerform => {
  const duration = parseFloat(sentence.content);
  console.log('waitSecond', duration);
  return {
    performName: 'waitSecond',
    duration: duration * 1000,
    isHoldOn: false,
    stopFunction: () => {},
    blockingNext: () => true,
    blockingAuto: () => true,
    stopTimeout: undefined, // 暂时不用，后面会交给自动清除
  };
};
