import {Request, Response, NextFunction} from "express";
import createClient from "../plugins/contentful";
import r from "../utils/response";
import {RoadmapItem, RoadmapFields} from "../types/interface";
import {ROADMAP_TYPE} from "../consts/config";

const client = createClient();

/**
  * ロードマップの取得
  * @param {Request} req
  * @param {Response} res
  * @param {NextFunction} next
  */
const getRoadmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // contentfulからデータ取得
    const entries = await client.getEntries({
      content_type: "roadmap",
    });
    const schedule: RoadmapItem[] = [];
    const develop: RoadmapItem[] = [];
    const merge: RoadmapItem[] = [];
    const data = {schedule, develop, merge};
    if (entries && entries.items) {
      entries.items.forEach((item) => {
        console.log(item);
        const fields = item.fields as RoadmapFields;
        if (fields.state.length > 0 && ROADMAP_TYPE.includes(fields.state[0])) {
          data[fields.state[0]].push({
            label: fields.content,
            completed: fields.completed,
          });
        }
      });
    }
    r.success(res, data);
  } catch (err) {
    next(Object.assign(err, {function: "getRoadmap"}));
    r.error500(res, err.message);
  }
};


export default {getRoadmap};
