import { stageActions } from "@/store/stageReducer";
import { RootState, webgalStore } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { ISentence } from "../controller/scene/sceneInterface";
import { IPerform } from "../Modules/perform/performInterface";
import { setVisibility } from "@/store/GUIReducer";
import { loadGame } from "../controller/storage/loadGame";

/**
 * 从圣典返回
 * @param sentence
 */
export const backFromBook = (sentence: ISentence): IPerform => {
    const dispatch = webgalStore.dispatch;
    dispatch(setVisibility({ component: 'showBook', visibility: false}));
    loadGame(0);
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