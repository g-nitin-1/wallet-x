import {
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createMint,
  createTransferInstruction,
  ExtensionType,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  LENGTH_SIZE,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  transfer,
  TYPE_SIZE,
} from "@solana/spl-token";
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  createRemoveKeyInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export async function getUSDConversionRate(amount: number): Promise<number> {
  const response = await fetch("https://price.jup.ag/v6/price?ids=SOL", {
    method: "GET",
  });

  const data = await response.json();

  const currentPrice = data.data?.SOL?.price ?? 0;

  const usdAmount = amount * currentPrice;

  return usdAmount;
}
export async function getSolBalanaceInUSD(publicKey: string): Promise<number> {
  let wallet = new PublicKey(publicKey);
  const userSol = (await connection.getBalance(wallet)) / LAMPORTS_PER_SOL;

  const response = await fetch("https://price.jup.ag/v6/price?ids=SOL", {
    method: "GET",
  });

  const data = await response.json();

  const currentPrice = data.data?.SOL?.price ?? 0;

  const userBal = userSol * currentPrice;

  return userBal;
}

export async function addFunds(
  fromPublicKey: PublicKey,
  toPublicKey: PublicKey,
  amount: number,
  sendTransaction: (
    transaction: Transaction,
    connection: Connection
  ) => Promise<string>
): Promise<string> {
  const transaction = new Transaction();
  const instruction = SystemProgram.transfer({
    fromPubkey: fromPublicKey,
    lamports: amount * LAMPORTS_PER_SOL,
    toPubkey: toPublicKey,
  });

  transaction.add(instruction);

  try {
    const signature = await sendTransaction(transaction, connection);
    return signature;
  } catch (error) {
    console.error("Transaction Error:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}

export async function withdrawFunds(
  fromPrivateKey: string,
  toPublicKey: PublicKey,
  amount: number
): Promise<string> {
  const fromKeypair = Keypair.fromSecretKey(
    Uint8Array.from(fromPrivateKey.split(",").map(Number))
  );
  const transaction = new Transaction();
  const instruction = SystemProgram.transfer({
    fromPubkey: fromKeypair.publicKey,
    lamports: amount * LAMPORTS_PER_SOL,
    toPubkey: toPublicKey,
  });

  transaction.add(instruction);

  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      fromKeypair,
    ]);
    return signature;
  } catch (error) {
    console.error("heheheh");
    console.error("Transaction Error:", error);

    throw new Error("Transaction failed!");
  }
}

export async function sendFunds(
  fromPrivateKey: string,
  toPublicKey: string,
  amount: number,
  mintAddress?: string // Optional parameter to specify SPL token mint
): Promise<string> {
  const fromKeypair = Keypair.fromSecretKey(
    Uint8Array.from(fromPrivateKey.split(",").map(Number))
  );

  const toPublicKeyObj = new PublicKey(toPublicKey);
  const transaction = new Transaction();

  if (mintAddress) {
    // If mintAddress is provided, send SPL token
    const mintPublicKey = new PublicKey(mintAddress);

    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeypair,
      mintPublicKey,
      fromKeypair.publicKey,
      undefined,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeypair,
      mintPublicKey,
      toPublicKeyObj,
      undefined,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    const transferInstruction = createTransferInstruction(
      fromTokenAccount.address,
      toTokenAccount.address,
      fromKeypair.publicKey,
      amount,
      [],
      TOKEN_2022_PROGRAM_ID
    );

    transaction.add(transferInstruction);
  } else {
    // If no mintAddress is provided, send SOL
    const instruction = SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      lamports: amount * LAMPORTS_PER_SOL,
      toPubkey: toPublicKeyObj,
    });

    transaction.add(instruction);
  }

  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      fromKeypair,
    ]);
    return signature;
  } catch (error) {
    console.error("Transaction Error:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}

export async function fetchTokens(publicKey: string) {
  const wallet = new PublicKey(publicKey);
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
    programId: TOKEN_2022_PROGRAM_ID,
  });
  const tokens = await Promise.all(
    tokenAccounts.value.map(async (accountInfo) => {
      const accountData = accountInfo.account.data.parsed.info;
      const mintAddress = new PublicKey(accountData.mint);

      const mintInfo = await connection.getParsedAccountInfo(mintAddress);
      const data = mintInfo.value?.data;

      let name = null;
      let symbol = null;

      if (data && typeof data === "object" && "parsed" in data) {
        const info = data.parsed?.info?.extensions?.[1]?.state || null;
        if (info) {
          name = info.name ?? null;
          symbol = info.symbol ?? null;
        }
        // console.log(name, symbol);
      }

      return {
        mint: accountData.mint,
        amount: accountData.tokenAmount.uiAmount,
        decimals: accountData.tokenAmount.decimals,
        name: name,
        symbol: symbol,
      };
    })
  );

  return tokens;
}

