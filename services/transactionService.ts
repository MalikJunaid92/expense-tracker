import { firestore } from "@/config/firebase";
import { ResponseType, TransactionType, WalletType } from "@/types";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageServices";
import { createOrUpdateWallet } from "./walletService";

// helper to clean undefined fields
function removeUndefinedFields<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
}

export const createOrUpdateTransaction = async (
  transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
  try {
    const { id, type, walletId, amount, image } = transactionData;

    if (!walletId || !amount || amount <= 0 || !type) {
      return { success: false, msg: "Invalid transaction data" };
    }

    if (id) {
      const oldTransactionRef = doc(firestore, "transactions", id);
      const oldTransactionSnapshot = await getDoc(oldTransactionRef);
      const oldTransaction = oldTransactionSnapshot.data() as TransactionType;

      const shouldRevertOriginal =
        oldTransaction.type !== type ||
        oldTransaction.amount !== amount ||
        oldTransaction.walletId !== walletId;

      if (shouldRevertOriginal) {
        let res = await revertAndUpdateWallet(
          oldTransaction,
          Number(amount),
          type,
          walletId
        );
        if (!res?.success) {
          return res;
        }
      }
    } else {
      let res = await updateWalletForNewTransaction(
        walletId!,
        Number(amount!),
        type
      );
      if (!res?.success) {
        return res;
      }
    }

    if (image) {
      const uploadResponse = await uploadFileToCloudinary(
        image,
        "transactions"
      );
      if (!uploadResponse.success) {
        return { success: false, msg: uploadResponse.msg };
      }
      transactionData.image = uploadResponse.data;
    }

    const transactionRef = id
      ? doc(firestore, "transactions", id)
      : doc(collection(firestore, "transactions"));

    // ✅ Clean the object to remove undefined fields
    const cleanedTransactionData = removeUndefinedFields(transactionData);

    await setDoc(transactionRef, cleanedTransactionData, { merge: true });

    return {
      success: true,
      data: { ...cleanedTransactionData, id: transactionRef.id },
    };
  } catch (error: any) {
    console.error("Error creating or updating transaction:", error);
    return { success: false, msg: error.message };
  }
};

const updateWalletForNewTransaction = async (
  walletId: string,
  amount: number,
  type: string
) => {
  try {
    const walletRef = doc(firestore, "wallets", walletId);
    const walletSnapshot = await getDoc(walletRef);
    if (!walletSnapshot.exists()) {
      console.log("error updating wallet for new transaction");
      return { success: false, msg: "Wallet not found" };
    }
    const walletData = walletSnapshot.data() as WalletType;
    if (type == "expense" && walletData.amount! - amount < 0) {
      return {
        success: false,
        msg: "Selected wallet don't have enough balance",
      };
    }
    const updatedType = type === "income" ? "totalIncome" : "totalExpenses";
    const updatedWalletAmount =
      type == "income"
        ? Number(walletData.amount) + amount
        : Number(walletData.amount) - amount;
    const updatedTools =
      type == "income"
        ? Number(walletData.totalIncome) + amount
        : Number(walletData.totalExpenses) + amount;
    await updateDoc(walletRef, {
      amount: updatedWalletAmount,
      [updatedType]: updatedTools,
    });
    return { success: true, msg: "Wallet updated successfully" };
  } catch (error: any) {
    console.error("Error updating wallet for new transaction:", error);
    return { success: false, msg: error.message };
  }
};

const revertAndUpdateWallet = async (
  oldTransaction: TransactionType,
  newTransactionAmount: number,
  newTransactionType: string,
  newWalletId: string
) => {
  try {
    const originalWalletSnapshot = await getDoc(
      doc(firestore, "wallets", oldTransaction.walletId)
    );
    const originalWallet = originalWalletSnapshot.data() as WalletType;
    let newWalletSnapshot = await getDoc(
      doc(firestore, "wallets", newWalletId)
    );
    let newWallet = newWalletSnapshot.data() as WalletType;
    const revertType =
      oldTransaction.type == "income" ? "totalIncome" : "totalExpenses";
    const revertIncomeExpense: number =
      oldTransaction.type == "income"
        ? -Number(oldTransaction.amount)
        : Number(oldTransaction.amount);
    const revertedWalletAmount =
      Number(originalWallet.amount) + revertIncomeExpense;
    const revertedIncomeExpenseAmount =
      Number(originalWallet[revertType]) - Number(oldTransaction.amount);

    if (newTransactionType == "expense") {
      // if user tries to convert income to expense on the same wallet
      // or if user tries to increase the expense amount and don't have enough balance

      if (
        oldTransaction.walletId === newWalletId &&
        revertedWalletAmount < newTransactionAmount
      ) {
        return {
          success: false,
          msg: "Selected wallet don't have enough balance",
        };
      }
      // if user tries to add a expense from a new wallet but the wallet have don't have enough balance
      if (newWallet.amount! < newTransactionAmount) {
        return {
          success: false,
          msg: "Selected wallet don't have enough balance",
        };
      }
    }

    await createOrUpdateWallet({
      id: oldTransaction.walletId,
      amount: revertedWalletAmount,
      [revertType]: revertedIncomeExpenseAmount,
    });
    // revert completed
    ////////////////////////////////////////////////
    // refetch the new wallet beacuse we may have updated the wallet
    newWalletSnapshot = await getDoc(doc(firestore, "wallets", newWalletId));
    newWallet = newWalletSnapshot.data() as WalletType;
    const updatedType =
      newTransactionType === "income" ? "totalIncome" : "totalExpenses";
    const updatedTransactionAmount = Number(newTransactionAmount);

    const newWalletAmount =
      newTransactionType === "income"
        ? Number(newWallet.amount) + updatedTransactionAmount
        : Number(newWallet.amount) - updatedTransactionAmount;

    const newIncomeExpenseAmount =
      newTransactionType === "income"
        ? Number(newWallet.totalIncome) + updatedTransactionAmount
        : Number(newWallet.totalExpenses) + updatedTransactionAmount;

    await createOrUpdateWallet({
      id: newWalletId,
      amount: newWalletAmount,
      [updatedType]: newIncomeExpenseAmount,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error updating wallet for new transaction:", error);
    return { success: false, msg: error.message };
  }
};

export const deleteTransaction = async (
  transactionId: string,
  walletId: string
) => {
  try {
    const transactionRef = doc(firestore, "transactions", transactionId);
    const transactionSnapsShot = await getDoc(transactionRef);
    if (!transactionSnapsShot.exists()) { 
      return { success: false, msg: "Transaction not found" };
    }
    const transactionData = transactionSnapsShot.data() as TransactionType;
    const transactionType = transactionData?.type;
    const transactionAmount = transactionData?.amount;

    // fetch wallet to update the amount
    const newWalletSnapshot = await getDoc(doc(firestore, "wallets", walletId));
    const walletData = newWalletSnapshot.data() as WalletType;
    // check the fields to updated
    const updatedType =
      transactionType === "income" ? "totalIncome" : "totalExpenses";
    const newWalletAmount =
      walletData?.amount! -
      (transactionType === "income" ? transactionAmount : -transactionAmount!);
    const newIncomeExpenseAmount = walletData[updatedType]! - transactionAmount;
    // it its expense and the wallet can below zero
    if (transactionType == "expense" && newWalletAmount < 0) {
      return { success: false, msg: "You cannot delete this transaction" };
    }
    await createOrUpdateWallet({
      id: walletId,
      amount: newWalletAmount,
      [updatedType]: newIncomeExpenseAmount,
    });
    await deleteDoc(transactionRef);
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    return { success: false, msg: error.message };
  }
};
