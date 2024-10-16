import { setStage, stageActions } from "@/store/stageReducer";
import { RootState, webgalStore } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { ISentence } from "../controller/scene/sceneInterface";
import { IPerform } from "../Modules/perform/performInterface";
import { setVisibility } from "@/store/GUIReducer";
import { logger } from "../util/logger";

/**
 * 开启地震
 * @param sentence
 */
export const enableEarthquake = (sentence: ISentence): IPerform => {
    const on = sentence.content === 'on';
    const dispatch = webgalStore.dispatch;
    logger.info('enableEarthquake', on);
    dispatch(setStage({ key: 'enableEarthquake', value: on }));
    return {
        performName: 'none',
        duration: 0,
        isHoldOn: false,
        stopFunction: () => {},
        blockingNext: () => false,
        blockingAuto: () => true,
        stopTimeout: undefined, // 暂时不用，后面会交给自动清除
    };
};