export async function createToken(
  connection: Connection,
  fromPrivateKey: string,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey | null,
  decimals: number = 9,
  mintAmount: number = 100000000000,
  name: string = "OPOS",
  symbol: string = "OPOS",
  uri: string = "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/DeveloperPortal/metadata.json",
  description: string = "Only Possible On Solana"
) {
  const fromKeypair = Keypair.fromSecretKey(
    Uint8Array.from(fromPrivateKey.split(",").map(Number))
  );
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  const metaData: TokenMetadata = {
    updateAuthority: mintAuthority,
    mint: mint,
    name: name,
    symbol: symbol,
    uri: uri,
    additionalMetadata: [["description", description]],
  };

  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
  const metadataLen = pack(metaData).length;

  const mintLen = getMintLen([ExtensionType.MetadataPointer]);

  const lamports = await connection.getMinimumBalanceForRentExemption(
    mintLen + metadataExtension + metadataLen
  );

  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: mintAuthority,
    newAccountPubkey: mint,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  });

  const initializeMetadataPointerInstruction =
    createInitializeMetadataPointerInstruction(
      mint,
      mintAuthority,
      mint,
      TOKEN_2022_PROGRAM_ID
    );

  const initializeMintInstruction = createInitializeMintInstruction(
    mint,
    decimals,
    mintAuthority,
    null,
    TOKEN_2022_PROGRAM_ID
  );

  const initializeMetadataInstruction = createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mint,
    updateAuthority: mintAuthority,
    mint: mint,
    mintAuthority: mintAuthority,
    name: metaData.name,
    symbol: metaData.symbol,
    uri: metaData.uri,
  });

  const updateFieldInstruction = createUpdateFieldInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mint,
    updateAuthority: mintAuthority,
    field: metaData.additionalMetadata[0][0], // key
    value: metaData.additionalMetadata[0][1], // value
  });
  let transaction: Transaction;
  let transactionSignature: string;

  transaction = new Transaction().add(
    createAccountInstruction,
    initializeMetadataPointerInstruction,
    initializeMintInstruction,
    initializeMetadataInstruction,
    updateFieldInstruction
  );

  transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [fromKeypair, mintKeypair]
  );
  console.log(
    "\nCreate Mint Account:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
  );
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromKeypair,
    mint,
    fromKeypair.publicKey,
    undefined,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  await mintTo(
    connection,
    fromKeypair,
    mint,
    tokenAccount.address,
    mintAuthority,
    mintAmount * 10 ** decimals,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  console.log("Token Created:", mint.toBase58());
  return transactionSignature;
}

export async function swapSolToUsdc(
  fromPrivateKey: string,
  amount: number
): Promise<string> {
  const fromKeypair = Keypair.fromSecretKey(
    Uint8Array.from(fromPrivateKey.split(",").map(Number))
  );

  const quoteResponse = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${
      amount * LAMPORTS_PER_SOL
    }&slippageBps=50`
  );
  const quoteData = await quoteResponse.json();

  const { swapTransaction } = await (
    await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: fromKeypair.publicKey.toBase58(),
        wrapUnwrapSOL: true,
      }),
    })
  ).json();

  const swapTransactionBuf = new Uint8Array(
    Buffer.from(swapTransaction, "base64")
  );
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  transaction.sign([fromKeypair]);
  const latestBlockHash = await connection.getLatestBlockhash();

  // Execute the transaction
  const rawTransaction = transaction.serialize();
  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    maxRetries: 2,
  });
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txid,
  });
  return txid;
}
