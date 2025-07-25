import { firestore } from "@/config/firebase";
import { ResponseType, UserDataType } from "@/types";
import { doc, updateDoc } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageServices";

export const updateUser = async (
  uid: string,
  updatedData: UserDataType
): Promise<ResponseType> => {
  try {
    // image upload pending
    if (updatedData.image && updatedData?.image?.uri) {
      const uploadResponse = await uploadFileToCloudinary(
        updatedData.image,
        "users"
      );
      if (!uploadResponse.success) {
        return { success: false, msg: uploadResponse.msg };
      }
      updatedData.image = uploadResponse.data;
    }

    const userRef = doc(firestore, "users", uid);
    await updateDoc(userRef, updatedData);
    return { success: true, msg: "User updated successfully" };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, msg: (error as Error)?.message };
  }
};
