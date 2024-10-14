import { stageActions } from "@/store/stageReducer";
import { RootState, webgalStore } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { ISentence } from "../controller/scene/sceneInterface";
import { IPerform } from "../Modules/perform/performInterface";
import { setVisibility } from "@/store/GUIReducer";

/**
 * 开启/关闭对话记录图标
 * @param sentence
 */
export const isGuiding = (sentence: ISentence): IPerform => {
    const on = sentence.content === 'on';
    const dispatch = webgalStore.dispatch;
    dispatch(setVisibility({ component: 'isGuiding', visibility: on }));
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