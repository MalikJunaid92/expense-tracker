import { firestore } from "@/config/firebase";
import { ResponseType, WalletType } from "@/types";
import { collection, doc, setDoc } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageServices";

export const createOrUpdateWallet = async (
  walletData: Partial<WalletType>
): Promise<ResponseType> => {
  try {
    let walletToSave = { ...walletData };
    if (walletData.image) {
      const uploadResponse = await uploadFileToCloudinary(
        walletData.image,
        "wallets"
      );
      if (!uploadResponse.success) {
        return {
          success: false,
          msg: uploadResponse.msg || "Image upload failed",
        };
      }
      walletToSave.image = uploadResponse.data;
    }
    if (!walletData?.id) {
      // new wallet creation logic
      walletToSave.amount = 0;
      walletToSave.totalExpenses = 0;
      walletToSave.totalIncome = 0;
      walletToSave.created = new Date();
    }
    const walletRef = walletData?.id
      ? doc(firestore, "wallets", walletData?.id)
      : doc(collection(firestore, "wallets"));

    await setDoc(walletRef, walletToSave, { merge: true }); // updates only the data provided
    return { success: true, data: { ...walletToSave, id: walletRef.id } };
  } catch (error: any) {
    console.error("Error creating or updating wallet:", error);
    return { success: false, msg: error.message };
  }
};