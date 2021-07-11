import {db} from "../plugins/firestore";


export const postBlogLgtm = async (id: string) => {
  const blogRef = db.collection("blog").doc(id);
  const res = await blogRef.set({
    good: 0,
    bad: 0,
  }, {merge: true});
  return res;
};
