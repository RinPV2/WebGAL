import { stageActions } from '@/store/stageReducer';
import { RootState, webgalStore } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { ISentence } from '../controller/scene/sceneInterface';
import { IPerform } from '../Modules/perform/performInterface';
import { setVisibility } from '@/store/GUIReducer';
import { loadGame } from '../controller/storage/loadGame';
import { saveGame } from '../controller/storage/saveGame';

/**
 * 策划用的隐藏存档
 * @param sentence
 */
export const hideSave = (sentence: ISentence): IPerform => {
  console.log('hideSave', sentence.content);
  let trueIndex = parseInt(sentence.content);
  saveGame(-trueIndex);
  return {
    performName: 'none',
    duration: 0,
    isHoldOn: false,
    stopFunction: () => {},
    blockingNext: () => true,
    blockingAuto: () => true,
    stopTimeout: undefined, // 暂时不用，后面会交给自动清除
  };
};
