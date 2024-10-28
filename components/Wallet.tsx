"use client";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import {
  addFunds,
  getSolBalanaceInUSD,
  withdrawFunds,
  sendFunds,
  fetchTokens,
  createToken,
  swapSolToUsdc,
} from "@/lib/utils";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import bs58 from "bs58";
import { derivePath } from "ed25519-hd-key";
import { useCallback, useEffect, useState } from "react";
import * as nacl from "tweetnacl";
import CreateWallet from "./CreateWallet";
import WalletCard from "./WalletCard";
import WalletDetails from "./WalletDetails";

interface Wallet {
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  derivationPath: string;
}

const Wallet = () => {
  const { toast } = useToast();
  const [seed, setSeed] = useState<string>("");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([]);
  const [visiblePhrases, setVisiblePhrases] = useState<boolean[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number>(0);
  const [bal, setBal] = useState(0.0);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [walletBalance, setWalletBalance] = useState(0.0);
  const [externalWalletBalance, setExternalWalletBalance] = useState(0.0);
  const [txSig, setTxSig] = useState("");
  const [tokens, setTokens] = useState<any[]>([]);
  const [lastAccount, setLastAccount] = useState<string | null>(null);

  useEffect(() => {
    const savedWallets = localStorage.getItem("wallets");
    if (savedWallets) {
      const parsedWallets = JSON.parse(savedWallets);
      setWallets(parsedWallets);
      setVisiblePrivateKeys(parsedWallets.map(() => false));
      setVisiblePhrases(parsedWallets.map(() => false));
    }
  }, []);

  const createWallet = async () => {
    const mnemonic = generateMnemonic();
    const newWallet = await generateWalletFromMnemonic(mnemonic, 0);
    updateWallets(newWallet);
  };

  const generateWalletFromMnemonic = async (
    mnemonic: string,
    accountIndex: number
  ): Promise<Wallet | null> => {
    if (!validateMnemonic(mnemonic)) {
      toast({
        variant: "destructive",
        title: "Invalid recovery phrase",
        description: "Please try again.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      return null;
    }

    try {
      const seedBuffer = mnemonicToSeedSync(mnemonic);
      setSeed(seedBuffer.toString("hex"));

      const path = `m/44'/501'/${accountIndex}'/0'`;
      const { key: derivedSeed } = derivePath(path, seedBuffer.toString("hex"));
      const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
      const keypair = web3.Keypair.fromSecretKey(secret);

      const privateKey = bs58.encode(secret);
      const publicKey = keypair.publicKey.toBase58();

      return {
        publicKey,
        privateKey,
        mnemonic,
        derivationPath: path,
      };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to generate wallet",
        description: "Please try again.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      return null;
    }
  };

  const updateWallets = (newWallet: Wallet | null) => {
    if (newWallet) {
      const updatedWallets = [...wallets, newWallet];
      setWallets(updatedWallets);
      localStorage.setItem("wallets", JSON.stringify(updatedWallets));
      setVisiblePrivateKeys([...visiblePrivateKeys, false]);
      setVisiblePhrases([...visiblePhrases, false]);
      setSelectedAccount(updatedWallets.length - 1);
      toast({
        title: "Success",
        description: "Wallet generated successfully!",
      });
    }
  };

  const handleCreateWallet = async () => {
    await createWallet();
  };

  const handleImportWallet = async (mnemonic: string) => {
    if (mnemonic) {
      const newWallet = await generateWalletFromMnemonic(mnemonic, 0);
      updateWallets(newWallet);
    } else {
      toast({
        variant: "destructive",
        title: "Empty mnemonic",
        description: "Please enter a valid mnemonic.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  };

  const handleCreateNewAccount = async () => {
    if (wallets.length > 0) {
      const mnemonic = wallets[0].mnemonic;
      const newAccountIndex = wallets.length;
      const newWallet = await generateWalletFromMnemonic(
        mnemonic,
        newAccountIndex
      );
      updateWallets(newWallet);
    }
  };

  const handleAccountChange = (value: string) => {
    setSelectedAccount(parseInt(value));
  };

  const fetchBalances = useCallback(async () => {
    if (wallets.length > 0 && selectedAccount < wallets.length) {
      const bal = await getSolBalanaceInUSD(wallets[selectedAccount].publicKey);
      setBal(bal);
    }

    if (publicKey) {
      const balance = await connection.getBalance(publicKey);
      setExternalWalletBalance(balance / web3.LAMPORTS_PER_SOL);
    }

    if (
      wallets.length > 0 &&
      selectedAccount < wallets.length &&
      wallets[selectedAccount].publicKey
    ) {
      const balance = await connection.getBalance(
        new web3.PublicKey(wallets[selectedAccount].publicKey)
      );
      setWalletBalance(balance / web3.LAMPORTS_PER_SOL);
    }

    if (wallets.length > 0 && selectedAccount < wallets.length) {
      if (lastAccount !== wallets[selectedAccount].publicKey) {
        const tokens = await fetchTokens(wallets[selectedAccount].publicKey);
        setTokens(tokens);
        setLastAccount(wallets[selectedAccount].publicKey);
      }
    }
  }, [selectedAccount, wallets, publicKey, connection, lastAccount]);

  useEffect(() => {
    fetchBalances();
  }, [selectedAccount, wallets, publicKey, connection, fetchBalances]);

  const handleTransaction = async (
    transactionType: "add" | "withdraw" | "send",
    amountInSol: number,
    toPublicKey?: string
  ) => {
    if (!connection || (!publicKey && transactionType !== "send")) {
      toast({
        title: "Error",
        description: "Please connect your wallet first!",
        variant: "destructive",
      });
      return;
    }

    if (amountInSol <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0!",
        variant: "destructive",
      });
      return;
    }

    const insufficientBalance =
      (transactionType === "add" && amountInSol > externalWalletBalance) ||
      (transactionType !== "add" && amountInSol > walletBalance);

    if (insufficientBalance) {
      toast({
        title: "Error",
        description: `Insufficient balance in ${
          transactionType === "add" ? "your wallet" : "the account"
        }!`,
        variant: "destructive",
      });
      return;
    }

    try {
      let signature;
      switch (transactionType) {
        case "add":
          signature = await addFunds(
            publicKey!,
            new web3.PublicKey(wallets[selectedAccount].publicKey),
            amountInSol,
            sendTransaction
          );
          break;
        case "withdraw":
          signature = await withdrawFunds(
            bs58.decode(wallets[selectedAccount].privateKey).toString(),
            publicKey!,
            amountInSol
          );
          break;
        case "send":
          signature = await sendFunds(
            bs58.decode(wallets[selectedAccount].privateKey).toString(),
            toPublicKey!,
            amountInSol
          );
          break;
      }

      setTxSig(signature);

      await fetchBalances();

      toast({
        title: "Success",
        description: `${
          transactionType === "add"
            ? "Transaction"
            : transactionType === "withdraw"
            ? "Withdrawal"
            : "Transaction"
        } completed successfully.`,
        action: (
          <ToastAction
            altText="View Transaction"
            onClick={() =>
              window.open(
                `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
                "_blank"
              )
            }
          >
            View Transaction
          </ToastAction>
        ),
      });
    } catch (error) {
      console.error("Transaction Error:", error);
      if (error instanceof web3.SendTransactionError) {
        console.error("SendTransactionError:", (error as any).error);
        toast({
          title: "Error",
          description: (error as any).error?.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `Transaction failed! Reason: ${(error as any).message}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleAddOrWithdraw = (isAddingFunds: boolean, amountInSol: number) => {
    handleTransaction(isAddingFunds ? "add" : "withdraw", amountInSol);
  };

  const handleSend = (toPublicKey: string, amountInSol: number) => {
    handleTransaction("send", amountInSol, toPublicKey);
  };

  const handleCreateToken = async (
    decimals: number,
    name: string,
    symbol: string,
    uri: string,
    description: string,
    mintAmount: number
  ) => {
    try {
      const transactionSignature = await createToken(
        connection,
        bs58.decode(wallets[selectedAccount].privateKey).toString(),
        new web3.PublicKey(wallets[selectedAccount].publicKey),
        null,
        decimals,
        mintAmount,
        name,
        symbol,
        uri,
        description
      );
      toast({
        title: "Success",
        description: `Token created successfully!`,
        action: (
          <ToastAction
            altText="View Transaction"
            onClick={() =>
              window.open(
                `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`,
                "_blank"
              )
            }
          >
            View Transaction
          </ToastAction>
        ),
      });
      const updatedTokens = await fetchTokens(
        wallets[selectedAccount].publicKey
      );
      setTokens(updatedTokens);
      const updatedBalance = await getSolBalanaceInUSD(
        wallets[selectedAccount].publicKey
      );
      setBal(updatedBalance);
      const updatedBalanceSol = await connection.getBalance(
        new web3.PublicKey(wallets[selectedAccount].publicKey)
      );
      setWalletBalance(updatedBalanceSol / web3.LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Token creation failed:", error);
      toast({
        title: "Error",
        description: `Token creation failed! Reason: ${(error as any).message}`,
        variant: "destructive",
      });
    }
  };

  const handleSwap = async (amountInSol: number) => {
    try {
      const transactionSignature = await swapSolToUsdc(
        bs58.decode(wallets[selectedAccount].privateKey).toString(),
        amountInSol
      );
      toast({
        title: "Success",
        description: `Swap completed successfully!`,
        action: (
          <ToastAction
            altText="View Transaction"
            onClick={() =>
              window.open(
                `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`,
                "_blank"
              )
            }
          >
            View Transaction
          </ToastAction>
        ),
      });
      await fetchBalances();
    } catch (error) {
      console.error("Swap failed:", error);
      toast({
        title: "Error",
        description: `Swap failed! Reason: ${(error as any).message}`,
        variant: "destructive",
      });
    }
  };
  return (
    <div className="w-full flex items-center justify-center">
      {wallets.length === 0 ? (
        <CreateWallet
          onCreateWallet={handleCreateWallet}
          onImportWallet={handleImportWallet}
        />
      ) : (
        <WalletCard
          wallets={wallets}
          selectedAccount={selectedAccount}
          bal={bal}
          walletBalance={walletBalance}
          tokens={tokens}
          onAccountChange={handleAccountChange}
          onSend={handleSend}
          onAddFunds={handleAddOrWithdraw}
          onWithdraw={handleAddOrWithdraw}
          onCreateNewAccount={handleCreateNewAccount}
          onCreateToken={handleCreateToken}
          onSwap={handleSwap}
        >
          <WalletDetails
            wallets={wallets}
            selectedAccount={selectedAccount}
            visiblePrivateKeys={visiblePrivateKeys}
            visiblePhrases={visiblePhrases}
            setVisiblePrivateKeys={setVisiblePrivateKeys}
            setVisiblePhrases={setVisiblePhrases}
          />
        </WalletCard>
      )}
    </div>
  );
};

export default Wallet;
