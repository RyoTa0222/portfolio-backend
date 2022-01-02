import {createClient, ContentfulClientApi} from "contentful";
import {ContentfulConfig, ContentfulPreviewConfig} from "../types/interface";
import {config} from "../consts/config";

const ctfConfig: ContentfulConfig = {
  space: config.contentful.space_id,
  accessToken: config.contentful.access_token,
};

const ctfPreviewConfig: ContentfulPreviewConfig = {
  space: config.contentful.space_id,
  accessToken: config.contentful.preview_access_token,
  host: "preview.contentful.com",
};

// https://www.contentful.com/developers/docs/references/content-delivery-api/
const plugin = (arg: { preview: any } | undefined): ContentfulClientApi => {
  if (arg?.preview) {
    return createClient(ctfPreviewConfig);
  }
  return createClient(ctfConfig);
};

export default plugin;
