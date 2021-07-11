import {createClient, ContentfulClientApi} from "contentful";
import {ContentfulConfig} from "../types/interface";
import {config} from "../consts/config";

const ctfConfig: ContentfulConfig = {
  space: config.contentful.space_id,
  accessToken: config.contentful.access_token,
};

// https://www.contentful.com/developers/docs/references/content-delivery-api/
const plugin = (): ContentfulClientApi => {
  return createClient(ctfConfig);
};

export default plugin;
